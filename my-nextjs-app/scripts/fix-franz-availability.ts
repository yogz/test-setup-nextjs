import { db } from '@/lib/db';
import { weeklyAvailability, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function fixFranzAvailability() {
    const franz = await db.query.users.findFirst({
        where: eq(users.email, 'coach@coach.coach'),
    });

    if (!franz) {
        console.log('❌ Franz not found');
        process.exit(1);
    }

    // Update all his availability slots to isIndividual = true
    await db
        .update(weeklyAvailability)
        .set({ isIndividual: true, isGroup: false })
        .where(eq(weeklyAvailability.coachId, franz.id));

    console.log('✅ Franz availability updated to Individual sessions');

    // Verify
    const slots = await db.query.weeklyAvailability.findMany({
        where: eq(weeklyAvailability.coachId, franz.id),
    });

    console.log('\nUpdated slots:');
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    slots.forEach(slot => {
        console.log(`  ${days[slot.dayOfWeek]}: ${slot.startTime}-${slot.endTime} | Indiv: ${slot.isIndividual} | Group: ${slot.isGroup}`);
    });

    process.exit(0);
}

fixFranzAvailability().catch(console.error);
