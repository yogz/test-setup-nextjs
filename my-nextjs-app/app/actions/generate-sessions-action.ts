'use server';

import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { weeklyAvailability, trainingSessions } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Generate training sessions from weekly availability template
 * @param weeksAhead How many weeks in the future to generate (default: 4)
 * @returns Number of sessions created
 */
export async function generateSessionsFromTemplateAction(weeksAhead: number = 4) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || (session.user.role !== 'coach' && session.user.role !== 'owner')) {
        throw new Error('Unauthorized');
    }

    const coachId = session.user.id;

    // Fetch coach's weekly availability
    const availability = await db.query.weeklyAvailability.findMany({
        where: eq(weeklyAvailability.coachId, coachId),
    });

    if (availability.length === 0) {
        return { created: 0, message: 'Aucune disponibilité configurée' };
    }

    // Get coach settings for default room
    const coachSettings = await db.query.coachSettings.findFirst({
        where: eq(weeklyAvailability.coachId, coachId),
    });

    const defaultRoomId = coachSettings?.defaultRoomId;
    const defaultDuration = coachSettings?.defaultDuration || 60;

    if (!defaultRoomId) {
        return { created: 0, message: 'Veuillez configurer une salle par défaut dans les paramètres' };
    }

    const validRoomId: string = defaultRoomId;

    // Calculate start and end dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + (weeksAhead * 7));
    endDate.setHours(23, 59, 59, 999);

    let createdCount = 0;

    // Iterate through each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();

        // Find availability slots for this day
        const daySlots = availability.filter(a => a.dayOfWeek === dayOfWeek);

        for (const slot of daySlots) {
            // Parse times
            const [startHour, startMin] = slot.startTime.split(':').map(Number);
            const [endHour, endMin] = slot.endTime.split(':').map(Number);

            const sessionStart = new Date(currentDate);
            sessionStart.setHours(startHour, startMin, 0, 0);

            const sessionEnd = new Date(currentDate);
            sessionEnd.setHours(endHour, endMin, 0, 0);

            // Check if session already exists at this time
            const existingSession = await db.query.trainingSessions.findFirst({
                where: and(
                    eq(trainingSessions.coachId, coachId),
                    eq(trainingSessions.startTime, sessionStart),
                ),
            });

            // Skip if session already exists
            if (existingSession) {
                continue;
            }

            // Generate individual sessions for each available slot
            // Note: Auto-generation is no longer controlled by a flag
            // All weekly availability slots are considered available for booking
            await db.insert(trainingSessions).values({
                coachId,
                title: 'Available',
                description: 'Individual session slot available for booking',
                type: 'ONE_TO_ONE',
                startTime: sessionStart,
                endTime: sessionEnd,
                status: 'scheduled',
                roomId: slot.roomId || validRoomId, // Use slot's room or default room
                capacity: 1,
                createdAt: new Date(),
            });
            createdCount++;
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    revalidatePath('/coach/sessions');
    revalidatePath('/schedule');

    return {
        created: createdCount,
        message: `${createdCount} session(s) créée(s) pour les ${weeksAhead} prochaines semaines`,
    };
}
