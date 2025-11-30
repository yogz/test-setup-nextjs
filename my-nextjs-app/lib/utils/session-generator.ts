/**
 * Session Generation Utilities
 *
 * This module contains the core logic for generating sessions from:
 * 1. Recurring bookings (member reservations)
 * 2. Coach availability templates (open slots)
 */

import { db } from '@/lib/db';
import { recurringBookings, trainingSessions, weeklyAvailability, blockedSlots } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export type SessionGenerationResult = {
  totalGenerated: number;
  fromRecurringBookings: number;
  fromAvailabilityTemplate: number;
  markedCompleted: number;
};

/**
 * Main function to generate all sessions
 * Called by cron job
 */
export async function generateAllSessions(weeksAhead: number = 6): Promise<SessionGenerationResult> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + (weeksAhead * 7));

  let fromRecurringBookings = 0;
  let fromAvailabilityTemplate = 0;
  let markedCompleted = 0;

  // 1. Generate sessions from active recurring bookings
  const activeRecurringBookings = await db.query.recurringBookings.findMany({
    where: eq(recurringBookings.status, 'ACTIVE'),
    with: {
      coach: {
        with: {
          coachSettings: true,
        },
      },
    },
  });

  for (const booking of activeRecurringBookings) {
    const result = await generateSessionsForRecurringBookingInternal(booking, today, horizon);
    fromRecurringBookings += result;
  }

  // 2. Mark past sessions as completed
  const markedResult = await markPastSessionsCompleted();
  markedCompleted = markedResult;

  return {
    totalGenerated: fromRecurringBookings + fromAvailabilityTemplate,
    fromRecurringBookings,
    fromAvailabilityTemplate,
    markedCompleted,
  };
}

/**
 * Generate sessions for a specific recurring booking
 */
async function generateSessionsForRecurringBookingInternal(
  booking: any,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const { id, dayOfWeek, startTime, endTime, coachId, memberId, startDate: bookingStartDate, endDate: bookingEndDate } = booking;

  const roomId = booking.coach.coachSettings?.[0]?.defaultRoomId;
  if (!roomId) {
    console.warn(`Coach ${coachId} has no default room`);
    return 0;
  }

  // Get blocked slots for this coach
  const blockedSlotsData = await db.query.blockedSlots.findMany({
    where: and(
      eq(blockedSlots.coachId, coachId),
      gte(blockedSlots.startTime, startDate),
      lte(blockedSlots.endTime, endDate)
    ),
  });

  const sessionsToCreate = [];
  const currentDate = new Date(Math.max(startDate.getTime(), new Date(bookingStartDate).getTime()));

  const actualEndDate = bookingEndDate
    ? new Date(Math.min(endDate.getTime(), new Date(bookingEndDate).getTime()))
    : endDate;

  while (currentDate <= actualEndDate) {
    if (currentDate.getDay() === dayOfWeek) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const sessionStart = new Date(currentDate);
      sessionStart.setHours(startHour, startMin, 0, 0);

      const sessionEnd = new Date(currentDate);
      sessionEnd.setHours(endHour, endMin, 0, 0);

      // Skip if in the past
      if (sessionStart < new Date()) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Check if session already exists
      const existingSession = await db.query.trainingSessions.findFirst({
        where: and(
          eq(trainingSessions.recurringBookingId, id),
          eq(trainingSessions.startTime, sessionStart)
        ),
      });

      if (existingSession) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Check if slot is blocked
      const isBlocked = blockedSlotsData.some(block =>
        block.startTime <= sessionStart && block.endTime > sessionStart
      );

      if (!isBlocked) {
        sessionsToCreate.push({
          coachId,
          memberId,
          roomId,
          recurringBookingId: id,
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

  if (sessionsToCreate.length > 0) {
    await db.insert(trainingSessions).values(sessionsToCreate);
  }

  return sessionsToCreate.length;
}

/**
 * Mark all past scheduled sessions as completed
 */
export async function markPastSessionsCompleted(): Promise<number> {
  const now = new Date();

  const result = await db
    .update(trainingSessions)
    .set({ status: 'completed' })
    .where(
      and(
        eq(trainingSessions.status, 'scheduled'),
        lte(trainingSessions.endTime, now)
      )
    )
    .returning();

  return result.length;
}
