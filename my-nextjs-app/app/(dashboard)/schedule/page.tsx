import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { trainingSessions, users } from '@/lib/db/schema';
import { and, gte, asc, eq, or } from 'drizzle-orm';
import { MemberCalendar } from '@/components/schedule/member-calendar';
import { generateAvailableSlots } from '@/lib/utils/availability';

export default async function SchedulePage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect('/sign-in');
    }

    const now = new Date();
    const twoWeeksFromNow = new Date(now);
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    // Fetch existing sessions (cours collectifs + sessions individuelles déjà créées)
    const existingSessions = await db.query.trainingSessions.findMany({
        where: and(
            gte(trainingSessions.startTime, now),
            eq(trainingSessions.status, 'scheduled')
        ),
        orderBy: [asc(trainingSessions.startTime)],
        with: {
            coach: true,
            room: true,
            bookings: {
                where: (bookings: any, { eq, or }: any) =>
                    or(
                        eq(bookings.status, 'CONFIRMED'),
                        eq(bookings.memberId, session.user.id)
                    )
            },
        },
    });

    // Fetch all coaches with their availability
    const coaches = await db.query.users.findMany({
        where: or(
            eq(users.role, 'coach'),
            eq(users.role, 'owner')
        ),
        with: {
            weeklyAvailability: true,
            blockedSlots: {
                where: (blockedSlots, { gte }) =>
                    gte(blockedSlots.startTime, now)
            },
        },
    });

    // Generate available slots for ONE_TO_ONE sessions
    const availableSlots = generateAvailableSlots({
        coaches: coaches.map(coach => ({
            id: coach.id,
            name: coach.name,
            weeklyAvailability: coach.weeklyAvailability as any,
            blockedSlots: coach.blockedSlots as any,
        })),
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

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Planning des sessions</h1>
                    <p className="text-muted-foreground mt-2">
                        Réservez vos sessions d'entraînement et cours collectifs
                    </p>
                </div>
            </div>

            <MemberCalendar
                sessions={existingSessions as any}
                availableSlots={availableSlots}
                userId={session.user.id}
            />
        </div>
    );
}
