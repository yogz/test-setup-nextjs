import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { or, eq } from 'drizzle-orm';

async function listCoaches() {
    const coaches = await db.query.users.findMany({
        where: or(
            eq(users.role, 'coach'),
            eq(users.role, 'owner')
        ),
        with: {
            weeklyAvailability: true,
        }
    });

    console.log('=== COACHES/OWNERS ===\n');
    coaches.forEach(coach => {
        console.log(`${coach.name} (${coach.email}) - ${coach.role}`);
        console.log(`  Availability slots: ${coach.weeklyAvailability.length}`);

        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        coach.weeklyAvailability.forEach(slot => {
            console.log(`    ${days[slot.dayOfWeek]}: ${slot.startTime}-${slot.endTime} | Indiv: ${slot.isIndividual} | Group: ${slot.isGroup}`);
        });
        console.log('');
    });

    process.exit(0);
}

listCoaches().catch(console.error);
