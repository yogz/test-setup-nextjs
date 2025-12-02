'use client';

import { useMemo, useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ShadcnBigCalendar } from '@/components/ui/shadcn-big-calendar';
import { bookAvailableSlotAction, cancelBookingAction, createBookingAction } from '@/app/actions/gym-actions';
import type { Formats, Messages } from 'react-big-calendar';
import type { AvailableSlot } from '@/lib/utils/availability';
import { Filter, User, Users } from 'lucide-react';

interface Session {
    id: string;
    title: string | null;
    description: string | null;
    type: string;
    startTime: Date;
    endTime: Date;
    capacity: number | null;
    coachId: string;
    coach: { id: string; name: string | null };
    room: { id: string; name: string } | null;
    bookings: Array<{ id: string; memberId: string; status: string }>;
}

interface MemberCalendarProps {
    sessions: Session[];
    availableSlots: AvailableSlot[];
    userId: string;
}

type CalendarEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    eventType: 'session' | 'available';
    session?: Session;
    slot?: AvailableSlot;
};

const calendarFormats: Formats = {
    dayHeaderFormat: (date, culture, localizer) =>
        localizer?.format(date, 'EEEE d MMM', culture) ?? '',
    dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
        `${localizer?.format(start, 'd MMM', culture) ?? ''} – ${localizer?.format(end, 'd MMM yyyy', culture) ?? ''}`,
    eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
        `${localizer?.format(start, 'HH:mm', culture) ?? ''} - ${localizer?.format(end, 'HH:mm', culture) ?? ''}`,
    timeGutterFormat: (date, culture, localizer) =>
        localizer?.format(date, 'HH:mm', culture) ?? '',
};

const calendarMessages: Messages = {
    date: 'Date',
    time: 'Heure',
    event: 'Événement',
    allDay: 'Journée',
    week: 'Semaine',
    work_week: 'Semaine',
    day: 'Jour',
    month: 'Mois',
    previous: 'Précédent',
    next: 'Suivant',
    yesterday: 'Hier',
    tomorrow: 'Demain',
    today: "Aujourd'hui",
    agenda: 'Agenda',
    showMore: (total) => `+${total} plus`,
};

