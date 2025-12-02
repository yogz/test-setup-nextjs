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
                                {booking.session.title || 'Séance'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                avec {booking.session.coach.name || 'Coach'}
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                            <Badge variant={booking.session.type === 'ONE_TO_ONE' ? 'outline' : 'secondary'}>
                                {booking.session.type === 'ONE_TO_ONE' ? 'Individuel' : 'Collectif'}
                            </Badge>
                            {isCancelled && (
                                <Badge variant="destructive">Annulée</Badge>
                            )}
                            {booking.session.isRecurring && (
                                <Badge variant="outline">Récurrent</Badge>
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
                                {new Date(booking.session.startTime).toLocaleDateString('fr-FR', {
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
                                {new Date(booking.session.startTime).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })} - {new Date(booking.session.endTime).toLocaleTimeString('fr-FR', {
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
                            <span>Réservé le {new Date(booking.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                    </div>

                    {!isPast && !isCancelled && (
                        <form action={async () => {
                            'use server';
                            await cancelBookingAction({ bookingId: booking.id });
                        }}>
                            <Button variant="destructive" size="sm" className="w-full mt-4">
                                Annuler cette réservation
                            </Button>
                        </form>
                    )}

                    {isCancelled && booking.cancelledAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Annulée le {new Date(booking.cancelledAt).toLocaleDateString('fr-FR')}
                        </p>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mes Réservations</h1>
                <p className="text-muted-foreground mt-2">
                    Gérez vos séances passées et à venir
                </p>
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="upcoming">
                        À venir
                        {upcomingBookings.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {upcomingBookings.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="past">
                        Passées
                        {pastBookings.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {pastBookings.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="cancelled">
                        Annulées
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
                            <p>Vous n'avez aucune réservation à venir.</p>
                            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                                <Button variant="default" asChild>
                                    <a href="/member/book">Réserver une séance</a>
                                </Button>
                                <Button variant="outline" asChild>
                                    <a href="/member/recurring-bookings">Créer une récurrence</a>
                                </Button>
                            </div>
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
                            Aucune séance passée.
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
                            Aucune réservation annulée.
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
