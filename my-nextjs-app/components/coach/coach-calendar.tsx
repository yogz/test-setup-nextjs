'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShadcnBigCalendar } from '@/components/ui/shadcn-big-calendar';
import type { Formats, Messages, SlotInfo } from 'react-big-calendar';
import { BlockSlotModal } from './modals/block-slot-modal';
import { BookMemberModal } from './modals/book-member-modal';
import { CreateClassModal } from './modals/create-class-modal';
import { EventDetailsModal } from './modals/event-details-modal';
import { Lock, Users, UserPlus } from 'lucide-react';

// Types
interface WeeklyAvailability {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isIndividual: boolean;
    isGroup: boolean;
}

interface BlockedSlot {
    id: string;
    startTime: Date;
    endTime: Date;
    reason: string | null;
}

interface Session {
    id: string;
    title: string | null;
    startTime: Date;
    endTime: Date;
    type: 'ONE_TO_ONE' | 'GROUP';
    status: string;
    capacity: number | null;
    bookings: any[];
    roomId: string;
    description: string | null;
}

interface CoachCalendarProps {
    weeklyAvailability: WeeklyAvailability[];
    blockedSlots: BlockedSlot[];
    sessions: Session[];
    rooms: any[];
    members: any[];
    coachName: string;
}

type CalendarEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    type: 'GROUP' | 'ONE_TO_ONE' | 'BLOCKED';
    session?: Session;
    block?: BlockedSlot;
};

