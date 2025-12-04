import { db } from '@/lib/db';
import {
  trainingSessions,
  weeklyAvailability,
  blockedSlots,
  availabilityAdditions,
  recurringBookings,
  bookings,
} from '@/lib/db/schema';

/**
 * Reset all sessions and availability data
 * WARNING: This will delete ALL sessions, bookings, and availability data!
 */
async function resetAll() {
  console.log('🗑️  Starting data cleanup...\n');

  try {
    // 1. Delete all bookings first (foreign key constraint)
    console.log('Deleting all bookings...');
    const deletedBookings = await db.delete(bookings);
    console.log('✅ Bookings deleted\n');

    // 2. Delete all training sessions
    console.log('Deleting all training sessions...');
    const deletedSessions = await db.delete(trainingSessions);
    console.log('✅ Training sessions deleted\n');

    // 3. Delete all recurring bookings
    console.log('Deleting all recurring bookings...');
    const deletedRecurringBookings = await db.delete(recurringBookings);
    console.log('✅ Recurring bookings deleted\n');

    // 4. Delete all weekly availability
    console.log('Deleting all weekly availability...');
    const deletedWeekly = await db.delete(weeklyAvailability);
    console.log('✅ Weekly availability deleted\n');

    // 5. Delete all blocked slots
    console.log('Deleting all blocked slots...');
    const deletedBlocked = await db.delete(blockedSlots);
    console.log('✅ Blocked slots deleted\n');

    // 6. Delete all availability additions
    console.log('Deleting all availability additions...');
    const deletedAdditions = await db.delete(availabilityAdditions);
    console.log('✅ Availability additions deleted\n');

    console.log('✨ All data has been successfully deleted!');
    console.log('\n📝 Summary:');
    console.log('   - All sessions deleted');
    console.log('   - All bookings deleted');
    console.log('   - All recurring bookings deleted');
    console.log('   - All availability data deleted');
    console.log('\n✅ Database is now clean. You can start fresh!\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Confirmation prompt
console.log('\n⚠️  WARNING: This will delete ALL sessions, bookings, and availability data!');
console.log('⚠️  This action is IRREVERSIBLE!\n');

// Run immediately (since we want to reset)
resetAll();
