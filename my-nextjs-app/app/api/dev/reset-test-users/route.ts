import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * Development-only endpoint to completely reset test users
 * Access: GET /api/dev/reset-test-users
 */
export async function GET(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const testEmails = [
        'coach@coach.coach',
        'owner@owner.owner',
        'nicolas.a.perez@gmail.com',
    ];

    try {
        // Use raw SQL to delete everything for these users
        for (const email of testEmails) {
            await db.execute(sql`DELETE FROM bookings WHERE member_id IN (SELECT id FROM users WHERE email = ${email})`);
            await db.execute(sql`DELETE FROM memberships WHERE member_id IN (SELECT id FROM users WHERE email = ${email})`);
            await db.execute(sql`DELETE FROM payments WHERE member_id IN (SELECT id FROM users WHERE email = ${email})`);
            await db.execute(sql`DELETE FROM member_notes WHERE member_id IN (SELECT id FROM users WHERE email = ${email}) OR coach_id IN (SELECT id FROM users WHERE email = ${email})`);
            await db.execute(sql`DELETE FROM coach_members WHERE coach_id IN (SELECT id FROM users WHERE email = ${email}) OR member_id IN (SELECT id FROM users WHERE email = ${email})`);
            await db.execute(sql`DELETE FROM training_sessions WHERE coach_id IN (SELECT id FROM users WHERE email = ${email})`);
            await db.execute(sql`DELETE FROM coach_availabilities WHERE coach_id IN (SELECT id FROM users WHERE email = ${email})`);
            await db.execute(sql`DELETE FROM coach_settings WHERE coach_id IN (SELECT id FROM users WHERE email = ${email})`);
            await db.execute(sql`DELETE FROM weekly_availability WHERE coach_id IN (SELECT id FROM users WHERE email = ${email})`);
            await db.execute(sql`DELETE FROM blocked_slots WHERE coach_id IN (SELECT id FROM users WHERE email = ${email})`);
            await db.execute(sql`DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ${email})`);
            await db.execute(sql`DELETE FROM accounts WHERE user_id IN (SELECT id FROM users WHERE email = ${email})`);
            await db.execute(sql`DELETE FROM users WHERE email = ${email}`);
        }

        return NextResponse.json({
            message: 'Test users completely reset',
            note: 'You can now call /api/dev/seed-users to recreate them',
        });
    } catch (error: any) {
        return NextResponse.json({
            error: 'Failed to reset users',
            message: error.message,
        }, { status: 500 });
    }
}
