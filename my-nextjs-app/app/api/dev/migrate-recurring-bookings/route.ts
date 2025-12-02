import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trainingSessions, bookings } from '@/lib/db/schema';
import { isNotNull, eq, and } from 'drizzle-orm';

/**
 * Migration script: Create missing bookings for recurring sessions
 *
 * This script finds all trainingSessions that:
 * - Have a recurringBookingId (they are from a recurring booking)
 * - Have a memberId
 * - Don't have a corresponding entry in the bookings table
 *
 * And creates the missing bookings.
 */
export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  console.log('🔄 Migration: Creating missing bookings for recurring sessions...');

  try {
    // 1. Find all recurring sessions with a member
    const recurringSessions = await db.query.trainingSessions.findMany({
      where: and(
        isNotNull(trainingSessions.recurringBookingId),
        isNotNull(trainingSessions.memberId)
      ),
    });

    console.log(`Found ${recurringSessions.length} recurring sessions`);

    // 2. Get all existing bookings for these sessions
    const existingBookings = await db.query.bookings.findMany({
      columns: { sessionId: true },
    });
    const existingSessionIds = new Set(existingBookings.map(b => b.sessionId));

    // 3. Find sessions without bookings
    const sessionsWithoutBookings = recurringSessions.filter(
      s => !existingSessionIds.has(s.id)
    );

    console.log(`Found ${sessionsWithoutBookings.length} sessions without bookings`);

    // 4. Create missing bookings
    if (sessionsWithoutBookings.length > 0) {
      const bookingsToCreate = sessionsWithoutBookings.map(session => ({
        sessionId: session.id,
        memberId: session.memberId!,
        status: session.status === 'cancelled' ? 'CANCELLED_BY_MEMBER' as const : 'CONFIRMED' as const,
      }));

      await db.insert(bookings).values(bookingsToCreate);
      console.log(`✅ Created ${bookingsToCreate.length} bookings`);
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete`,
      stats: {
        totalRecurringSessions: recurringSessions.length,
        sessionsWithoutBookings: sessionsWithoutBookings.length,
        bookingsCreated: sessionsWithoutBookings.length,
      },
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}
