import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { trainingSessions, users, rooms, availabilityAdditions as availabilityAdditionsTable } from '@/lib/db/schema';
import { eq, desc, and, gte, ne } from 'drizzle-orm';
import { CoachSessionsView } from '@/components/coach/coach-sessions-view';
import { getCoachSettingsAction, getWeeklyAvailabilityAction, getBlockedSlotsAction } from '@/app/actions/coach-availability-actions';

export default async function CoachSessionsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || (session.user.role !== 'coach' && session.user.role !== 'owner')) {
        redirect('/dashboard');
    }

    // Fetch Data - optimized to only load recent and future sessions
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const threeMonthsAhead = new Date(now);
    threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

    const [
        settings,
        weeklyAvailability,
        allRooms,
        allMembers,
        coachSessions,
        blockedSlots,
        availabilityAdditions
    ] = await Promise.all([
        getCoachSettingsAction(),
        getWeeklyAvailabilityAction(),
        db.query.rooms.findMany(),
        db.query.users.findMany({ where: eq(users.role, 'member') }),
        db.query.trainingSessions.findMany({
            where: and(
                eq(trainingSessions.coachId, session.user.id),
                gte(trainingSessions.startTime, oneMonthAgo),
                ne(trainingSessions.status, 'cancelled') // Exclure les sessions annulées
            ),
            with: {
                member: true, // Direct member relation for recurring bookings
                bookings: {
                    with: {
                        member: true
                    }
                },
                room: true // Ensure room relation is fetched
            }
        }),
        getBlockedSlotsAction(oneMonthAgo, threeMonthsAhead),
        db.query.availabilityAdditions.findMany({
            where: and(
                eq(availabilityAdditionsTable.coachId, session.user.id),
                gte(availabilityAdditionsTable.startTime, oneMonthAgo)
            )
        })
    ]);

    return (
        <CoachSessionsView
            settings={settings}
            weeklyAvailability={weeklyAvailability}
            coachSessions={coachSessions}
            blockedSlots={blockedSlots}
            availabilityAdditions={availabilityAdditions}
            allRooms={allRooms}
            allMembers={allMembers}
            coachName={session.user.name || 'Coach'}
            coachId={session.user.id}
        />
    );
}
