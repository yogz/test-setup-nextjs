import { db } from '@/lib/db';
import { users, trainingSessions } from '@/lib/db/schema';
import { or, eq, gte } from 'drizzle-orm';
import { generateAvailableSlots } from '@/lib/utils/availability';

async function debugSlots() {
    const now = new Date();
    const twoWeeksFromNow = new Date(now);
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    // Fetch Franz
    const franz = await db.query.users.findFirst({
        where: eq(users.email, 'coach@coach.coach'),
        with: {
            weeklyAvailability: true,
            blockedSlots: {
                where: (blockedSlots) => gte(blockedSlots.startTime, now)
            },
            coachSettings: true,
        }
    });

    console.log('=== FRANZ CONFIG ===');
    console.log('Email:', franz?.email);
    console.log('Coach Settings:', franz?.coachSettings);
    console.log('Default Room ID:', franz?.coachSettings?.[0]?.defaultRoomId);
    console.log('');

    // Fetch existing sessions
    const existingSessions = await db.query.trainingSessions.findMany({
        where: gte(trainingSessions.startTime, now),
    });

    console.log('=== EXISTING SESSIONS ===');
    console.log('Count:', existingSessions.length);
    console.log('');

    // Generate slots
    if (franz) {
        const slots = generateAvailableSlots({
            coaches: [{
                id: franz.id,
                name: franz.name,
                weeklyAvailability: franz.weeklyAvailability,
                blockedSlots: franz.blockedSlots,
            }],
            existingSessions: existingSessions.map(s => ({
                id: s.id,
                coachId: s.coachId,
                startTime: s.startTime,
                endTime: s.endTime,
                type: s.type,
            })),
            startDate: now,
            endDate: twoWeeksFromNow,
        });

        console.log('=== GENERATED SLOTS FOR FRANZ ===');
        console.log('Total slots:', slots.length);
        console.log('');

        // Group by day
        const byDay: Record<string, number> = {};
        slots.forEach(slot => {
            const day = slot.startTime.toLocaleDateString('fr-FR', { weekday: 'long' });
            byDay[day] = (byDay[day] || 0) + 1;
        });

        console.log('Slots by day:');
        Object.entries(byDay).forEach(([day, count]) => {
            console.log(`  ${day}: ${count} créneaux`);
        });

        console.log('\nFirst 5 slots:');
        slots.slice(0, 5).forEach(slot => {
            console.log(`  ${slot.startTime.toLocaleDateString('fr-FR')} ${slot.startTime.toLocaleTimeString('fr-FR')} - ${slot.endTime.toLocaleTimeString('fr-FR')} (${slot.coachName})`);
        });
    }

    process.exit(0);
}

debugSlots().catch(console.error);
