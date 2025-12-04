import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  bookings,
  trainingSessions,
  recurringBookings,
  weeklyAvailability,
  blockedSlots,
  availabilityAdditions,
} from '@/lib/db/schema';

export async function POST() {
  // SECURITY: Multiple checks to prevent accidental production use
  const isDev = process.env.NODE_ENV === 'development';
  const devEndpointsEnabled = process.env.ENABLE_DEV_ENDPOINTS === 'true';

  // Only allow in development AND when explicitly enabled
  if (!isDev) {
    return NextResponse.json(
      { success: false, message: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  // In development, optionally require explicit flag
  if (process.env.ENABLE_DEV_ENDPOINTS !== undefined && !devEndpointsEnabled) {
    return NextResponse.json(
      { success: false, message: 'Dev endpoints are disabled. Set ENABLE_DEV_ENDPOINTS=true' },
      { status: 403 }
    );
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

    return NextResponse.json({
      success: true,
      message: 'All test data has been reset successfully'
    });
  } catch (error) {
    console.error('Error resetting test data:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to reset test data'
      },
      { status: 500 }
    );
  }
}
