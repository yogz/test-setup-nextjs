import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    console.log('Adding has_completed_onboarding column...');
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false NOT NULL
    `);
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
