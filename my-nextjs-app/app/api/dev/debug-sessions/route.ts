import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trainingSessions, users } from '@/lib/db/schema';
import { eq, gte, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    // Get all coaches
    const coaches = await db.query.users.findMany({
        where: (users, { eq, or }) => or(
            eq(users.role, 'coach'),
            eq(users.role, 'owner')
        )
    });

    const now = new Date();

    // Get all sessions
    const allSessions = await db.query.trainingSessions.findMany({
        with: {
            coach: true,
        }
    });

    // Get future sessions
    const futureSessions = await db.query.trainingSessions.findMany({
        where: and(
            gte(trainingSessions.startTime, now),
            eq(trainingSessions.status, 'PLANNED')
        ),
        with: {
            coach: true,
        }
    });

    return NextResponse.json({
        coaches: coaches.map(c => ({ id: c.id, name: c.name, role: c.role })),
        allSessionsCount: allSessions.length,
        allSessions: allSessions.map(s => ({
            id: s.id,
            coach: s.coach.name,
            title: s.title,
            startTime: s.startTime,
            status: s.status,
            isPast: s.startTime < now
        })),
        futureSessionsCount: futureSessions.length,
        futureSessions: futureSessions.map(s => ({
            id: s.id,
            coach: s.coach.name,
            title: s.title,
            startTime: s.startTime,
            status: s.status
        }))
    });
}
