import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { bookings, trainingSessions } from '@/lib/db/schema';
import { eq, and, gte, lte, ne } from 'drizzle-orm';
import { MemberSessionsView } from '@/components/member/member-sessions-view';

export default async function MemberSessionsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect('/sign-in');
    }

    // Fetch date range - 1 month past to 3 months ahead
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const threeMonthsAhead = new Date(now);
    threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

    // Fetch member's bookings with session details
    const memberBookings = await db.query.bookings.findMany({
        where: eq(bookings.memberId, session.user.id),
        with: {
            session: {
                with: {
                    coach: true,
                    room: true,
                },
            },
        },
    });

    // Transform bookings into session format for the view
    const memberSessions = memberBookings
        .filter(b => {
            const sessionDate = new Date(b.session.startTime);
            // Filter out cancelled bookings and cancelled sessions
            const isBookingCancelled = b.status === 'CANCELLED_BY_MEMBER' || b.status === 'CANCELLED_BY_COACH';
            const isSessionCancelled = b.session.status === 'cancelled';
            return sessionDate >= oneMonthAgo && sessionDate <= threeMonthsAhead && !isBookingCancelled && !isSessionCancelled;
        })
        .map(b => ({
            id: b.id,
            sessionId: b.session.id,
            title: b.session.title,
            startTime: b.session.startTime,
            endTime: b.session.endTime,
            type: b.session.type,
            status: b.status,
            sessionStatus: b.session.status,
            coach: b.session.coach,
            room: b.session.room,
            isRecurring: !!b.session.recurringBookingId,
            description: b.session.description,
        }));

    return (
        <MemberSessionsView
            sessions={memberSessions}
            memberName={session.user.name || 'Membre'}
        />
    );
}
