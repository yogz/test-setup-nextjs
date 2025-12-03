import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users, weeklyAvailability, blockedSlots, trainingSessions, coachSettings, recurringBookings } from '@/lib/db/schema';
import { eq, and, gte, lte, ne, or } from 'drizzle-orm';
import { MemberBookingView } from '@/components/member/member-booking-view';

export default async function MemberBookPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect('/sign-in');
    }

    // Fetch date range for availability lookup - only 3 weeks ahead for initial load
    const now = new Date();
    const threeWeeksAhead = new Date(now);
    threeWeeksAhead.setDate(threeWeeksAhead.getDate() + 21);

    // Get all coaches with their availability
    const coaches = await db.query.users.findMany({
        where: or(eq(users.role, 'coach'), eq(users.role, 'owner')),
        with: {
            coachSettings: true,
            weeklyAvailability: true,
        },
    });

    // Get blocked slots for all coaches (only for the next 3 weeks)
    const allBlockedSlots = await db.query.blockedSlots.findMany({
        where: and(
            gte(blockedSlots.startTime, now),
            lte(blockedSlots.startTime, threeWeeksAhead)
        ),
    });

    // Get existing sessions (only next 3 weeks, without heavy relations)
    const existingSessions = await db.query.trainingSessions.findMany({
        where: and(
            gte(trainingSessions.startTime, now),
            lte(trainingSessions.startTime, threeWeeksAhead),
            ne(trainingSessions.status, 'cancelled')
        ),
        columns: {
            id: true,
            coachId: true,
            startTime: true,
            endTime: true,
            type: true,
            capacity: true,
        },
        with: {
            bookings: {
                columns: { id: true },
            },
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

    // Fetch member's recurring bookings
    const myBookings = await db.query.recurringBookings.findMany({
        where: eq(recurringBookings.memberId, session.user.id),
        with: {
            coach: {
                columns: {
                    id: true,
                    name: true,
                },
            },
            sessions: {
                where: (sessions, { gte }) => gte(sessions.startTime, new Date()),
                orderBy: (sessions, { asc }) => [asc(sessions.startTime)],
                limit: 10,
                columns: {
                    id: true,
                    startTime: true,
                    status: true,
                },
            },
        },
        orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
    });

    return (
        <MemberBookingView
            coaches={coachesWithAvailability}
            memberId={session.user.id}
            recurringBookings={myBookings}
        />
    );
}
