import { NextResponse } from 'next/server';
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

export async function POST() {
  console.log('🔄 Reset test data API called');
  console.log('NODE_ENV:', process.env.NODE_ENV);

  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    console.error('❌ Not in development mode');
    return NextResponse.json(
      { success: false, message: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
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

    console.log('Deleting coach availabilities...');
    await db.delete(coachAvailabilities);

    console.log('✅ All test data deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'All test data has been reset successfully'
    });
  } catch (error) {
    console.error('❌ Error resetting test data:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Failed to reset test data: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}
