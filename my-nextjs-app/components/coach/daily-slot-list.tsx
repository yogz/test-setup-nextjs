'use client';

import { useMemo, useState, useRef, useCallback, useEffect, Fragment } from 'react';
import { format, addDays, isSameDay, setHours, setMinutes, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MapPin, Users, User, Lock, Repeat, Clock } from 'lucide-react';
import { BlockSlotModal } from './modals/block-slot-modal';
import { BookMemberModal } from './modals/book-member-modal';
import { CreateClassModal } from './modals/create-class-modal';
import { EventDetailsModal } from './modals/event-details-modal';
import { ActionMenuModal } from './modals/action-menu-modal';

// Types (reused/adapted from coach-calendar)
interface WeeklyAvailability {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isIndividual: boolean;
    isGroup: boolean;
    roomId?: string;
    duration?: number; // Duration in minutes (optional, uses defaultDuration if not set)
}

interface BlockedSlot {
    id: string;
    startTime: Date;
    endTime: Date;
    reason: string | null;
}

interface AvailabilityAddition {
    id: string;
    startTime: Date;
    endTime: Date;
    isIndividual: boolean;
    isGroup: boolean;
    roomId?: string;
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
    member?: { id: string; name: string } | null;
    room?: { id: string; name: string } | null;
    isRecurring?: boolean;
    recurringBookingId?: string | null;
}

interface DailySlotListProps {
    weeklyAvailability: WeeklyAvailability[];
    blockedSlots: BlockedSlot[];
    availabilityAdditions?: AvailabilityAddition[];
    sessions: Session[];
    rooms: any[];
    members: any[];
    coachName: string;
    coachId: string;
    defaultDuration?: number; // Default session duration in minutes
}

type SlotStatus = 'FREE' | 'BLOCKED' | 'BOOKED' | 'EXCEPTIONAL';

interface DailySlot {
    time: string;
    date: Date;
    status: SlotStatus;
    session?: Session;
    block?: BlockedSlot;
    isIndividual: boolean;
    isGroup: boolean;
    roomId?: string;
    isExceptional?: boolean;
    isRecurring?: boolean; // True if slot comes from weekly template
    duration?: number; // Duration in minutes
}

