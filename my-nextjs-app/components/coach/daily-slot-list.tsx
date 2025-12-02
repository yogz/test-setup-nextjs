'use client';

import { useMemo, useState, useRef, useCallback, useEffect, Fragment } from 'react';
import { format, addDays, isSameDay, setHours, setMinutes, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MapPin, Users, User, Lock, Repeat } from 'lucide-react';
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
    coachId
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

    const getSlotsForDay = (date: Date) => {
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Find availability for this day (weekly template)
        const dayAvailability = weeklyAvailability.filter(a => a.dayOfWeek === dayOfWeek);

        // Find exceptional availability for this specific date
        const exceptionalAvailability = availabilityAdditions.filter(addition => {
            const additionDate = startOfDay(new Date(addition.startTime));
            return isSameDay(additionDate, date);
        });

        if (dayAvailability.length === 0 && exceptionalAvailability.length === 0) return [];

        const slots: DailySlot[] = [];

        dayAvailability.forEach(avail => {
            const [startHour, startMinute] = avail.startTime.split(':').map(Number);
            const [endHour, endMinute] = avail.endTime.split(':').map(Number);

            let currentSlotTime = setMinutes(setHours(date, startHour), startMinute);
            const endTime = setMinutes(setHours(date, endHour), endMinute);

            // Calculate slot duration from availability or fallback to calculated duration
            const slotDuration = avail.duration ||
                ((endHour * 60 + endMinute) - (startHour * 60 + startMinute));

            while (isBefore(currentSlotTime, endTime)) {
                const timeStr = format(currentSlotTime, 'HH:mm');
                const slotEnd = setMinutes(currentSlotTime, currentSlotTime.getMinutes() + slotDuration);

                // Check for sessions
                const session = sessions.find(s => {
                    const sStart = new Date(s.startTime);
                    const sEnd = new Date(s.endTime);
                    // Check overlap
                    return (sStart < slotEnd && sEnd > currentSlotTime);
                });

                // Check for blocks
                const block = blockedSlots.find(b => {
                    const bStart = new Date(b.startTime);
                    const bEnd = new Date(b.endTime);
                    return (bStart < slotEnd && bEnd > currentSlotTime);
                });

                let status: SlotStatus = 'FREE';
                if (session) status = 'BOOKED';
                else if (block) status = 'BLOCKED';

                slots.push({
                    time: timeStr,
                    date: currentSlotTime,
                    status,
                    session,
                    block,
                    isIndividual: avail.isIndividual,
                    isGroup: avail.isGroup,
                    roomId: session?.roomId || avail.roomId,
                    isRecurring: session?.recurringBookingId ? true : false, // Only recurring if session has recurringBookingId
                    duration: slotDuration,
                });

                currentSlotTime = slotEnd;
            }
        });

        // Add exceptional availability slots
        exceptionalAvailability.forEach(addition => {
            const addStart = new Date(addition.startTime);
            const addEnd = new Date(addition.endTime);

            // Calculate duration for exceptional slots (default to 60 if not available)
            const exceptionalDuration = 60; // TODO: Add duration field to availabilityAdditions table if needed

            let currentSlotTime = addStart;

            while (isBefore(currentSlotTime, addEnd)) {
                const timeStr = format(currentSlotTime, 'HH:mm');
                const slotEnd = setMinutes(currentSlotTime, currentSlotTime.getMinutes() + exceptionalDuration);

                // Check for sessions
                const session = sessions.find(s => {
                    const sStart = new Date(s.startTime);
                    const sEnd = new Date(s.endTime);
                    return (sStart < slotEnd && sEnd > currentSlotTime);
                });

                // Check for blocks
                const block = blockedSlots.find(b => {
                    const bStart = new Date(b.startTime);
                    const bEnd = new Date(b.endTime);
                    return (bStart < slotEnd && bEnd > currentSlotTime);
                });

                let status: SlotStatus = 'EXCEPTIONAL';
                if (session) status = 'BOOKED';
                else if (block) status = 'BLOCKED';

                // Check if this slot already exists (e.g. from weekly availability)
                // If it does, we might want to override it or skip.
                // Usually exceptional availability overrides weekly.
                // But here we are just adding to the list.
                // Let's check if a slot at this time already exists.
                const existingSlotIndex = slots.findIndex(s => s.time === timeStr);
                if (existingSlotIndex >= 0) {
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
                        isRecurring: session?.recurringBookingId ? true : false, // Only recurring if session has recurringBookingId
                        duration: exceptionalDuration,
                    };
                } else {
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
                        isRecurring: session?.recurringBookingId ? true : false, // Only recurring if session has recurringBookingId
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

                // Check if slot already exists
                const existingSlot = slots.find(s => s.time === timeStr);

                if (!existingSlot) {
                    slots.push({
                        time: timeStr,
                        date: currentSlotTime,
                        status: 'BLOCKED',
                        session: undefined,
                        block: block,
                        isIndividual: false, // Default
                        isGroup: false,      // Default
                        roomId: undefined,
                        isExceptional: false,
                        isRecurring: false, // Blocked slots are not recurring
                        duration: 60, // Default duration for blocked slots
                    });
                }

                currentSlotTime = slotEnd;
            }
        });

        return slots.sort((a, b) => a.time.localeCompare(b.time));
    };

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
                            <h3 className="text-base md:text-lg font-semibold text-slate-700 capitalize tracking-wide">
                                {format(day, 'EEEE d MMMM', { locale: fr })}
                            </h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
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
                                        <div className="w-full px-2 py-1.5 flex items-center justify-center gap-1 bg-slate-900">
                                            {slot.status === 'BOOKED' && slot.session && (
                                                slot.session.type === 'GROUP' ?
                                                    <Users className="h-3 w-3 text-white" /> :
                                                    <User className="h-3 w-3 text-white" />
                                            )}
                                            <span className="text-xs md:text-sm font-bold text-white">{slot.time}</span>
                                            {slot.status === 'BOOKED' && slot.isRecurring && (
                                                <Repeat className="h-3 w-3 text-white" />
                                            )}
                                        </div>

                                        {/* Content Section */}
                                        <div className="flex flex-col p-2 min-h-[4.5rem] relative z-10">
                                            {/* Room Badge - More Visual */}
                                            {roomName && (
                                                <div className="flex items-center justify-center gap-1 mb-2">
                                                    <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-slate-200/50">
                                                        <MapPin className="h-3 w-3 text-slate-700" />
                                                        <span className="text-[10px] md:text-xs font-medium text-slate-700 truncate max-w-full">
                                                            {roomName}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Status/Content */}
                                            <div className="flex-1 flex flex-col items-center justify-center">
                                                {slot.status === 'FREE' && (
                                                    <span className="text-sm md:text-base font-medium text-emerald-700 italic">Libre</span>
                                                )}

                                                {slot.status === 'BLOCKED' && (
                                                    <div className="flex items-center gap-1">
                                                        <Lock className="h-3 w-3 text-slate-600" />
                                                        <span className="text-xs md:text-sm font-semibold text-slate-700">Bloqué</span>
                                                    </div>
                                                )}

                                                {slot.status === 'BOOKED' && slot.session && (
                                                    <div className="flex flex-col items-center gap-1 w-full">
                                                        <span className="text-xs md:text-sm font-semibold text-violet-700 truncate w-full px-1 text-center">
                                                            {slot.session.member?.name || slot.session.bookings?.[0]?.member?.name || slot.session.title || "Réservé"}
                                                        </span>
                                                        {slot.session.type === 'GROUP' && (
                                                            <Badge variant="secondary" className="text-[10px] md:text-xs bg-violet-200/50 text-violet-700 border-0 px-1.5 py-0">
                                                                {slot.session.bookings?.length || 0}/{slot.session.capacity}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
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
                        session: selectedEvent.session ? {
                            id: selectedEvent.session.id,
                            capacity: selectedEvent.session.capacity,
                            bookings: selectedEvent.session.bookings,
                            description: selectedEvent.session.title,
                            room: selectedEvent.session.room,
                            member: selectedEvent.session.member
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
