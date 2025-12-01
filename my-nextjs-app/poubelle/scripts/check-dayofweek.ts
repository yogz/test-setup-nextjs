import { db } from '@/lib/db';
import { weeklyAvailability, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function check() {
    const franz = await db.query.users.findFirst({
        where: eq(users.email, 'coach@coach.coach'),
        with: { weeklyAvailability: true }
    });

    console.log('Franz weekly availability:');
    franz?.weeklyAvailability.forEach(slot => {
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        console.log(`  dayOfWeek: ${slot.dayOfWeek} = ${days[slot.dayOfWeek]}`);
        console.log(`  Time: ${slot.startTime}-${slot.endTime}`);
        console.log(`  isIndividual: ${slot.isIndividual}`);
        console.log('');
    });

    process.exit(0);
}

check().catch(console.error);
