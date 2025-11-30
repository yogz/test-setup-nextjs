'use server';

import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import {
  recurringBookings,
  trainingSessions,
  weeklyAvailability,
  blockedSlots,
  users,
} from '@/lib/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ============================================================================
// TYPES
// ============================================================================

export type CreateRecurringBookingInput = {
  coachId: string;
  dayOfWeek: number; // 0-6
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, null = indefinite
};

export type CancelRecurringBookingInput = {
  recurringBookingId: string;
  futureOnly?: boolean;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session.user;
}

// ============================================================================
// CREATE RECURRING BOOKING
// ============================================================================

export async function createRecurringBookingAction(data: CreateRecurringBookingInput) {
  try {
    const user = await getAuthenticatedUser();

    if (user.role !== 'member' && user.role !== 'coach' && user.role !== 'owner') {
      return { success: false, error: 'Only members can create bookings' };
    }

    const { coachId, dayOfWeek, startTime, endTime, startDate, endDate } = data;

    // 1. Verify coach exists
    const coach = await db.query.users.findFirst({
      where: eq(users.id, coachId),
      with: {
        weeklyAvailability: true,
        coachSettings: true,
      },
    });

    if (!coach || (coach.role !== 'coach' && coach.role !== 'owner')) {
      return { success: false, error: 'Coach not found' };
    }

    // 2. Verify the time slot is within coach's weekly availability
    const isInAvailability = coach.weeklyAvailability.some(avail => {
      if (avail.dayOfWeek !== dayOfWeek || !avail.isIndividual) {
        return false;
      }
      return startTime >= avail.startTime && endTime <= avail.endTime;
    });

    if (!isInAvailability) {
      return {
        success: false,
        error: 'This time slot is not available in the coach\'s weekly schedule'
      };
    }

    // 3. Check for conflicts with existing recurring bookings
    const conflictingBooking = await db.query.recurringBookings.findFirst({
      where: and(
        eq(recurringBookings.coachId, coachId),
        eq(recurringBookings.dayOfWeek, dayOfWeek),
        eq(recurringBookings.status, 'ACTIVE'),
        // Check for time overlap
        sql`(
          (${recurringBookings.startTime} <= ${startTime} AND ${recurringBookings.endTime} > ${startTime})
          OR
          (${recurringBookings.startTime} < ${endTime} AND ${recurringBookings.endTime} >= ${endTime})
          OR
          (${recurringBookings.startTime} >= ${startTime} AND ${recurringBookings.endTime} <= ${endTime})
        )`
      ),
    });

    if (conflictingBooking) {
      return {
        success: false,
        error: 'This time slot conflicts with an existing recurring booking'
      };
    }

    // 4. Create the recurring booking
    const [newRecurringBooking] = await db.insert(recurringBookings).values({
      memberId: user.id,
      coachId,
      dayOfWeek,
      startTime,
      endTime,
      startDate,
      endDate: endDate || null,
      status: 'ACTIVE',
    }).returning();

    // 5. Generate initial sessions (next 6 weeks)
    await generateSessionsForRecurringBooking(newRecurringBooking.id, 6);

    revalidatePath('/schedule');
    revalidatePath('/bookings');

    return {
      success: true,
      message: 'Recurring booking created successfully',
      data: newRecurringBooking,
    };
  } catch (error) {
    console.error('Create recurring booking error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// CANCEL RECURRING BOOKING
// ============================================================================

export async function cancelRecurringBookingAction(data: CancelRecurringBookingInput) {
  try {
    const user = await getAuthenticatedUser();
    const { recurringBookingId, futureOnly = true } = data;

    // 1. Find the recurring booking
    const booking = await db.query.recurringBookings.findFirst({
      where: eq(recurringBookings.id, recurringBookingId),
    });

    if (!booking) {
      return { success: false, error: 'Recurring booking not found' };
    }

    // 2. Check ownership
    if (booking.memberId !== user.id && user.role !== 'owner') {
      return { success: false, error: 'Unauthorized' };
    }

    // 3. Mark recurring booking as cancelled
    await db.update(recurringBookings)
      .set({
        status: 'CANCELLED',
        cancelledAt: new Date(),
      })
      .where(eq(recurringBookings.id, recurringBookingId));

    // 4. Cancel future sessions
    const now = new Date();
    const sessionsToCancel = futureOnly
      ? and(
          eq(trainingSessions.recurringBookingId, recurringBookingId),
          gte(trainingSessions.startTime, now),
          eq(trainingSessions.status, 'scheduled')
        )
      : and(
          eq(trainingSessions.recurringBookingId, recurringBookingId),
          eq(trainingSessions.status, 'scheduled')
        );

    await db.update(trainingSessions)
      .set({ status: 'cancelled' })
      .where(sessionsToCancel);

    revalidatePath('/schedule');
    revalidatePath('/bookings');

    return {
      success: true,
      message: 'Recurring booking cancelled successfully'
    };
  } catch (error) {
    console.error('Cancel recurring booking error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// GET RECURRING BOOKINGS
// ============================================================================

export async function getMyRecurringBookingsAction() {
  try {
    const user = await getAuthenticatedUser();

    const bookings = await db.query.recurringBookings.findMany({
      where: eq(recurringBookings.memberId, user.id),
      with: {
        coach: true,
        sessions: {
          where: gte(trainingSessions.startTime, new Date()),
          orderBy: (sessions, { asc }) => [asc(sessions.startTime)],
          limit: 10, // Show next 10 occurrences
        },
      },
      orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
    });

    return { success: true, data: bookings };
  } catch (error) {
    console.error('Get recurring bookings error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// GENERATE SESSIONS FOR RECURRING BOOKING
// ============================================================================

export async function generateSessionsForRecurringBooking(
  recurringBookingId: string,
  weeksAhead: number = 6
) {
  try {
    // 1. Get the recurring booking
    const booking = await db.query.recurringBookings.findFirst({
      where: eq(recurringBookings.id, recurringBookingId),
      with: {
        coach: {
          with: {
            coachSettings: true,
            blockedSlots: true,
          },
        },
      },
    });

    if (!booking || booking.status !== 'ACTIVE') {
      return { success: false, error: 'Recurring booking not found or inactive' };
    }

    const { dayOfWeek, startTime, endTime, startDate, endDate } = booking;

    // 2. Calculate date range
    const today = new Date();
    const start = new Date(Math.max(today.getTime(), new Date(startDate).getTime()));
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + (weeksAhead * 7));

    const end = endDate
      ? new Date(Math.min(horizon.getTime(), new Date(endDate).getTime()))
      : horizon;

    // 3. Get coach's default room
    const roomId = booking.coach.coachSettings?.[0]?.defaultRoomId;
    if (!roomId) {
      return { success: false, error: 'Coach has no default room configured' };
    }

    // 4. Generate sessions for each occurrence
    const sessionsToCreate = [];
    const currentDate = new Date(start);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= end) {
      if (currentDate.getDay() === dayOfWeek) {
        // Parse time
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const sessionStart = new Date(currentDate);
        sessionStart.setHours(startHour, startMin, 0, 0);

        const sessionEnd = new Date(currentDate);
        sessionEnd.setHours(endHour, endMin, 0, 0);

        // Skip if in the past
        if (sessionStart < today) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        // Check if session already exists
        const existingSession = await db.query.trainingSessions.findFirst({
          where: and(
            eq(trainingSessions.recurringBookingId, recurringBookingId),
            eq(trainingSessions.startTime, sessionStart)
          ),
        });

        if (existingSession) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        // Check if slot is blocked
        const isBlocked = booking.coach.blockedSlots.some(block =>
          block.startTime <= sessionStart && block.endTime > sessionStart
        );

        if (!isBlocked) {
          sessionsToCreate.push({
            coachId: booking.coachId,
            memberId: booking.memberId,
            roomId,
            recurringBookingId: booking.id,
            title: 'Session individuelle',
            type: 'ONE_TO_ONE' as const,
            startTime: sessionStart,
            endTime: sessionEnd,
            capacity: 1,
            status: 'scheduled' as const,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 5. Insert sessions
    if (sessionsToCreate.length > 0) {
      await db.insert(trainingSessions).values(sessionsToCreate);
    }

    return {
      success: true,
      message: `${sessionsToCreate.length} session(s) generated`,
      count: sessionsToCreate.length,
    };
  } catch (error) {
    console.error('Generate sessions error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
