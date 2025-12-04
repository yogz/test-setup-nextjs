'use server';

import { db } from '@/lib/db';
import { coachSettings, weeklyAvailability, blockedSlots, rooms, trainingSessions, availabilityAdditions } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Helper to get authenticated coach
async function getCoach() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || (session.user.role !== 'coach' && session.user.role !== 'owner')) {
        throw new Error('Unauthorized');
    }
    return session.user;
}

// ============================================================================
// COACH SETTINGS
// ============================================================================

export async function getCoachSettingsAction() {
    const user = await getCoach();

    let settings = await db.query.coachSettings.findFirst({
        where: eq(coachSettings.coachId, user.id),
        with: {
            defaultRoom: true,
        }
    });

    if (!settings) {
        // Create default settings if not exists
        const [newSettings] = await db.insert(coachSettings).values({
            coachId: user.id,
            defaultDuration: 60,
        }).returning();
        return newSettings;
    }

    return settings;
}

export async function updateCoachSettingsAction(data: { defaultRoomId?: string, defaultDuration?: number }) {
    const user = await getCoach();

    await db.update(coachSettings)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(coachSettings.coachId, user.id));

    revalidatePath('/coach/sessions');
}

// ============================================================================
// WEEKLY AVAILABILITY
// ============================================================================

export async function getWeeklyAvailabilityAction() {
    const user = await getCoach();

    return await db.query.weeklyAvailability.findMany({
        where: eq(weeklyAvailability.coachId, user.id),
        orderBy: (table, { asc }) => [asc(table.dayOfWeek), asc(table.startTime)],
    });
}

export async function updateWeeklyAvailabilityAction(dayOfWeek: number, slots: { startTime: string, endTime: string, roomId?: string, duration?: number }[]) {
    const user = await getCoach();

    // Transaction: Delete existing slots for this day and insert new ones
    await db.transaction(async (tx) => {
        // Delete existing
        await tx.delete(weeklyAvailability)
            .where(and(
                eq(weeklyAvailability.coachId, user.id),
                eq(weeklyAvailability.dayOfWeek, dayOfWeek)
            ));

        // Insert new
        if (slots.length > 0) {
            await tx.insert(weeklyAvailability).values(
                slots.map(slot => ({
                    coachId: user.id,
                    dayOfWeek,
                    ...slot,
                    isIndividual: true, // Les disponibilités des coachs sont toujours individuelles
                    isGroup: false,
                }))
            );
        }
    });

    revalidatePath('/coach/sessions');
}

// ============================================================================
// CONFLICT MANAGEMENT
// ============================================================================

export async function getAvailabilityConflictsAction() {
    const user = await getCoach();
    const today = new Date();

    // 1. Get all future scheduled sessions
    const futureSessions = await db.query.trainingSessions.findMany({
        where: and(
            eq(trainingSessions.coachId, user.id),
            eq(trainingSessions.status, 'scheduled'),
            gte(trainingSessions.startTime, today)
        ),
        with: {
            bookings: {
                with: {
                    member: true
                }
            }
        }
    });

    if (futureSessions.length === 0) return [];

    // 2. Get availability rules
    const weeklySlots = await db.query.weeklyAvailability.findMany({
        where: eq(weeklyAvailability.coachId, user.id),
    });

    const additions = await db.query.availabilityAdditions.findMany({
        where: and(
            eq(availabilityAdditions.coachId, user.id),
            gte(availabilityAdditions.startTime, today)
        ),
    });

    const blocks = await db.query.blockedSlots.findMany({
        where: and(
            eq(blockedSlots.coachId, user.id),
            gte(blockedSlots.endTime, today)
        ),
    });

    // 3. Find conflicts
    const conflicts = futureSessions.filter(session => {
        const sessionStart = session.startTime;
        const sessionEnd = session.endTime;
        const dayOfWeek = sessionStart.getDay();

        // Check if blocked (Negative Exception)
        const isBlocked = blocks.some(block =>
            block.startTime <= sessionStart && block.endTime > sessionStart
        );
        if (isBlocked) return true; // Conflict!

        // Check if explicitly allowed (Positive Exception)
        const isExplicitlyAdded = additions.some(add =>
            add.startTime <= sessionStart && add.endTime >= sessionEnd
        );
        if (isExplicitlyAdded) return false; // Valid!

        // Check if in weekly template
        const startStr = sessionStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const endStr = sessionEnd.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        const fitsTemplate = weeklySlots.some(slot =>
            slot.dayOfWeek === dayOfWeek &&
            startStr >= slot.startTime &&
            endStr <= slot.endTime
        );

        return !fitsTemplate; // If not in template and not added -> Conflict!
    });

    return conflicts;
}

