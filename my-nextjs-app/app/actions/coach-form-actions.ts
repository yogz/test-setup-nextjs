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
    const weekdays = JSON.parse(formData.get('weekdays') as string) as number[];
    const isRecurring = formData.get('isRecurring') === 'true';
    const description = formData.get('description') as string || undefined;

    // Get first room from database (temporary solution)
    const room = await db.query.rooms.findFirst();
    if (!room) {
        throw new Error('No room available. Please create a room first.');
    }

    if (isRecurring) {
        // Validation for recurring sessions
        if (weekdays.length === 0) {
            throw new Error('Please select at least one day of the week for recurring sessions');
        }

        // Recurring session logic
        const startDate = new Date(formData.get('startDate') as string);
        const endDate = new Date(formData.get('recurrenceEndDate') as string);

        // Get time from first occurrence (use current time as default or make it configurable)
        const defaultHour = 9;
        const defaultMinute = 0;

        // Create sessions for each selected weekday between start and end dates
        const sessionsToCreate = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            // Check if current day is in selected weekdays
            if (weekdays.includes(currentDate.getDay())) {
                const startTime = new Date(currentDate);
                startTime.setHours(defaultHour, defaultMinute, 0, 0);

                const endTime = new Date(startTime);
                endTime.setMinutes(endTime.getMinutes() + duration);

                sessionsToCreate.push({
                    coachId: session.user.id,
                    roomId: room.id,
                    title,
                    description,
                    type,
                    capacity,
                    duration,
                    weekdays,
                    isRecurring: true,
                    recurrenceEndDate: endDate,
                    startTime,
                    endTime,
                    status: 'PLANNED' as const,
                });
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Insert all sessions at once
        if (sessionsToCreate.length > 0) {
            await db.insert(trainingSessions).values(sessionsToCreate);
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

        await db.insert(trainingSessions).values({
            coachId: session.user.id,
            roomId: room.id,
            title,
            description,
            type,
            capacity,
            duration,
            weekdays,
            isRecurring: false,
            startTime,
            endTime,
            status: 'PLANNED',
        });
    }

    revalidatePath('/coach/sessions');
}
