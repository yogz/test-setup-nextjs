import { db } from '@/lib/db';
import { trainingSessions, recurringBookings, weeklyAvailability, availabilityAdditions, blockedSlots, bookings } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

async function resetData() {
    console.log('Starting database reset...');

    try {
        // Delete in order of dependency
        console.log('Deleting bookings...');
        await db.delete(bookings);

        console.log('Deleting training sessions...');
        await db.delete(trainingSessions);

        console.log('Deleting recurring bookings...');
        await db.delete(recurringBookings);

        console.log('Deleting blocked slots...');
        await db.delete(blockedSlots);

        console.log('Deleting availability additions...');
        await db.delete(availabilityAdditions);

        console.log('Deleting weekly availability...');
        await db.delete(weeklyAvailability);

        console.log('Database reset complete!');
    } catch (error) {
        console.error('Error resetting database:', error);
    } finally {
        process.exit(0);
    }
}

resetData();
