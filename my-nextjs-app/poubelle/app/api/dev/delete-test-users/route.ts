import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, accounts, sessions } from '@/lib/db/schema';
import { eq, or, inArray } from 'drizzle-orm';

/**
 * Development-only endpoint to delete test users
 * Access: GET /api/dev/delete-test-users
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
        // Find test users
        const testUsers = await db.query.users.findMany({
            where: or(
                eq(users.email, testEmails[0]),
                eq(users.email, testEmails[1]),
                eq(users.email, testEmails[2])
            )
        });

        const userIds = testUsers.map(u => u.id);

        if (userIds.length > 0) {
            // Delete in order: sessions -> accounts -> users
            await db.delete(sessions).where(inArray(sessions.userId, userIds));
            await db.delete(accounts).where(inArray(accounts.userId, userIds));
            await db.delete(users).where(inArray(users.id, userIds));
        }

        return NextResponse.json({
            message: 'Test users deleted successfully',
            deletedCount: userIds.length,
            deletedEmails: testEmails,
        });
    } catch (error: any) {
        return NextResponse.json({
            error: 'Failed to delete users',
            message: error.message,
        }, { status: 500 });
    }
}
