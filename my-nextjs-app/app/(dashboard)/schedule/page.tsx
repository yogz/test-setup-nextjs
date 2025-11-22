import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { trainingSessions, bookings } from '@/lib/db/schema';
import { eq, and, gte, asc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createBookingAction, cancelBookingAction } from '@/app/actions/gym-actions';

export default async function SchedulePage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect('/sign-in');
    }

    // Fetch upcoming sessions
    const now = new Date();
    const availableSessions = await db.query.trainingSessions.findMany({
        where: and(
            gte(trainingSessions.startTime, now),
            eq(trainingSessions.status, 'PLANNED')
        ),
        orderBy: [asc(trainingSessions.startTime)],
        with: {
            coach: true, // Get coach details
            bookings: true, // To check capacity and if user already booked
        },
    });

    return (
        <div className="space-y-8 p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Class Schedule</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableSessions.map((trainingSession) => {
                    const isBooked = trainingSession.bookings.some(b => b.memberId === session.user.id && b.status === 'CONFIRMED');
                    const isFull = (trainingSession.capacity || 1) <= trainingSession.bookings.filter(b => b.status === 'CONFIRMED').length;
                    const userBooking = trainingSession.bookings.find(b => b.memberId === session.user.id && b.status === 'CONFIRMED');

                    return (
                        <Card key={trainingSession.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{trainingSession.title || 'Training Session'}</CardTitle>
                                        <CardDescription>with {trainingSession.coach.name}</CardDescription>
                                    </div>
                                    <Badge variant={trainingSession.type === 'ONE_TO_ONE' ? 'outline' : 'secondary'}>
                                        {trainingSession.type.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Date:</span>
                                        {trainingSession.startTime.toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Time:</span>
                                        {trainingSession.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {trainingSession.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Spots:</span>
                                        {trainingSession.bookings.length} / {trainingSession.capacity || 1}
                                    </div>
                                    {trainingSession.description && (
                                        <p className="text-muted-foreground mt-2">{trainingSession.description}</p>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter>
                                {isBooked ? (
                                    <form action={async () => {
                                        'use server';
                                        if (userBooking) await cancelBookingAction({ bookingId: userBooking.id });
                                    }} className="w-full">
                                        <Button variant="destructive" className="w-full">Cancel Booking</Button>
                                    </form>
                                ) : isFull ? (
                                    <Button disabled className="w-full">Full</Button>
                                ) : (
                                    <form action={async () => {
                                        'use server';
                                        await createBookingAction({ sessionId: trainingSession.id });
                                    }} className="w-full">
                                        <Button className="w-full">Book Now</Button>
                                    </form>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {availableSessions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No classes scheduled at the moment. Check back later!
                </div>
            )}
        </div>
    );
}
