import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Script to seed development test users
 * Run with: npx tsx scripts/seed-dev-users.ts
 */

async function seedDevUsers() {
    console.log('🌱 Seeding development users...');

    const testUsers = [
        {
            email: 'coach@coach.coach',
            name: 'Test Coach',
            role: 'coach',
        },
        {
            email: 'owner@owner.owner',
            name: 'Test Owner',
            role: 'owner',
        },
        {
            email: 'nicolas.a.perez@gmail.com',
            name: 'Nicolas Perez',
            role: 'member',
        },
    ];

    for (const userData of testUsers) {
        try {
            // Check if user already exists
            const existingUser = await db.query.users.findFirst({
                where: eq(users.email, userData.email),
            });

            if (existingUser) {
                console.log(`✓ User ${userData.email} already exists, updating role to ${userData.role}`);
                // Update role if needed
                await db.update(users)
                    .set({ role: userData.role as any })
                    .where(eq(users.id, existingUser.id));
            } else {
                console.log(`✗ User ${userData.email} does not exist yet`);
                console.log(`  → Please create it via signup with password "password" and role will be updated`);
                console.log(`  → Or use the web interface to sign up first`);
            }
        } catch (error) {
            console.error(`Error processing ${userData.email}:`, error);
        }
    }

    console.log('\n✅ Seed complete!');
    console.log('\nNote: Better Auth handles password hashing during signup.');
    console.log('If users don\'t exist, please sign up via the web interface first,');
    console.log('then this script will update their roles.\n');
}

seedDevUsers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
    });