export async function resolveConflictKeepSessionAction(sessionId: string) {
    const user = await getCoach();

    const session = await db.query.trainingSessions.findFirst({
        where: eq(trainingSessions.id, sessionId),
    });

    if (!session) throw new Error('Session not found');
    if (session.coachId !== user.id) throw new Error('Unauthorized');

    // Create an availability addition to "whitelist" this session
    await db.insert(availabilityAdditions).values({
        coachId: user.id,
        startTime: session.startTime,
        endTime: session.endTime,
        roomId: session.roomId,
        isIndividual: session.type === 'ONE_TO_ONE',
        isGroup: session.type === 'GROUP',
        reason: 'Session maintained despite schedule change',
    });

    revalidatePath('/coach/conflicts');
    revalidatePath('/coach/sessions');
}

// ============================================================================
// BLOCKED SLOTS
// ============================================================================

export async function getBlockedSlotsAction(startDate: Date, endDate: Date) {
    const user = await getCoach();

    return await db.query.blockedSlots.findMany({
        where: and(
            eq(blockedSlots.coachId, user.id),
            gte(blockedSlots.startTime, startDate),
            lte(blockedSlots.endTime, endDate)
        ),
    });
}

export async function blockSlotAction(startTime: Date, endTime: Date, reason?: string) {
    const user = await getCoach();

    await db.insert(blockedSlots).values({
        coachId: user.id,
        startTime,
        endTime,
        reason,
    });

    revalidatePath('/coach/sessions');
}

export async function unblockSlotAction(slotId: string) {
    const user = await getCoach();

    await db.delete(blockedSlots)
        .where(and(
            eq(blockedSlots.id, slotId),
            eq(blockedSlots.coachId, user.id)
        ));

    revalidatePath('/coach/sessions');
}

// ============================================================================
// ROOMS
// ============================================================================

export async function getRoomsAction() {
    return await db.query.rooms.findMany();
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================



export async function cancelSessionAction(sessionId: string) {
    const user = await getCoach();

    // Verify ownership
    const session = await db.query.trainingSessions.findFirst({
        where: eq(trainingSessions.id, sessionId),
    });

    if (!session) {
        throw new Error('Session not found');
    }

    if (session.coachId !== user.id && user.role !== 'owner') {
        throw new Error('Unauthorized');
    }

    await db.update(trainingSessions)
        .set({ status: 'cancelled' })
        .where(eq(trainingSessions.id, sessionId));

    revalidatePath('/coach/sessions');
}

export async function rescheduleSessionAction(sessionId: string, newDate: Date, newStartTime: string, newEndTime: string) {
    const user = await getCoach();

    // Verify ownership
    const session = await db.query.trainingSessions.findFirst({
        where: eq(trainingSessions.id, sessionId),
    });

    if (!session) {
        throw new Error('Session not found');
    }

    if (session.coachId !== user.id && user.role !== 'owner') {
        throw new Error('Unauthorized');
    }

    // Calculate new start/end timestamps
    const start = new Date(`${newDate.toISOString().split('T')[0]}T${newStartTime}`);
    const end = new Date(`${newDate.toISOString().split('T')[0]}T${newEndTime}`);

    await db.update(trainingSessions)
        .set({
            startTime: start,
            endTime: end,
            status: 'scheduled'
        })
        .where(eq(trainingSessions.id, sessionId));

    revalidatePath('/coach/sessions');
}
