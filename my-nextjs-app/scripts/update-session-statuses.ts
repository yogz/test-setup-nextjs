import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * Update existing session statuses before migration
 * This script updates old enum values to new ones
 */
async function updateSessionStatuses() {
  console.log('🔄 Updating session statuses...');

  try {
    // First, change the column type to text temporarily
    await db.execute(sql`
      ALTER TABLE training_sessions
      ALTER COLUMN status TYPE text
    `);
    console.log('✅ Changed status column to text');

    // Update all existing values
    const result = await db.execute(sql`
      UPDATE training_sessions
      SET status = CASE
        WHEN status = 'PLANNED' THEN 'scheduled'
        WHEN status = 'COMPLETED' THEN 'completed'
        WHEN status = 'CANCELLED' THEN 'cancelled'
        ELSE status
      END
    `);
    console.log('✅ Updated status values:', result);

    console.log('✅ Migration preparation complete!');
    console.log('Now you can run: npm run db:push');
  } catch (error) {
    console.error('❌ Error updating statuses:', error);
    process.exit(1);
  }

  process.exit(0);
}

updateSessionStatuses();
