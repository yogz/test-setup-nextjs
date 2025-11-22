import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { trainingSessions, bookings, coachAvailabilities } from '@/lib/db/schema';
import { eq, and, gte, asc, lte } from 'drizzle-orm';
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

    // 1. Define Date Range (Next 7 days)
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 7);

    // 2. Fetch Real Sessions
    const realSessions = await db.query.trainingSessions.findMany({
        where: and(
            gte(trainingSessions.startTime, now),
            lte(trainingSessions.startTime, endDate),
            eq(trainingSessions.status, 'PLANNED')
        ),
        with: {
            coach: true,
            bookings: true,
        },
    });

    // 3. Fetch Availabilities (Templates)
    const availabilities = await db.query.coachAvailabilities.findMany({
        where: eq(coachAvailabilities.isRecurring, true),
        with: {
            coach: true,
        }
    });

    // 4. Generate Virtual Sessions
    const virtualSessions: any[] = [];

    // Helper to check if a real session exists for a slot
    const hasRealSession = (coachId: string, startTime: Date) => {
        return realSessions.some(s =>
            s.coachId === coachId &&
            s.startTime.getTime() === startTime.getTime()
        );
    };

    // Iterate through next 7 days
    for (let d = 0; d < 7; d++) {
        const currentDate = new Date(now);
        currentDate.setDate(now.getDate() + d);
        const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon...

        // Find matching availabilities for this day
        const daySlots = availabilities.filter(a => a.dayOfWeek === dayOfWeek);

        for (const slot of daySlots) {
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);

            const slotStart = new Date(currentDate);
            slotStart.setHours(startHour, startMinute, 0, 0);

            const slotEnd = new Date(currentDate);
            slotEnd.setHours(endHour, endMinute, 0, 0);

            // Skip if in the past
            if (slotStart < now) continue;

            // Check if overridden by real session
            if (!hasRealSession(slot.coachId, slotStart)) {
                virtualSessions.push({
                    id: `virtual-${slot.id}-${currentDate.toISOString().split('T')[0]}`, // Temp ID
                    isVirtual: true,
                    availabilityId: slot.id,
                    date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD
                    title: slot.title || 'Training Session',
                    description: slot.description,
                    startTime: slotStart,
                    endTime: slotEnd,
                    capacity: slot.capacity || 1,
                    type: slot.type || 'ONE_TO_ONE',
                    coach: slot.coach,
                    bookings: [], // Virtual sessions have no bookings yet
                });
            }
        }
    }

    // 5. Merge and Sort
    const allSessions = [...realSessions, ...virtualSessions].sort((a, b) =>
        a.startTime.getTime() - b.startTime.getTime()
    );

    return (
        <div className="space-y-8 p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Class Schedule</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {allSessions.map((trainingSession: any) => {
                    const isBooked = trainingSession.bookings.some((b: any) => b.memberId === session.user.id && b.status === 'CONFIRMED');
                    const isFull = (trainingSession.capacity || 1) <= trainingSession.bookings.filter((b: any) => b.status === 'CONFIRMED').length;
                    const userBooking = trainingSession.bookings.find((b: any) => b.memberId === session.user.id && b.status === 'CONFIRMED');

                    return (
                        <Card key={trainingSession.id} className={`flex flex-col ${trainingSession.isVirtual ? 'border-dashed' : ''}`}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{trainingSession.title || 'Training Session'}</CardTitle>
                                        <CardDescription>with {trainingSession.coach.name}</CardDescription>
                                    </div>
                                    <Badge variant={trainingSession.type === 'ONE_TO_ONE' ? 'outline' : 'secondary'}>
                                        {trainingSession.type?.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Date:</span>
                                        {trainingSession.startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
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
                                        if (trainingSession.isVirtual) {
                                            await createBookingAction({
                                                availabilityId: trainingSession.availabilityId,
                                                date: trainingSession.date
                                            });
                                        } else {
                                            await createBookingAction({ sessionId: trainingSession.id });
                                        }
                                    }} className="w-full">
                                        <Button className="w-full">Book Now</Button>
                                    </form>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {allSessions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No classes scheduled for the next 7 days.
                </div>
            )}
        </div>
    );
}
