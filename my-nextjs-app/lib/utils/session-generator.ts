/**
 * Session Generation Utilities
 *
 * This module contains the core logic for generating sessions from:
 * 1. Recurring bookings (member reservations)
 * 2. Coach availability templates (open slots)
 */

import { db } from '@/lib/db';
import { recurringBookings, trainingSessions, weeklyAvailability, blockedSlots, availabilityAdditions } from '@/lib/db/schema';
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

  // Get weekly availability for this day
  const availabilitySlots = await db.query.weeklyAvailability.findMany({
    where: and(
      eq(weeklyAvailability.coachId, coachId),
      eq(weeklyAvailability.dayOfWeek, dayOfWeek)
    ),
  });

  // Get availability additions for this coach (covering the whole range for simplicity, or fetch per day if optimization needed)
  // For simplicity in this loop, we might want to fetch all relevant additions once
  const additionsData = await db.query.availabilityAdditions.findMany({
    where: and(
      eq(availabilityAdditions.coachId, coachId),
      gte(availabilityAdditions.startTime, startDate),
      lte(availabilityAdditions.endTime, endDate)
    ),
  });

  // Pre-fetch all existing sessions for this recurring booking (fixes N+1 query)
  const existingSessions = await db.query.trainingSessions.findMany({
    where: eq(trainingSessions.recurringBookingId, id),
    columns: { startTime: true },
  });
  const existingSessionTimes = new Set(
    existingSessions.map(s => s.startTime.getTime())
  );

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

      // Check if session already exists (O(1) lookup instead of database query)
      if (existingSessionTimes.has(sessionStart.getTime())) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Check if slot is blocked
      const isBlocked = blockedSlotsData.some(block =>
        block.startTime <= sessionStart && block.endTime > sessionStart
      );

      // Check if slot is allowed by weekly availability
      const startStr = sessionStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const endStr = sessionEnd.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      const isAllowed = availabilitySlots.some(slot => {
        return startStr >= slot.startTime && endStr <= slot.endTime;
      }) || additionsData.some(addition => {
        return addition.startTime <= sessionStart && addition.endTime >= sessionEnd;
      });

      if (!isBlocked && isAllowed) {
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
