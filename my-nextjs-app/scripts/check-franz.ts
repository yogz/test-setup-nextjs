import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkFranz() {
    const franz = await db.query.users.findFirst({
        where: eq(users.email, 'franz@test.com'),
        with: {
            weeklyAvailability: true,
            blockedSlots: true,
            coachSettings: true,
        }
    });

    console.log('=== FRANZ CONFIG ===');
    console.log('Email:', franz?.email);
    console.log('Role:', franz?.role);
    console.log('\nCoach Settings:', JSON.stringify(franz?.coachSettings, null, 2));
    console.log('\nWeekly Availability:');
    franz?.weeklyAvailability.forEach(slot => {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        console.log(`  ${days[slot.dayOfWeek]}: ${slot.startTime}-${slot.endTime} | Individuel: ${slot.isIndividual} | Collectif: ${slot.isGroup}`);
    });
    console.log('\nBlocked Slots:', franz?.blockedSlots.length || 0);

    process.exit(0);
}

checkFranz().catch(console.error);
