'use server';

import { db } from '@/lib/db';
import { trainingSessions, recurringBookings, weeklyAvailability, availabilityAdditions, blockedSlots, bookings } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';

export async function resetDatabaseAction() {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return { success: false, error: 'This action is only available in development mode' };
    }

    try {
        // Delete in order of dependency
        await db.delete(bookings);
        await db.delete(trainingSessions);
        await db.delete(recurringBookings);
        await db.delete(blockedSlots);
        await db.delete(availabilityAdditions);
        await db.delete(weeklyAvailability);

        // Revalidate relevant paths
        revalidatePath('/coach/sessions');
        revalidatePath('/member/recurring-bookings');
        revalidatePath('/bookings');

        return { success: true, message: 'Database reset successfully' };
    } catch (error) {
        console.error('Error resetting database:', error);
        return { success: false, error: 'Failed to reset database' };
    }
}
