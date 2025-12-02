import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { trainingSessions, bookings, users } from '@/lib/db/schema';
import { eq, and, desc, asc, gte } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { confirmSessionAction } from '@/app/actions/gym-actions';

export default async function CoachDashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || session.user.role !== 'coach' && session.user.role !== 'owner') {
        redirect('/');
    }

    // Fetch sessions
    const now = new Date();

    // 1. Ongoing/Next Session (The one to manage)
    const ongoingSession = await db.query.trainingSessions.findFirst({
        where: and(
            eq(trainingSessions.coachId, session.user.id),
            gte(trainingSessions.endTime, now), // Ends in future
            // eq(trainingSessions.status, 'PLANNED') // Only planned ones
        ),
        orderBy: [asc(trainingSessions.startTime)],
        with: {
            bookings: {
                with: {
                    member: true, // Get member details
                },
            },
        },
    });

    // 2. Upcoming Sessions
    const upcomingSessions = await db.query.trainingSessions.findMany({
        where: and(
            eq(trainingSessions.coachId, session.user.id),
            gte(trainingSessions.startTime, now),
        ),
        orderBy: [asc(trainingSessions.startTime)],
        limit: 5,
        with: {
            bookings: true,
        },
    });

    return (
        <div className="space-y-8 p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Coach Dashboard</h1>
                <Button>Manage Availability</Button>
            </div>

            {/* ACTIVE SESSION CARD */}
            <section>
                <h2 className="mb-4 text-xl font-semibold">Current Session</h2>
                {ongoingSession ? (
                    <Card className="border-2 border-primary/20">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{ongoingSession.title || 'Training Session'}</CardTitle>
                                    <CardDescription>
                                        {ongoingSession.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {ongoingSession.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </CardDescription>
                                </div>
                                <Badge variant={ongoingSession.status === 'completed' ? 'secondary' : 'default'}>
                                    {ongoingSession.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium mb-2">Attendees</h3>
                                    {ongoingSession.bookings.length > 0 ? (
                                        <div className="grid gap-2">
                                            {ongoingSession.bookings.map((booking: any) => (
                                                <div key={booking.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                            {/* Avatar placeholder */}
                                                            <span className="font-bold text-primary">
                                                                {booking.member.name?.[0] || 'M'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{booking.member.name}</p>
                                                            <p className="text-sm text-muted-foreground">{booking.member.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {/* Actions for each member could go here (e.g. No Show) */}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No bookings for this session.</p>
                                    )}
                                </div>

                                {ongoingSession.status !== 'completed' && (
                                    <div className="pt-4 border-t">
                                        <form action={async () => {
                                            'use server';
                                            await confirmSessionAction({ sessionId: ongoingSession.id });
                                        }}>
                                            <Button type="submit" className="w-full sm:w-auto">
                                                Confirmer la séance terminée
                                            </Button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No active sessions right now.
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* UPCOMING SESSIONS */}
            <section>
                <h2 className="mb-4 text-xl font-semibold">Upcoming</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingSessions.map((session) => (
                        <Card key={session.id}>
                            <CardHeader>
                                <CardTitle className="text-lg">{session.title || 'Training Session'}</CardTitle>
                                <CardDescription>
                                    {session.startTime.toLocaleDateString()} at {session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between text-sm">
                                    <span>Capacity: {session.bookings.length} / {session.capacity || 1}</span>
                                    <Badge variant="outline">{session.type}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