const calendarFormats: Formats = {
    dayHeaderFormat: (date, culture, localizer) =>
        localizer!.format(date, 'EEEE d MMM', culture),
    dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
        `${localizer!.format(start, 'd MMM', culture)} – ${localizer!.format(end, 'd MMM yyyy', culture)}`,
    eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
        `${localizer!.format(start, 'HH:mm', culture)} - ${localizer!.format(end, 'HH:mm', culture)}`,
    timeGutterFormat: (date, culture, localizer) =>
        localizer!.format(date, 'HH:mm', culture),
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

export function CoachCalendar({
    weeklyAvailability,
    blockedSlots,
    sessions,
    rooms,
    members,
    coachName
}: CoachCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const minTime = useMemo(() => {
        const date = new Date();
        date.setHours(8, 0, 0, 0);
        return date;
    }, []);

    const maxTime = useMemo(() => {
        const date = new Date();
        date.setHours(21, 0, 0, 0);
        return date;
    }, []);

    const events = useMemo<CalendarEvent[]>(() => {
        const sessionEvents = sessions
            .filter(session => session.status !== 'CANCELLED')
            .map(session => ({
                id: session.id,
                title: session.title || (session.type === 'GROUP' ? 'Cours collectif' : 'Session individuelle'),
                start: new Date(session.startTime),
                end: new Date(session.endTime),
                type: session.type,
                session,
            }));

        const blockEvents = blockedSlots.map(block => ({
            id: block.id,
            title: block.reason || 'Créneau bloqué',
            start: new Date(block.startTime),
            end: new Date(block.endTime),
            type: 'BLOCKED' as const,
            block,
        }));

        return [...sessionEvents, ...blockEvents];
    }, [blockedSlots, sessions]);

    const isSlotAvailable = (date: Date) => {
        const dayOfWeek = date.getDay();
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        const template = weeklyAvailability.find(
            a => a.dayOfWeek === dayOfWeek && a.startTime <= timeStr && a.endTime > timeStr
        );

        if (!template) return false;

        const isBlocked = blockedSlots.some(block =>
            new Date(block.startTime) <= date && new Date(block.endTime) > date
        );

        return !isBlocked;
    };

    const slotHasEvents = (slotStart: Date) => {
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + 60);

        return events.some(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            return eventStart < slotEnd && eventEnd > slotStart;
        });
    };

    const eventStyleGetter = (event: CalendarEvent) => {
        if (event.type === 'BLOCKED') {
            return {
                className: 'border border-slate-200 bg-slate-100 text-slate-800',
            };
        }

        return {
            className: event.type === 'GROUP'
                ? 'border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100'
                : 'border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
        };
    };

    const slotPropGetter = (date: Date) => {
        const available = isSlotAvailable(date);
        return available
            ? {}
            : { style: { backgroundColor: 'rgba(148, 163, 184, 0.18)' } };
    };

    const handleSelectSlot = (slot: SlotInfo) => {
        const slotStart = new Date(slot.start);

        if (isSlotAvailable(slotStart) && !slotHasEvents(slotStart)) {
            const timeLabel = slotStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            setSelectedSlot({ date: slotStart, time: timeLabel });
            setIsActionMenuOpen(true);
        }
    };

    const EventCard = ({ event }: { event: CalendarEvent }) => {
        if (event.type === 'BLOCKED') {
            return (
                <div className="space-y-1">
                    <div className="text-sm font-semibold">Bloqué</div>
                    {event.block?.reason && (
                        <div className="text-xs text-muted-foreground truncate">{event.block.reason}</div>
                    )}
                </div>
            );
        }

        const session = event.session;
        if (!session) return null;

        const isGroup = session.type === 'GROUP';
        const count = session.bookings?.length || 0;

        return (
            <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm font-semibold">
                    {isGroup ? <Users className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                    <span className="truncate">{session.title || (isGroup ? 'Cours collectif' : 'Session')}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{new Date(session.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    {isGroup && session.capacity && (
                        <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-purple-200 text-purple-800 hover:bg-purple-300">
                            {count}/{session.capacity}
                        </Badge>
                    )}
                </div>
                {session.description && (
                    <div className="text-[11px] text-muted-foreground truncate">{session.description}</div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Calendrier des créneaux</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Gérez vos disponibilités, cours collectifs et réservations individuelles.
                    </p>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full border border-purple-300 bg-purple-100" />
                            <span>Cours collectif</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full border border-blue-300 bg-blue-100" />
                            <span>Session 1:1</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full border border-slate-200 bg-slate-100" />
                            <span>Bloqué</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-slate-200" />
                            <span>Indisponible (hors template)</span>
                        </div>
                    </div>

                    <ShadcnBigCalendar<CalendarEvent>
                        date={currentDate}
                        onNavigate={setCurrentDate}
                        view="week"
                        defaultView="week"
                        events={events}
                        step={60}
                        timeslots={1}
                        selectable
                        min={minTime}
                        max={maxTime}
                        formats={calendarFormats}
                        messages={calendarMessages}
                        eventPropGetter={eventStyleGetter}
                        slotPropGetter={slotPropGetter}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={(event) => setSelectedEvent(event)}
                        components={{ event: EventCard }}
                        style={{ minHeight: 720 }}
                    />
                </CardContent>
            </Card>

            <BlockSlotModal
                isOpen={isBlockModalOpen}
                onClose={() => setIsBlockModalOpen(false)}
                initialDate={selectedSlot?.date}
                initialStartTime={selectedSlot?.time}
            />
            <CreateClassModal
                isOpen={isClassModalOpen}
                onClose={() => setIsClassModalOpen(false)}
                initialDate={selectedSlot?.date}
                rooms={rooms}
                coachName={coachName}
            />
            <BookMemberModal
                isOpen={isBookModalOpen}
                onClose={() => setIsBookModalOpen(false)}
                initialDate={selectedSlot?.date}
                members={members}
                rooms={rooms}
            />
            <EventDetailsModal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                event={selectedEvent}
            />

            <Dialog open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Que souhaitez-vous faire ?</DialogTitle>
                        <DialogDescription>
                            {selectedSlot && (
                                <>
                                    {selectedSlot.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    {' à '}
                                    {selectedSlot.time}
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-4">
                        <Button
                            variant="outline"
                            className="justify-start h-auto py-4 px-4"
                            onClick={() => {
                                setIsActionMenuOpen(false);
                                setIsBlockModalOpen(true);
                            }}
                        >
                            <Lock className="mr-3 h-5 w-5" />
                            <div className="text-left">
                                <div className="font-medium">Bloquer ce créneau</div>
                                <div className="text-sm text-muted-foreground">Rendre ce créneau indisponible</div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start h-auto py-4 px-4"
                            onClick={() => {
                                setIsActionMenuOpen(false);
                                setIsClassModalOpen(true);
                            }}
                        >
                            <Users className="mr-3 h-5 w-5" />
                            <div className="text-left">
                                <div className="font-medium">Créer un cours collectif</div>
                                <div className="text-sm text-muted-foreground">Session de groupe avec plusieurs participants</div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start h-auto py-4 px-4"
                            onClick={() => {
                                setIsActionMenuOpen(false);
                                setIsBookModalOpen(true);
                            }}
                        >
                            <UserPlus className="mr-3 h-5 w-5" />
                            <div className="text-left">
                                <div className="font-medium">Réserver pour un membre</div>
                                <div className="text-sm text-muted-foreground">Session individuelle avec un membre</div>
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
