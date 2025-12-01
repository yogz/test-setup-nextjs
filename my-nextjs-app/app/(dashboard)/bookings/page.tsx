import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq, desc, and, gte, lt } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { cancelBookingAction } from '@/app/actions/gym-actions';

export default async function BookingsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect('/sign-in');
    }

    const now = new Date();

    // Fetch all user bookings
    const userBookings = await db.query.bookings.findMany({
        where: eq(bookings.memberId, session.user.id),
        orderBy: [desc(bookings.createdAt)],
        with: {
            session: {
                with: {
                    coach: true,
                    room: true,
                },
            },
        },
    });

    // Separate into upcoming and past bookings
    const upcomingBookings = userBookings.filter(
        b => b.status === 'CONFIRMED' && new Date((b.session as any).startTime) >= now
    );
    const pastBookings = userBookings.filter(
        b => b.status === 'CONFIRMED' && new Date((b.session as any).startTime) < now
    );
    const cancelledBookings = userBookings.filter(
        b => b.status === 'CANCELLED_BY_MEMBER' || b.status === 'CANCELLED_BY_COACH'
    );

    const BookingCard = ({ booking }: { booking: typeof userBookings[0] }) => {
        const isPast = new Date(booking.session.startTime) < now;
        const isCancelled = booking.status === 'CANCELLED_BY_MEMBER' || booking.status === 'CANCELLED_BY_COACH';

        return (
            <Card key={booking.id}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <CardTitle className="text-lg">
                                {booking.session.title || 'Training Session'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                with {booking.session.coach.name || 'Coach'}
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                            <Badge variant={booking.session.type === 'ONE_TO_ONE' ? 'outline' : 'secondary'}>
                                {booking.session.type === 'ONE_TO_ONE' ? 'Individual' : 'Group'}
                            </Badge>
                            {isCancelled && (
                                <Badge variant="destructive">Cancelled</Badge>
                            )}
                            {booking.session.isRecurring && (
                                <Badge variant="outline">Recurring</Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {booking.session.description && (
                        <p className="text-sm text-muted-foreground">{booking.session.description}</p>
                    )}

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {new Date(booking.session.startTime).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                                {new Date(booking.session.startTime).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })} - {new Date(booking.session.endTime).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>

                        {booking.session.room && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{booking.session.room.name}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Booked on {new Date(booking.createdAt).toLocaleDateString('en-US')}</span>
                        </div>
                    </div>

                    {!isPast && !isCancelled && (
                        <form action={async () => {
                            'use server';
                            await cancelBookingAction({ bookingId: booking.id });
                        }}>
                            <Button variant="destructive" size="sm" className="w-full mt-4">
                                Cancel this booking
                            </Button>
                        </form>
                    )}

                    {isCancelled && booking.cancelledAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Cancelled on {new Date(booking.cancelledAt).toLocaleDateString('en-US')}
                        </p>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your past and upcoming training sessions
                </p>
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="upcoming">
                        Upcoming
                        {upcomingBookings.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {upcomingBookings.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="past">
                        Past
                        {pastBookings.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {pastBookings.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="cancelled">
                        Cancelled
                        {cancelledBookings.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {cancelledBookings.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="mt-6">
                    {upcomingBookings.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>You have no upcoming bookings.</p>
                            <Button variant="link" className="mt-4" asChild>
                                <a href="/member/recurring-bookings">Create a recurring booking</a>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {upcomingBookings
                                .sort((a, b) => new Date(a.session.startTime).getTime() - new Date(b.session.startTime).getTime())
                                .map(booking => (
                                    <BookingCard key={booking.id} booking={booking} />
                                ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="past" className="mt-6">
                    {pastBookings.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No past sessions.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pastBookings
                                .sort((a, b) => new Date(b.session.startTime).getTime() - new Date(a.session.startTime).getTime())
                                .map(booking => (
                                    <BookingCard key={booking.id} booking={booking} />
                                ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="cancelled" className="mt-6">
                    {cancelledBookings.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No cancelled bookings.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {cancelledBookings
                                .sort((a, b) => {
                                    const aDate = a.cancelledAt || a.createdAt;
                                    const bDate = b.cancelledAt || b.createdAt;
                                    return new Date(bDate).getTime() - new Date(aDate).getTime();
                                })
                                .map(booking => (
                                    <BookingCard key={booking.id} booking={booking} />
                                ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
