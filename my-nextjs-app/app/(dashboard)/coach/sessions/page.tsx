import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { trainingSessions, users, rooms } from '@/lib/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { CoachSessionsView } from '@/components/coach/coach-sessions-view';
import { getCoachSettingsAction, getWeeklyAvailabilityAction, getBlockedSlotsAction } from '@/app/actions/coach-availability-actions';

export default async function CoachSessionsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || (session.user.role !== 'coach' && session.user.role !== 'owner')) {
        redirect('/dashboard');
    }

    // Fetch Data
    const [
        settings,
        weeklyAvailability,
        allRooms,
        allMembers,
        coachSessions,
        blockedSlots
    ] = await Promise.all([
        getCoachSettingsAction(),
        getWeeklyAvailabilityAction(),
        db.query.rooms.findMany(),
        db.query.users.findMany({ where: eq(users.role, 'member') }),
        db.query.trainingSessions.findMany({
            where: eq(trainingSessions.coachId, session.user.id),
            with: {
                bookings: {
                    with: {
                        member: true
                    }
                },
                room: true // Ensure room relation is fetched
            }
        }),
        getBlockedSlotsAction(new Date(), new Date(new Date().setFullYear(new Date().getFullYear() + 1))) // Fetch future blocks
    ]);

    return (
        <CoachSessionsView
            settings={settings}
            weeklyAvailability={weeklyAvailability}
            coachSessions={coachSessions}
            blockedSlots={blockedSlots}
            allRooms={allRooms}
            allMembers={allMembers}
            coachName={session.user.name || 'Coach'}
        />
    );
}