export function MemberCalendar({ sessions, availableSlots, userId }: MemberCalendarProps) {
    const [currentDate, setCurrentDate] = useState(getStartOfWeek(new Date()));
    const [selectedCoach, setSelectedCoach] = useState<string>('all');
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isPending, startTransition] = useTransition();

    const minTime = useMemo(() => {
        const date = new Date();
        date.setHours(7, 0, 0, 0);
        return date;
    }, []);

    const maxTime = useMemo(() => {
        const date = new Date();
        date.setHours(21, 0, 0, 0);
        return date;
    }, []);

    const coaches = useMemo(() => {
        const coachMap = new Map<string, { id: string; name: string }>();

        sessions.forEach(session => {
            if (!coachMap.has(session.coachId)) {
                coachMap.set(session.coachId, { id: session.coachId, name: session.coach.name || 'Coach' });
            }
        });

        availableSlots.forEach(slot => {
            if (!coachMap.has(slot.coachId)) {
                coachMap.set(slot.coachId, { id: slot.coachId, name: slot.coachName || 'Coach' });
            }
        });

        return Array.from(coachMap.values());
    }, [sessions, availableSlots]);

    const events = useMemo<CalendarEvent[]>(() => {
        const filteredSessions = selectedCoach === 'all'
            ? sessions
            : sessions.filter(session => session.coachId === selectedCoach);

        const filteredSlots = selectedCoach === 'all'
            ? availableSlots
            : availableSlots.filter(slot => slot.coachId === selectedCoach);

        const sessionEvents = filteredSessions.map(session => ({
            id: `session-${session.id}`,
            title: session.title || 'Session',
            start: new Date(session.startTime),
            end: new Date(session.endTime),
            eventType: 'session' as const,
            session,
        }));

        const slotEvents = filteredSlots.map(slot => ({
            id: `slot-${slot.coachId}-${slot.startTime.getTime()}`,
            title: 'Créneau disponible',
            start: new Date(slot.startTime),
            end: new Date(slot.endTime),
            eventType: 'available' as const,
            slot,
        }));

        return [...sessionEvents, ...slotEvents];
    }, [availableSlots, selectedCoach, sessions]);

    const handleBooking = async () => {
        if (!selectedEvent) return;

        startTransition(async () => {
            if (selectedEvent.eventType === 'available' && selectedEvent.slot) {
                const slot = selectedEvent.slot;
                const result = await bookAvailableSlotAction({
                    coachId: slot.coachId,
                    startTime: slot.startTime.toISOString(),
                    endTime: slot.endTime.toISOString(),
                });
                if (!result.success) {
                    alert('error' in result ? result.error : 'Une erreur est survenue');
                    return;
                }
            } else if (selectedEvent.session) {
                const session = selectedEvent.session;
                const userBooking = session.bookings.find(
                    b => b.memberId === userId && b.status === 'CONFIRMED'
                );

                if (userBooking) {
                    await cancelBookingAction({ bookingId: userBooking.id });
                } else {
                    await createBookingAction({ sessionId: session.id });
                }
            }
            setSelectedEvent(null);
        });
    };

    const isUserBooked = (session: Session) => {
        return session.bookings.some(b => b.memberId === userId && b.status === 'CONFIRMED');
    };

    const isSessionFull = (session: Session) => {
        const confirmed = session.bookings.filter(b => b.status === 'CONFIRMED').length;
        return session.capacity ? confirmed >= session.capacity : false;
    };

    const eventStyleGetter = (event: CalendarEvent) => {
        if (event.eventType === 'available') {
            return {
                className: 'border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100',
            };
        }

        const session = event.session;
        if (!session) return {};

        const booked = isUserBooked(session);
        const full = isSessionFull(session);

        if (booked) {
            return {
                className: 'border border-green-200 bg-green-50 text-green-800 hover:bg-green-100',
            };
        }

        if (full) {
            return {
                className: 'border border-border bg-muted text-muted-foreground cursor-not-allowed',
            };
        }

        return {
            className: 'border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
        };
    };

    const EventCard = ({ event }: { event: CalendarEvent }) => {
        if (event.eventType === 'available' && event.slot) {
            return (
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm font-medium">
                        <User className="h-3.5 w-3.5" />
                        Disponible
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                        {event.slot.coachName}
                    </div>
                </div>
            );
        }

        const session = event.session;
        if (!session) return null;
        const booked = isUserBooked(session);

        return (
            <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm font-semibold">
                    {session.type === 'GROUP' ? (
                        <Users className="h-3.5 w-3.5" />
                    ) : (
                        <User className="h-3.5 w-3.5" />
                    )}
                    <span className="truncate">{session.title || 'Session'}</span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                    {session.coach.name}
                </div>
                {booked && <div className="text-[11px] font-medium text-green-700">Réservé</div>}
            </div>
        );
    };

    const selectedSession = selectedEvent?.session;
    const bookedSession = selectedSession ? isUserBooked(selectedSession) : false;
    const fullSession = selectedSession ? isSessionFull(selectedSession) : false;

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="Choisir un coach" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les coaches</SelectItem>
                                    {coaches.map(coach => (
                                        <SelectItem key={coach.id} value={coach.id}>
                                            {coach.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs">
                            <div className="flex items-center gap-1">
                                <Badge className="bg-purple-500 hover:bg-purple-600">
                                    <User className="h-3 w-3" />
                                </Badge>
                                <span className="text-muted-foreground">Créneau disponible</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Badge className="bg-blue-500 hover:bg-blue-600">
                                    <Users className="h-3 w-3" />
                                </Badge>
                                <span className="text-muted-foreground">Session collective</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Badge className="bg-green-500 hover:bg-green-600">✓</Badge>
                                <span className="text-muted-foreground">Déjà réservé</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Badge variant="secondary">Complet</Badge>
                                <span className="text-muted-foreground">Session complète</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Calendrier hebdomadaire</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ShadcnBigCalendar<CalendarEvent>
                        date={currentDate}
                        onNavigate={(date) => setCurrentDate(getStartOfWeek(date))}
                        view="week"
                        defaultView="week"
                        events={events}
                        step={60}
                        timeslots={1}
                        min={minTime}
                        max={maxTime}
                        formats={calendarFormats}
                        messages={calendarMessages}
                        popup
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={(event) => setSelectedEvent(event)}
                        components={{ event: EventCard }}
                        style={{ minHeight: 640 }}
                    />
                </CardContent>
            </Card>

            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedEvent?.eventType === 'available' ? 'Réserver un créneau' : 'Détails de la session'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEvent?.eventType === 'available' && selectedEvent.slot ? (
                                <div className="space-y-2 pt-4">
                                    <p><strong>Coach:</strong> {selectedEvent.slot.coachName}</p>
                                    <p><strong>Type:</strong> Session individuelle</p>
                                    <p><strong>Date:</strong> {selectedEvent.start.toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}</p>
                                    <p><strong>Heure:</strong> {selectedEvent.start.toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })} - {selectedEvent.end.toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</p>
                                </div>
                            ) : selectedSession ? (
                                <div className="space-y-2 pt-4">
                                    <p><strong>Titre:</strong> {selectedSession.title || 'Session d\'entraînement'}</p>
                                    {selectedSession.description && <p><strong>Description:</strong> {selectedSession.description}</p>}
                                    <p><strong>Coach:</strong> {selectedSession.coach.name}</p>
                                    <p><strong>Type:</strong> {selectedSession.type === 'GROUP' ? 'Collectif' : 'Individuel'}</p>
                                    <p><strong>Date:</strong> {selectedSession.startTime.toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}</p>
                                    <p><strong>Heure:</strong> {selectedSession.startTime.toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })} - {selectedSession.endTime.toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</p>
                                    {selectedSession.room && <p><strong>Salle:</strong> {selectedSession.room.name}</p>}
                                    <p><strong>Places:</strong> {selectedSession.bookings.filter(b => b.status === 'CONFIRMED').length} / {selectedSession.capacity || 1}</p>
                                </div>
                            ) : null}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                            Annuler
                        </Button>
                        {selectedEvent?.eventType === 'available' ? (
                            <Button onClick={handleBooking} disabled={isPending}>
                                {isPending ? 'Réservation...' : 'Réserver'}
                            </Button>
                        ) : selectedSession ? (
                            bookedSession ? (
                                <Button variant="destructive" onClick={handleBooking} disabled={isPending}>
                                    {isPending ? 'Annulation...' : 'Annuler ma réservation'}
                                </Button>
                            ) : fullSession ? (
                                <Button disabled>Complet</Button>
                            ) : (
                                <Button onClick={handleBooking} disabled={isPending}>
                                    {isPending ? 'Réservation...' : 'Réserver'}
                                </Button>
                            )
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
