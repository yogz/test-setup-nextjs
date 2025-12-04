'use server';

import { db } from '@/lib/db';
import {
  bookings,
  trainingSessions,
  recurringBookings,
  weeklyAvailability,
  blockedSlots,
  availabilityAdditions,
} from '@/lib/db/schema';

/**
 * Development only: Reset all bookings, availability, and recurring slots
 * This is useful for testing to start fresh
 */
export async function resetTestData() {
  console.log('🔄 resetTestData called');
  console.log('NODE_ENV:', process.env.NODE_ENV);

  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    console.error('❌ Not in development mode');
    return { success: false, message: 'This action is only available in development mode' };
  }

  try {
    console.log('🗑️  Starting deletion of test data...');

    // Delete in order to respect foreign key constraints
    // 1. Delete bookings first (they reference training sessions)
    console.log('Deleting bookings...');
    await db.delete(bookings);

    // 2. Delete training sessions
    console.log('Deleting training sessions...');
    await db.delete(trainingSessions);

    // 3. Delete recurring bookings
    console.log('Deleting recurring bookings...');
    await db.delete(recurringBookings);

    // 4. Delete all availability data
    console.log('Deleting weekly availability...');
    await db.delete(weeklyAvailability);

    console.log('Deleting blocked slots...');
    await db.delete(blockedSlots);

    console.log('Deleting availability additions...');
    await db.delete(availabilityAdditions);

    console.log('✅ All test data deleted successfully');
    return { success: true, message: 'All test data has been reset successfully' };
  } catch (error) {
    console.error('❌ Error resetting test data:', error);
    return {
      success: false,
      message: `Failed to reset test data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
