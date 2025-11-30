
import { db } from '@/lib/db';
import { users, weeklyAvailability, coachSettings, rooms } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function setTestAvailability() {
    console.log('🔧 Setting test availability...');

    // 1. Get Coach
    const coach = await db.query.users.findFirst({
        where: eq(users.email, 'coach@coach.coach'),
    });

    if (!coach) {
        console.error('❌ Coach not found');
        process.exit(1);
    }

    console.log(`✓ Found coach: ${coach.name} (${coach.id})`);

    // 2. Ensure Default Room
    let settings = await db.query.coachSettings.findFirst({
        where: eq(coachSettings.coachId, coach.id),
    });

    if (!settings || !settings.defaultRoomId) {
        const room = await db.query.rooms.findFirst();
        if (!room) {
            console.error('❌ No rooms found');
            process.exit(1);
        }

        if (!settings) {
            await db.insert(coachSettings).values({
                coachId: coach.id,
                defaultRoomId: room.id,
                defaultDuration: 60,
            });
        } else {
            await db.update(coachSettings)
                .set({ defaultRoomId: room.id })
                .where(eq(coachSettings.coachId, coach.id));
        }
        console.log(`✓ Set default room to: ${room.name}`);
        settings = await db.query.coachSettings.findFirst({
            where: eq(coachSettings.coachId, coach.id),
        });
    } else {
        console.log(`✓ Default room already set`);
    }

    // 3. Set Availability for Wednesday (Day 3) 09:00 - 10:00
    const dayOfWeek = 3; // Wednesday

    // Clear existing
    await db.delete(weeklyAvailability)
        .where(and(
            eq(weeklyAvailability.coachId, coach.id),
            eq(weeklyAvailability.dayOfWeek, dayOfWeek)
        ));

    // Insert new
    await db.insert(weeklyAvailability).values({
        coachId: coach.id,
        dayOfWeek: dayOfWeek,
        startTime: '09:00',
        endTime: '10:00',
        isIndividual: true,
        isGroup: false,
        roomId: settings!.defaultRoomId,
    });

    console.log('✓ Set availability for Wednesday 09:00 - 10:00');
    console.log('✅ Done!');
}

setTestAvailability()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
