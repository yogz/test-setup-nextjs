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
import { eq, and, gte, lte, sql, inArray } from 'drizzle-orm';
import { bookings } from '@/lib/db/schema';
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
  memberId?: string; // Optional: only for coach/owner to book for a member
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

    const { coachId, dayOfWeek, startTime, endTime, startDate, endDate, memberId } = data;

    // Determine the target member ID
    let targetMemberId = user.id;

    if (memberId && memberId !== user.id) {
      // If trying to book for someone else, must be coach or owner
      if (user.role !== 'coach' && user.role !== 'owner') {
        return { success: false, error: 'Unauthorized to book for other members' };
      }
      targetMemberId = memberId;

      // Verify target member exists
      const targetMember = await db.query.users.findFirst({
        where: eq(users.id, targetMemberId),
      });

      if (!targetMember || targetMember.role !== 'member') {
        return { success: false, error: 'Target member not found' };
      }
    }

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
    // Helper to convert time string to minutes for proper comparison
    const timeToMinutes = (time: string): number => {
      const [hours, mins] = time.split(':').map(Number);
      return hours * 60 + mins;
    };

    const isInAvailability = coach.weeklyAvailability.some(avail => {
      if (avail.dayOfWeek !== dayOfWeek || !avail.isIndividual) {
        return false;
      }
      // Compare numerically to avoid string comparison issues (e.g., "9:00" > "10:00")
      const requestStart = timeToMinutes(startTime);
      const requestEnd = timeToMinutes(endTime);
      const availStart = timeToMinutes(avail.startTime);
      const availEnd = timeToMinutes(avail.endTime);
      return requestStart >= availStart && requestEnd <= availEnd;
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
      memberId: targetMemberId,
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

    revalidatePath('/bookings');
    revalidatePath('/member/recurring-bookings');

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

    // 4. Cancel future sessions and their bookings
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

    // Get session IDs before updating to also cancel their bookings
    const sessionsBeingCancelled = await db.query.trainingSessions.findMany({
      where: sessionsToCancel,
      columns: { id: true },
    });
    const sessionIds = sessionsBeingCancelled.map(s => s.id);

    // Cancel sessions
    await db.update(trainingSessions)
      .set({ status: 'cancelled' })
      .where(sessionsToCancel);

    // Also cancel bookings for these sessions (data integrity)
    if (sessionIds.length > 0) {
      await db.update(bookings)
        .set({
          status: 'CANCELLED_BY_MEMBER',
          cancelledAt: new Date()
        })
        .where(and(
          inArray(bookings.sessionId, sessionIds),
          eq(bookings.status, 'CONFIRMED')
        ));
    }

    revalidatePath('/bookings');
    revalidatePath('/member/recurring-bookings');

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

// ============================================================================
// CANCEL A SINGLE RECURRING SESSION
// ============================================================================

export async function cancelRecurringSessionAction(data: { sessionId: string }) {
  try {
    const user = await getAuthenticatedUser();
    const { sessionId } = data;

    // 1. Find the session
    const session = await db.query.trainingSessions.findFirst({
      where: eq(trainingSessions.id, sessionId),
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // 2. Verify ownership
    if (session.memberId !== user.id && user.role !== 'owner' && user.role !== 'coach') {
      return { success: false, error: 'Unauthorized' };
    }

    // 3. Check if session is in the future
    if (session.startTime < new Date()) {
      return { success: false, error: 'Cannot cancel past sessions' };
    }

    // 4. Cancel the session
    await db.update(trainingSessions)
      .set({ status: 'cancelled' })
      .where(eq(trainingSessions.id, sessionId));

    // 5. Also cancel any associated bookings
    await db.update(bookings)
      .set({
        status: 'CANCELLED_BY_MEMBER',
        cancelledAt: new Date()
      })
      .where(and(
        eq(bookings.sessionId, sessionId),
        eq(bookings.status, 'CONFIRMED')
      ));

    revalidatePath('/bookings');
    revalidatePath('/member/recurring-bookings');
    revalidatePath('/coach/sessions');

    return {
      success: true,
      message: 'Session cancelled successfully'
    };
  } catch (error) {
    console.error('Cancel recurring session error:', error);
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
    const start = new Date(startDate);
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + (weeksAhead * 7));

    const end = endDate
      ? new Date(Math.min(horizon.getTime(), new Date(endDate).getTime()))
      : horizon;

    // 3. Get coach's default room
    const roomId = (booking.coach as any).coachSettings?.[0]?.defaultRoomId;
    if (!roomId) {
      return { success: false, error: 'Coach has no default room configured' };
    }

    // 4. Pre-fetch all existing sessions for this recurring booking (fixes N+1 query)
    const existingSessions = await db.query.trainingSessions.findMany({
      where: eq(trainingSessions.recurringBookingId, recurringBookingId),
    });
    const existingSessionTimes = new Set(
      existingSessions.map(s => s.startTime.getTime())
    );

    // Pre-process blocked slots for efficient lookup
    const blockedSlotsList = (booking.coach as any).blockedSlots || [];

    // 5. Generate sessions for each occurrence
    const sessionsToCreate = [];
    const currentDate = new Date(start);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= end) {
      if (currentDate.getDay() === dayOfWeek) {
        // Parse time (validate format first)
        const startParts = startTime.split(':');
        const endParts = endTime.split(':');
        if (startParts.length !== 2 || endParts.length !== 2) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }
        const [startHour, startMin] = startParts.map(Number);
        const [endHour, endMin] = endParts.map(Number);

        // Validate parsed values
        if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        const sessionStart = new Date(currentDate);
        sessionStart.setHours(startHour, startMin, 0, 0);

        const sessionEnd = new Date(currentDate);
        sessionEnd.setHours(endHour, endMin, 0, 0);

        // Check if session already exists (using Set for O(1) lookup)
        if (existingSessionTimes.has(sessionStart.getTime())) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        // Check if slot is blocked
        const isBlocked = blockedSlotsList.some((block: any) =>
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

    // 5. Insert sessions AND bookings
    if (sessionsToCreate.length > 0) {
      // Insert sessions and get their IDs
      const insertedSessions = await db.insert(trainingSessions).values(sessionsToCreate).returning({ id: trainingSessions.id });

      // Create corresponding bookings for each session
      const bookingsToCreate = insertedSessions.map(session => ({
        sessionId: session.id,
        memberId: booking.memberId,
        status: 'CONFIRMED' as const,
      }));

      await db.insert(bookings).values(bookingsToCreate);
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