export function DailySlotList({
    weeklyAvailability,
    blockedSlots,
    availabilityAdditions = [],
    sessions,
    rooms,
    members,
    coachName,
    coachId,
    defaultDuration = 60
}: DailySlotListProps) {
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<{ session?: Session; block?: BlockedSlot } | null>(null);

    // Infinite scroll state
    const [daysToShow, setDaysToShow] = useState(14); // Start with 2 weeks
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const maxDays = 84; // 12 weeks max

    // Generate days based on daysToShow
    const days = useMemo(() => {
        const today = startOfDay(new Date());
        return Array.from({ length: Math.min(daysToShow, maxDays) }, (_, i) => addDays(today, i));
    }, [daysToShow]);

    // Pre-compute occupied time slots using Sets for O(1) lookup
    const occupiedSlotsMap = useMemo(() => {
        const sessionsMap = new Map<number, Session>();
        const blockedMap = new Map<number, BlockedSlot>();

        // Index sessions by their time range (every 15-min interval)
        sessions.forEach(s => {
            const start = new Date(s.startTime).getTime();
            const end = new Date(s.endTime).getTime();
            for (let t = start; t < end; t += 15 * 60 * 1000) {
                sessionsMap.set(t, s);
            }
        });

        // Index blocked slots by their time range
        blockedSlots.forEach(b => {
            const start = new Date(b.startTime).getTime();
            const end = new Date(b.endTime).getTime();
            for (let t = start; t < end; t += 15 * 60 * 1000) {
                blockedMap.set(t, b);
            }
        });

        return { sessions: sessionsMap, blocked: blockedMap };
    }, [sessions, blockedSlots]);

    // Load more days when sentinel is visible
    const loadMoreDays = useCallback(() => {
        if (daysToShow >= maxDays || isLoadingMore) return;

        setIsLoadingMore(true);
        // Simulate loading delay for smooth UX
        setTimeout(() => {
            setDaysToShow(prev => Math.min(prev + 7, maxDays)); // Add 1 week
            setIsLoadingMore(false);
        }, 300);
    }, [daysToShow, isLoadingMore]);

    // Setup Intersection Observer
    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMoreDays();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current);
        }

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [loadMoreDays]);

    // Optimized getSlotsForDay using Map lookups (O(1) instead of O(n))
    const getSlotsForDay = useCallback((date: Date) => {
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const { sessions: sessionsMap, blocked: blockedMap } = occupiedSlotsMap;

        // Find availability for this day (weekly template)
        const dayAvailability = weeklyAvailability.filter(a => a.dayOfWeek === dayOfWeek);

        // Find exceptional availability for this specific date
        const exceptionalAvailability = availabilityAdditions.filter(addition => {
            const additionDate = startOfDay(new Date(addition.startTime));
            return isSameDay(additionDate, date);
        });

        if (dayAvailability.length === 0 && exceptionalAvailability.length === 0) return [];

        const slots: DailySlot[] = [];
        const slotsTimeIndex = new Map<string, number>(); // For quick duplicate check

        // Helper to find session/block using O(1) Map lookup
        const findSessionForSlot = (slotStart: Date, slotEnd: Date): Session | undefined => {
            for (let t = slotStart.getTime(); t < slotEnd.getTime(); t += 15 * 60 * 1000) {
                const session = sessionsMap.get(t);
                if (session) return session;
            }
            return undefined;
        };

        const findBlockForSlot = (slotStart: Date, slotEnd: Date): BlockedSlot | undefined => {
            for (let t = slotStart.getTime(); t < slotEnd.getTime(); t += 15 * 60 * 1000) {
                const block = blockedMap.get(t);
                if (block) return block;
            }
            return undefined;
        };

        dayAvailability.forEach(avail => {
            const [startHour, startMinute] = avail.startTime.split(':').map(Number);
            const [endHour, endMinute] = avail.endTime.split(':').map(Number);

            let currentSlotTime = setMinutes(setHours(date, startHour), startMinute);
            const endTime = setMinutes(setHours(date, endHour), endMinute);

            // Calculate slot duration: use availability duration if set, otherwise use defaultDuration
            const slotDuration = avail.duration || defaultDuration;

            while (isBefore(currentSlotTime, endTime)) {
                const timeStr = format(currentSlotTime, 'HH:mm');
                const slotEnd = setMinutes(currentSlotTime, currentSlotTime.getMinutes() + slotDuration);

                // O(1) lookups using Maps
                const session = findSessionForSlot(currentSlotTime, slotEnd);
                const block = findBlockForSlot(currentSlotTime, slotEnd);

                let status: SlotStatus = 'FREE';
                if (session) status = 'BOOKED';
                else if (block) status = 'BLOCKED';

                const slotIndex = slots.length;
                slotsTimeIndex.set(timeStr, slotIndex);

                slots.push({
                    time: timeStr,
                    date: currentSlotTime,
                    status,
                    session,
                    block,
                    isIndividual: avail.isIndividual,
                    isGroup: avail.isGroup,
                    roomId: session?.roomId || avail.roomId,
                    isRecurring: session?.recurringBookingId ? true : false,
                    duration: slotDuration,
                });

                currentSlotTime = slotEnd;
            }
        });

        // Add exceptional availability slots
        exceptionalAvailability.forEach(addition => {
            const addStart = new Date(addition.startTime);
            const addEnd = new Date(addition.endTime);

            // Use defaultDuration for exceptional slots
            const exceptionalDuration = defaultDuration;

            let currentSlotTime = addStart;

            while (isBefore(currentSlotTime, addEnd)) {
                const timeStr = format(currentSlotTime, 'HH:mm');
                const slotEnd = setMinutes(currentSlotTime, currentSlotTime.getMinutes() + exceptionalDuration);

                // O(1) lookups using Maps
                const session = findSessionForSlot(currentSlotTime, slotEnd);
                const block = findBlockForSlot(currentSlotTime, slotEnd);

                let status: SlotStatus = 'EXCEPTIONAL';
                if (session) status = 'BOOKED';
                else if (block) status = 'BLOCKED';

                // O(1) check if slot already exists
                const existingSlotIndex = slotsTimeIndex.get(timeStr);
                if (existingSlotIndex !== undefined) {
                    // Replace existing slot with exceptional one
                    slots[existingSlotIndex] = {
                        time: timeStr,
                        date: currentSlotTime,
                        status,
                        session,
                        block,
                        isIndividual: addition.isIndividual,
                        isGroup: addition.isGroup,
                        roomId: session?.roomId || addition.roomId,
                        isExceptional: true,
                        isRecurring: session?.recurringBookingId ? true : false,
                        duration: exceptionalDuration,
                    };
                } else {
                    const slotIndex = slots.length;
                    slotsTimeIndex.set(timeStr, slotIndex);
                    slots.push({
                        time: timeStr,
                        date: currentSlotTime,
                        status,
                        session,
                        block,
                        isIndividual: addition.isIndividual,
                        isGroup: addition.isGroup,
                        roomId: session?.roomId || addition.roomId,
                        isExceptional: true,
                        isRecurring: session?.recurringBookingId ? true : false,
                        duration: exceptionalDuration,
                    });
                }

                currentSlotTime = slotEnd;
            }
        });

        // Add standalone blocked slots (that don't overlap with availability)
        // Filter blocks for this day
        const dayBlocks = blockedSlots.filter(b => {
            const bStart = new Date(b.startTime);
            return isSameDay(bStart, date);
        });

        dayBlocks.forEach(block => {
            const bStart = new Date(block.startTime);
            const bEnd = new Date(block.endTime);

            let currentSlotTime = bStart;

            while (isBefore(currentSlotTime, bEnd)) {
                const timeStr = format(currentSlotTime, 'HH:mm');
                const slotEnd = setMinutes(currentSlotTime, currentSlotTime.getMinutes() + 60);

                // O(1) check if slot already exists
                if (!slotsTimeIndex.has(timeStr)) {
                    const slotIndex = slots.length;
                    slotsTimeIndex.set(timeStr, slotIndex);
                    slots.push({
                        time: timeStr,
                        date: currentSlotTime,
                        status: 'BLOCKED',
                        session: undefined,
                        block: block,
                        isIndividual: false,
                        isGroup: false,
                        roomId: undefined,
                        isExceptional: false,
                        isRecurring: false,
                        duration: 60,
                    });
                }

                currentSlotTime = slotEnd;
            }
        });

        return slots.sort((a, b) => a.time.localeCompare(b.time));
    }, [weeklyAvailability, availabilityAdditions, blockedSlots, occupiedSlotsMap, defaultDuration]);

    const handleSlotClick = (slot: DailySlot) => {
        if (slot.status === 'FREE' || slot.status === 'EXCEPTIONAL') {
            setSelectedSlot({ date: slot.date, time: slot.time });
            setIsActionMenuOpen(true);
        } else if (slot.status === 'BOOKED' && slot.session) {
            setSelectedEvent({ session: slot.session });
        } else if (slot.status === 'BLOCKED' && slot.block) {
            setSelectedEvent({ block: slot.block });
        }
    };

    return (
        <div className="space-y-6">
            {days.map((day) => {
                const slots = getSlotsForDay(day);
                if (slots.length === 0) return null;

                return (
                    <div key={day.toISOString()} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                            <h3 className={cn(
                                "text-base md:text-lg font-semibold capitalize tracking-wide",
                                isSameDay(day, new Date()) ? "text-emerald-700" : "text-slate-700"
                            )}>
                                {isSameDay(day, new Date()) && (
                                    <span className="text-emerald-600 mr-2">●</span>
                                )}
                                {format(day, 'EEEE d MMMM', { locale: fr })}
                            </h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {slots.map((slot, index) => {
                                // Get room name from slot's roomId
                                const roomName = slot.roomId
                                    ? rooms.find(r => r.id === slot.roomId)?.name
                                    : null;

                                // Check if there's a time gap before this slot
                                const hasGapBefore = index > 0 && (() => {
                                    const prevSlot = slots[index - 1];
                                    const prevTime = new Date(prevSlot.date);
                                    const currentTime = new Date(slot.date);
                                    const prevDuration = prevSlot.duration || 60; // Use actual duration or default to 60 minutes
                                    const expectedNextTime = new Date(prevTime.getTime() + prevDuration * 60 * 1000);
                                    return currentTime.getTime() > expectedNextTime.getTime();
                                })();

                                return (
                                    <Fragment key={`slot-${day.toISOString()}-${index}`}>
                                        {hasGapBefore && (
                                            <div
                                                className="flex flex-col items-center justify-center gap-2 p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-dashed border-slate-300"
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent" />
                                                    <span className="text-xs font-medium text-slate-500 italic">Pause</span>
                                                    <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent" />
                                                </div>
                                            </div>
                                        )}
                                        <Card
                                            onClick={() => handleSlotClick(slot)}
                                        className={cn(
                                            "group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-0 p-0",
                                            slot.status === 'FREE' && "bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 shadow-sm",
                                            slot.status === 'EXCEPTIONAL' && "bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 shadow-sm ring-2 ring-amber-200",
                                            slot.status === 'BLOCKED' && "bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300",
                                            slot.status === 'BOOKED' && "bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 shadow-sm"
                                        )}
                                    >
                                        {/* Time Header Bar */}
                                        <div className={cn(
                                            "w-full px-3 py-2 flex items-center justify-between",
                                            slot.status === 'BOOKED' && "bg-violet-700",
                                            slot.status === 'FREE' && "bg-emerald-700",
                                            slot.status === 'EXCEPTIONAL' && "bg-amber-600",
                                            slot.status === 'BLOCKED' && "bg-slate-500"
                                        )}>
                                            <div className="flex items-center gap-2">
                                                {slot.status === 'BOOKED' && slot.session && (
                                                    slot.session.type === 'GROUP' ?
                                                        <Users className="h-3.5 w-3.5 text-white" /> :
                                                        <User className="h-3.5 w-3.5 text-white" />
                                                )}
                                                {slot.status !== 'BOOKED' && <Clock className="h-3.5 w-3.5 text-white" />}
                                                <span className="text-sm font-bold text-white">
                                                    {slot.time} - {format(new Date(slot.date.getTime() + (slot.duration || 60) * 60000), 'HH:mm')}
                                                </span>
                                            </div>
                                            {slot.status === 'BOOKED' && slot.isRecurring && (
                                                <Repeat className="h-3.5 w-3.5 text-white" />
                                            )}
                                        </div>

                                        {/* Content Section */}
                                        <div className="flex flex-col p-3 min-h-[5rem] relative z-10">
                                            {slot.status === 'FREE' && (
                                                <div className="flex-1 flex items-center justify-center">
                                                    <span className="text-sm md:text-base font-semibold text-emerald-700 italic">Libre</span>
                                                </div>
                                            )}

                                            {slot.status === 'EXCEPTIONAL' && (
                                                <div className="flex-1 flex items-center justify-center">
                                                    <span className="text-sm md:text-base font-semibold text-amber-700 italic">Dispo exceptionnelle</span>
                                                </div>
                                            )}

                                            {slot.status === 'BLOCKED' && (
                                                <div className="flex-1 flex items-center justify-center gap-1.5">
                                                    <Lock className="h-4 w-4 text-slate-600" />
                                                    <span className="text-sm font-semibold text-slate-700">Bloqué</span>
                                                </div>
                                            )}

                                            {slot.status === 'BOOKED' && slot.session && (
                                                <>
                                                    {/* Member info */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="h-8 w-8 rounded-full bg-violet-700 flex items-center justify-center">
                                                            {slot.session.type === 'GROUP' ? (
                                                                <Users className="h-4 w-4 text-white" />
                                                            ) : (
                                                                <User className="h-4 w-4 text-white" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-slate-800 truncate">
                                                                {slot.session.member?.name || slot.session.bookings?.[0]?.member?.name || slot.session.title || "Réservé"}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {slot.session.type === 'ONE_TO_ONE' ? 'Individuel' : 'Collectif'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Room */}
                                                    {roomName && (
                                                        <div className="flex items-center gap-1.5 text-slate-600">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            <span className="text-xs">{roomName}</span>
                                                        </div>
                                                    )}

                                                    {/* Group capacity badge */}
                                                    {slot.session.type === 'GROUP' && (
                                                        <div className="mt-2">
                                                            <Badge variant="outline" className="text-[10px]">
                                                                {slot.session.bookings?.length || 0}/{slot.session.capacity} inscrits
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Subtle shine effect on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    </Card>
                                    </Fragment>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-4" />

            {/* Loading indicator */}
            {isLoadingMore && (
                <div className="flex justify-center items-center py-8">
                    <div className="flex items-center gap-2 text-slate-600">
                        <div className="h-5 w-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        <span className="text-sm">Chargement...</span>
                    </div>
                </div>
            )}

            {/* End message when all days loaded */}
            {daysToShow >= maxDays && (
                <div className="flex justify-center py-8">
                    <div className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
                        {maxDays} jours affichés (12 semaines)
                    </div>
                </div>
            )}

            {/* Modals */}
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
                coachId={coachId}
                defaultDuration={defaultDuration}
            />

            {/* Action Menu */}
            <ActionMenuModal
                isOpen={isActionMenuOpen}
                onClose={() => setIsActionMenuOpen(false)}
                selectedSlot={selectedSlot}
                onBlockSlot={() => {
                    setIsActionMenuOpen(false);
                    setIsBlockModalOpen(true);
                }}
                onCreateClass={() => {
                    setIsActionMenuOpen(false);
                    setIsClassModalOpen(true);
                }}
                onBookMember={() => {
                    setIsActionMenuOpen(false);
                    setIsBookModalOpen(true);
                }}
            />

            {/* Event Details Modal Wrapper */}
            {selectedEvent && (
                <EventDetailsModal
                    isOpen={!!selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    event={{
                        title: selectedEvent.session?.title || selectedEvent.block?.reason || 'Event',
                        start: selectedEvent.session?.startTime ? new Date(selectedEvent.session.startTime) : new Date(selectedEvent.block!.startTime),
                        end: selectedEvent.session?.endTime ? new Date(selectedEvent.session.endTime) : new Date(selectedEvent.block!.endTime),
                        type: selectedEvent.session?.type || 'BLOCKED',
                        status: selectedEvent.session?.status,
                        session: selectedEvent.session ? {
                            id: selectedEvent.session.id,
                            capacity: selectedEvent.session.capacity,
                            bookings: selectedEvent.session.bookings,
                            description: selectedEvent.session.title,
                            room: selectedEvent.session.room,
                            member: selectedEvent.session.member,
                            status: selectedEvent.session.status
                        } : undefined,
                        block: selectedEvent.block ? {
                            id: selectedEvent.block.id,
                            reason: selectedEvent.block.reason
                        } : undefined
                    }}
                />
            )}
        </div>
    );
}
