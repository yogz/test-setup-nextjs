'use server';

import { db } from '@/lib/db';
import {
  bookings,
  trainingSessions,
  recurringBookings,
  weeklyAvailability,
  blockedSlots,
  availabilityAdditions,
  coachAvailabilities,
} from '@/lib/db/schema';

/**
 * Development only: Reset all bookings, availability, and recurring slots
 * This is useful for testing to start fresh
 */
export async function resetTestData() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('This action is only available in development mode');
  }

  try {
    // Delete in order to respect foreign key constraints
    // 1. Delete bookings first (they reference training sessions)
    await db.delete(bookings);

    // 2. Delete training sessions
    await db.delete(trainingSessions);

    // 3. Delete recurring bookings
    await db.delete(recurringBookings);

    // 4. Delete all availability data
    await db.delete(weeklyAvailability);
    await db.delete(blockedSlots);
    await db.delete(availabilityAdditions);
    await db.delete(coachAvailabilities);

    return { success: true, message: 'All test data has been reset successfully' };
  } catch (error) {
    console.error('Error resetting test data:', error);
    return { success: false, message: 'Failed to reset test data' };
  }
}
