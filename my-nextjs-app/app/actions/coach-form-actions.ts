'use server';

import { updateAvailabilityAction, createTrainingSessionAction } from './gym-actions';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { trainingSessions } from '@/lib/db/schema';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

export async function createAvailabilityFromForm(formData: FormData) {
    const dayOfWeek = parseInt(formData.get('dayOfWeek') as string);
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const isRecurring = formData.get('isRecurring') === 'true';

    await updateAvailabilityAction({
        dayOfWeek,
        startTime,
        endTime,
        isRecurring,
    });

    revalidatePath('/coach/availability');
}

export async function createSessionFromFormAction(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || (session.user.role !== 'coach' && session.user.role !== 'owner')) {
        throw new Error('Unauthorized');
    }

    // Parse form data
    const title = formData.get('title') as string;
    const type = formData.get('type') as 'ONE_TO_ONE' | 'GROUP';
    const capacityStr = formData.get('capacity') as string;
    const capacity = type === 'GROUP' && capacityStr ? parseInt(capacityStr) : 1;
    const duration = parseInt(formData.get('duration') as string);
    const weekdaysStr = formData.get('weekdays') as string;
    const weekdays = weekdaysStr ? JSON.parse(weekdaysStr) as number[] : [];
    const isRecurring = formData.get('isRecurring') === 'true';
    const description = formData.get('description') as string || undefined;
    const memberId = formData.get('memberId') as string || undefined;
    const roomId = formData.get('roomId') as string;
    const frequency = parseInt(formData.get('frequency') as string) || 1;

    // Use provided room or fallback to default/first room
    let finalRoomId = roomId;
    if (!finalRoomId) {
        const room = await db.query.rooms.findFirst();
        if (!room) {
            throw new Error('No room available. Please create a room first.');
        }
        finalRoomId = room.id;
    }

    if (isRecurring) {
        // Validation for recurring sessions
        if (weekdays.length === 0) {
            throw new Error('Please select at least one day of the week for recurring sessions');
        }

        // Recurring session logic
        const startDateStr = formData.get('startDate') as string;
        // If no start date provided (e.g. from BookMemberModal which might use sessionDate), use that
        const startDateInput = startDateStr || formData.get('sessionDate') as string;

        if (!startDateInput) {
            throw new Error('Start date is required');
        }

        const startDate = new Date(startDateInput);

        // Handle optional end date
        let endDate: Date;
        const endDateStr = formData.get('recurrenceEndDate') as string;
        if (endDateStr) {
            endDate = new Date(endDateStr);
        } else {
            // Default to 3 months if not provided
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 3);
        }

        // Get time from form
        const timeStr = formData.get('sessionTime') as string || '09:00';
        const [defaultHour, defaultMinute] = timeStr.split(':').map(Number);

        // Create sessions for each selected weekday between start and end dates
        const sessionsToCreate: any[] = [];
        const currentDate = new Date(startDate);

        // Align current date to the first valid weekday if needed, or just start iterating
        // We iterate day by day. 
        // For frequency > 1, we need to know "week number" or similar.
        // Simplest approach: Find the first occurrence for each weekday, then add (7 * frequency) days.

        // Better approach: Iterate through weeks.
        // 1. Find the start of the week for the start date.
        // 2. Iterate weeks adding (7 * frequency) days.
        // 3. In each week, check selected weekdays.

        // Let's stick to a day-by-day iteration but track weeks? No, that's complex with JS dates.
        // Let's find the first valid occurrence of EACH selected weekday.
        // Then for each of those, generate future occurrences adding (7 * frequency) days.

        for (const dayOfWeek of weekdays) {
            let iterDate = new Date(startDate);
            iterDate.setHours(defaultHour, defaultMinute, 0, 0);

            // Find first occurrence of this dayOfWeek on or after startDate
            while (iterDate.getDay() !== dayOfWeek) {
                iterDate.setDate(iterDate.getDate() + 1);
            }

            // If we went past endDate (unlikely if start < end), stop
            if (iterDate > endDate) continue;

            // Now generate occurrences
            while (iterDate <= endDate) {
                const startTime = new Date(iterDate);
                const endTime = new Date(startTime);
                endTime.setMinutes(endTime.getMinutes() + duration);

                sessionsToCreate.push({
                    coachId: session.user.id,
                    roomId: finalRoomId,
                    title,
                    description,
                    type,
                    capacity,
                    isRecurring: true,
                    startTime,
                    endTime,
                    status: 'scheduled',
                    memberId: memberId || null, // Link member if provided
                });

                // Add frequency * 7 days
                iterDate.setDate(iterDate.getDate() + (7 * frequency));
            }
        }

        // Insert all sessions at once
        if (sessionsToCreate.length > 0) {
            // We need to insert them and potentially create bookings if memberId is present
            // Batch insert sessions first
            const createdSessions = await db.insert(trainingSessions).values(sessionsToCreate).returning();

            // If memberId is present, create bookings for all these sessions
            if (memberId) {
                const bookingsToCreate = createdSessions.map(s => ({
                    sessionId: s.id,
                    memberId: memberId,
                    status: 'CONFIRMED' as const,
                }));

                // We need to import bookings schema
                const { bookings } = await import('@/lib/db/schema');
                await db.insert(bookings).values(bookingsToCreate);
            }
        } else {
            throw new Error('No sessions created. Make sure the selected days fall within the date range.');
        }
    } else {
        // Single session logic
        const sessionDate = formData.get('sessionDate') as string;
        const sessionTime = formData.get('sessionTime') as string;

        if (!sessionDate || !sessionTime) {
            throw new Error('Please provide both date and time for the session');
        }

        // Combine date and time
        const startTime = new Date(`${sessionDate}T${sessionTime}`);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + duration);

        const [createdSession] = await db.insert(trainingSessions).values({
            coachId: session.user.id,
            roomId: finalRoomId,
            title,
            description,
            type,
            capacity,
            isRecurring: false,
            startTime,
            endTime,
            status: 'scheduled',
            memberId: memberId || null,
        }).returning();

        // If memberId is present, create booking
        if (memberId) {
            const { bookings } = await import('@/lib/db/schema');
            await db.insert(bookings).values({
                sessionId: createdSession.id,
                memberId: memberId,
                status: 'CONFIRMED',
            });
        }
    }

    revalidatePath('/coach/sessions');
}
