import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trainingSessions } from '@/lib/db/schema';
import { like, eq } from 'drizzle-orm';

/**
 * Development-only endpoint to update session titles
 * Changes "Session avec [name]" to just "[name]"
 * Access: GET /api/dev/fix-session-titles
 */
export async function GET(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    try {
        // Find all sessions with titles starting with "Session avec"
        const sessionsToUpdate = await db.query.trainingSessions.findMany({
            where: like(trainingSessions.title, 'Session avec %'),
        });

        const updates = [];

        for (const session of sessionsToUpdate) {
            if (session.title) {
                // Extract name from "Session avec [name]"
                const newTitle = session.title.replace('Session avec ', '');

                await db.update(trainingSessions)
                    .set({ title: newTitle })
                    .where(eq(trainingSessions.id, session.id));

                updates.push({
                    id: session.id,
                    oldTitle: session.title,
                    newTitle: newTitle,
                });
            }
        }

        return NextResponse.json({
            message: 'Session titles updated',
            count: updates.length,
            updates,
        });
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
        }, { status: 500 });
    }
}
