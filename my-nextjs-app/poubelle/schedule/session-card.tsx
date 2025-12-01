'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Users, MapPin, Repeat } from 'lucide-react';
import { createBookingAction, createRecurringBookingAction, cancelBookingAction, bookAvailableSlotAction } from '@/app/actions/gym-actions';
import { useTransition, useState } from 'react';

interface SessionCardProps {
    session: {
        id: string;
        title: string | null;
        description: string | null;
        type: string;
        startTime: Date;
        endTime: Date;
        capacity: number | null;
        isRecurring: boolean | null;
        level: string | null;
        coachId: string;
        coach: { id: string; name: string | null };
        room: { id: string; name: string } | null;
        bookings: Array<{ id: string; memberId: string; status: string }>;
        isAvailableSlot?: boolean;
    };
    userId: string;
}

export function SessionCard({ session, userId }: SessionCardProps) {
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [occurrences, setOccurrences] = useState('4');

    const isBooked = session.bookings.some(
        b => b.memberId === userId && b.status === 'CONFIRMED'
    );
    const isFull = (session.capacity || 1) <= session.bookings.filter(
        b => b.status === 'CONFIRMED'
    ).length;
    const userBooking = session.bookings.find(
        b => b.memberId === userId && b.status === 'CONFIRMED'
    );

    const confirmedBookings = session.bookings.filter(b => b.status === 'CONFIRMED').length;
    const spotsLeft = (session.capacity || 1) - confirmedBookings;

    const handleBooking = () => {
        startTransition(async () => {
            if (session.isAvailableSlot) {
                // For virtual slots, create session + booking atomically
                await bookAvailableSlotAction({
                    coachId: session.coachId,
                    startTime: session.startTime.toISOString(),
                    endTime: session.endTime.toISOString(),
                });
            } else if (isBooked && userBooking) {
                await cancelBookingAction({ bookingId: userBooking.id });
            } else {
                await createBookingAction({ sessionId: session.id });
            }
        });
    };

    const handleRecurringBooking = () => {
        startTransition(async () => {
            const result = await createRecurringBookingAction({
                sessionId: session.id,
                numberOfOccurrences: parseInt(occurrences)
            });
            if (result.success) {
                setIsDialogOpen(false);
            }
        });
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <CardTitle className="text-lg">
                            {session.title || 'Session d\'entraînement'}
                        </CardTitle>
                        <CardDescription>avec {session.coach.name || 'Coach'}</CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                        <Badge variant={session.type === 'ONE_TO_ONE' ? 'outline' : 'secondary'}>
                            {session.type === 'ONE_TO_ONE' ? 'Individuel' : 'Collectif'}
                        </Badge>
                        {session.isRecurring && (
                            <Badge variant="outline" className="gap-1">
                                <Repeat className="h-3 w-3" />
                                Récurrent
                            </Badge>
                        )}
                        {session.level && (
                            <Badge variant="outline">
                                {session.level}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
                {session.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {session.description}
                    </p>
                )}

                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(session.startTime).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                            {new Date(session.startTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })} - {new Date(session.endTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>

                    {session.room && !session.isAvailableSlot && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{session.room.name}</span>
                        </div>
                    )}

                    {!session.isAvailableSlot && (
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className={spotsLeft === 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                                {confirmedBookings} / {session.capacity || 1} places
                                {spotsLeft > 0 && spotsLeft <= 3 && (
                                    <span className="text-orange-600 ml-2">
                                        ({spotsLeft} place{spotsLeft > 1 ? 's' : ''} restante{spotsLeft > 1 ? 's' : ''})
                                    </span>
                                )}
                            </span>
                        </div>
                    )}

                    {session.isAvailableSlot && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>Créneau disponible</span>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex gap-2">
                {session.isAvailableSlot ? (
                    <Button
                        className="w-full"
                        onClick={handleBooking}
                        disabled={isPending}
                    >
                        {isPending ? 'Réservation...' : 'Réserver ce créneau'}
                    </Button>
                ) : isBooked ? (
                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleBooking}
                        disabled={isPending}
                    >
                        {isPending ? 'Annulation...' : 'Annuler ma réservation'}
                    </Button>
                ) : isFull ? (
                    <Button disabled className="w-full">
                        Complet
                    </Button>
                ) : (
                    <>
                        <Button
                            className="flex-1"
                            onClick={handleBooking}
                            disabled={isPending}
                        >
                            {isPending ? 'Réservation...' : 'Réserver'}
                        </Button>
                        {session.isRecurring && (
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" disabled={isPending}>
                                        <Repeat className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Réservation récurrente</DialogTitle>
                                        <DialogDescription>
                                            Réservez plusieurs occurrences de cette session en une seule fois.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Nombre de sessions à réserver</Label>
                                            <Select value={occurrences} onValueChange={setOccurrences}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="4">4 sessions (1 mois)</SelectItem>
                                                    <SelectItem value="8">8 sessions (2 mois)</SelectItem>
                                                    <SelectItem value="12">12 sessions (3 mois)</SelectItem>
                                                    <SelectItem value="24">24 sessions (6 mois)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Cette session se répète chaque {' '}
                                            {new Date(session.startTime).toLocaleDateString('fr-FR', { weekday: 'long' })}
                                            {' à '}
                                            {new Date(session.startTime).toLocaleTimeString('fr-FR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}.
                                        </p>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                            Annuler
                                        </Button>
                                        <Button onClick={handleRecurringBooking} disabled={isPending}>
                                            {isPending ? 'Réservation...' : `Réserver ${occurrences} sessions`}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </>
                )}
            </CardFooter>
        </Card>
    );
}
