import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users, weeklyAvailability, blockedSlots, trainingSessions, coachSettings } from '@/lib/db/schema';
import { eq, and, gte, ne, or } from 'drizzle-orm';
import { MemberBookingView } from '@/components/member/member-booking-view';

export default async function MemberBookPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect('/sign-in');
    }

    // Fetch date range for availability lookup
    const now = new Date();
    const threeMonthsAhead = new Date(now);
    threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

    // Get all coaches with their availability
    const coaches = await db.query.users.findMany({
        where: or(eq(users.role, 'coach'), eq(users.role, 'owner')),
        with: {
            coachSettings: true,
            weeklyAvailability: true,
        },
    });

    // Get blocked slots for all coaches
    const allBlockedSlots = await db.query.blockedSlots.findMany({
        where: gte(blockedSlots.startTime, now),
    });

    // Get existing sessions (to show what's already booked)
    const existingSessions = await db.query.trainingSessions.findMany({
        where: and(
            gte(trainingSessions.startTime, now),
            ne(trainingSessions.status, 'cancelled')
        ),
        with: {
            coach: true,
            bookings: true,
        },
    });

    // Transform data for the client
    const coachesWithAvailability = coaches.map(coach => ({
        id: coach.id,
        name: coach.name || 'Coach',
        defaultDuration: coach.coachSettings?.[0]?.defaultDuration || 60,
        defaultRoomId: coach.coachSettings?.[0]?.defaultRoomId,
        availability: coach.weeklyAvailability.map(a => ({
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
            isIndividual: a.isIndividual,
            isGroup: a.isGroup,
            duration: a.duration,
        })),
        blockedSlots: allBlockedSlots
            .filter(b => b.coachId === coach.id)
            .map(b => ({
                id: b.id,
                startTime: b.startTime.toISOString(),
                endTime: b.endTime.toISOString(),
            })),
        sessions: existingSessions
            .filter(s => s.coachId === coach.id)
            .map(s => ({
                id: s.id,
                startTime: s.startTime.toISOString(),
                endTime: s.endTime.toISOString(),
                type: s.type,
                capacity: s.capacity,
                bookingsCount: s.bookings?.length || 0,
            })),
    }));

    return (
        <MemberBookingView
            coaches={coachesWithAvailability}
            memberId={session.user.id}
        />
    );
}
