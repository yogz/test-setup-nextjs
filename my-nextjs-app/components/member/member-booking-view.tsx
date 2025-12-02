'use client';

import { useState, useMemo, useRef, useCallback, useEffect, Fragment } from 'react';
import { format, addDays, startOfDay, setHours, setMinutes, isBefore, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Clock, Calendar, Check } from 'lucide-react';
import { bookAvailableSlotAction } from '@/app/actions/gym-actions';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CoachAvailability {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isIndividual: boolean;
    isGroup: boolean;
    duration?: number | null;
}

interface CoachData {
    id: string;
    name: string;
    defaultDuration: number;
    defaultRoomId?: string | null;
    availability: CoachAvailability[];
    blockedSlots: { id: string; startTime: string; endTime: string }[];
    sessions: { id: string; startTime: string; endTime: string; type: string; capacity: number | null; bookingsCount: number }[];
}

interface MemberBookingViewProps {
    coaches: CoachData[];
    memberId: string;
}

interface AvailableSlot {
    time: string;
    date: Date;
    coachId: string;
    duration: number;
    isAvailable: boolean;
}

export function MemberBookingView({ coaches, memberId }: MemberBookingViewProps) {
    const router = useRouter();
    const [selectedCoachId, setSelectedCoachId] = useState<string>(coaches[0]?.id || '');
    const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isBooking, setIsBooking] = useState(false);

    // Infinite scroll state
    const [daysToShow, setDaysToShow] = useState(14);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const maxDays = 84; // 12 weeks max

    const selectedCoach = coaches.find(c => c.id === selectedCoachId);

    // Generate days based on daysToShow
    const days = useMemo(() => {
        const today = startOfDay(new Date());
        return Array.from({ length: Math.min(daysToShow, maxDays) }, (_, i) => addDays(today, i));
    }, [daysToShow]);

    // Pre-compute occupied time slots using Sets for O(1) lookup
    const occupiedSlotsMap = useMemo(() => {
        if (!selectedCoach) return { blocked: new Set<number>(), sessions: new Set<number>() };

        const blocked = new Set<number>();
        const sessions = new Set<number>();

        // Index blocked slots by their time range (store start times rounded to minutes)
        selectedCoach.blockedSlots.forEach(b => {
            const start = new Date(b.startTime).getTime();
            const end = new Date(b.endTime).getTime();
            // Store every 15-minute interval as blocked
            for (let t = start; t < end; t += 15 * 60 * 1000) {
                blocked.add(t);
            }
        });

        // Index sessions by their time range
        selectedCoach.sessions.forEach(s => {
            const start = new Date(s.startTime).getTime();
            const end = new Date(s.endTime).getTime();
            // Store every 15-minute interval as occupied
            for (let t = start; t < end; t += 15 * 60 * 1000) {
                sessions.add(t);
            }
        });

        return { blocked, sessions };
    }, [selectedCoach]);

    // Load more days when sentinel is visible
    const loadMoreDays = useCallback(() => {
        if (daysToShow >= maxDays || isLoadingMore) return;

        setIsLoadingMore(true);
        setTimeout(() => {
            setDaysToShow(prev => Math.min(prev + 7, maxDays));
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

    // Generate available slots for a specific day and coach (optimized with Set lookups)
    const getSlotsForDay = useCallback((date: Date, coach: CoachData): AvailableSlot[] => {
        if (!coach) return [];

        const dayOfWeek = date.getDay();
        const dayAvailability = coach.availability.filter(a => a.dayOfWeek === dayOfWeek && a.isIndividual);

        if (dayAvailability.length === 0) return [];

        const slots: AvailableSlot[] = [];
        const now = new Date();
        const { blocked, sessions } = occupiedSlotsMap;

        dayAvailability.forEach(avail => {
            const [startHour, startMinute] = avail.startTime.split(':').map(Number);
            const [endHour, endMinute] = avail.endTime.split(':').map(Number);

            const slotDuration = avail.duration || coach.defaultDuration;
            let currentSlotTime = setMinutes(setHours(date, startHour), startMinute);
            const endTime = setMinutes(setHours(date, endHour), endMinute);

            while (isBefore(currentSlotTime, endTime)) {
                const slotEnd = new Date(currentSlotTime.getTime() + slotDuration * 60000);

                // Skip if slot end exceeds availability window
                if (slotEnd > endTime) break;

                // Check if in the past
                const isPast = isBefore(currentSlotTime, now);

                // O(1) lookup: Check if any 15-min interval in this slot is blocked or has a session
                const slotStartTime = currentSlotTime.getTime();
                let isBlocked = false;
                let hasSession = false;

                // Check each 15-min interval within the slot
                for (let t = slotStartTime; t < slotEnd.getTime(); t += 15 * 60 * 1000) {
                    if (blocked.has(t)) {
                        isBlocked = true;
                        break;
                    }
                    if (sessions.has(t)) {
                        hasSession = true;
                        break;
                    }
                }

                slots.push({
                    time: format(currentSlotTime, 'HH:mm'),
                    date: new Date(currentSlotTime),
                    coachId: coach.id,
                    duration: slotDuration,
                    isAvailable: !isPast && !isBlocked && !hasSession,
                });

                currentSlotTime = slotEnd;
            }
        });

        return slots;
    }, [occupiedSlotsMap]);

    const handleSlotClick = (slot: AvailableSlot) => {
        if (!slot.isAvailable) return;
        setSelectedSlot(slot);
        setIsConfirmOpen(true);
    };

    const handleConfirmBooking = async () => {
        if (!selectedSlot || !selectedCoach) return;

        setIsBooking(true);
        try {
            const endTime = new Date(selectedSlot.date.getTime() + selectedSlot.duration * 60000);

            const result = await bookAvailableSlotAction({
                coachId: selectedSlot.coachId,
                startTime: selectedSlot.date.toISOString(),
                endTime: endTime.toISOString(),
            });

            if (result.success) {
                toast.success('Réservation confirmée !');
                setIsConfirmOpen(false);
                setSelectedSlot(null);
                router.refresh();
                router.push('/bookings');
            } else {
                toast.error('error' in result ? result.error : 'Erreur lors de la réservation');
            }
        } catch (error) {
            toast.error('Erreur lors de la réservation');
        } finally {
            setIsBooking(false);
        }
    };

    if (coaches.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
                    <div className="space-y-1.5">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                            Réserver une séance
                        </h1>
                    </div>
                    <Card className="p-12 text-center">
                        <p className="text-slate-500">Aucun coach disponible pour le moment.</p>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
                {/* Header */}
                <div className="space-y-1.5">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                        Réserver une séance
                    </h1>
                    <p className="text-slate-600 text-sm md:text-base font-light">
                        Choisissez un coach et sélectionnez un créneau disponible.
                    </p>
                </div>

                {/* Coach Selection */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-medium text-slate-700">Coach :</span>
                    </div>
                    <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                        <SelectTrigger className="w-full sm:w-64 bg-white">
                            <SelectValue placeholder="Choisir un coach" />
                        </SelectTrigger>
                        <SelectContent>
                            {coaches.map(coach => (
                                <SelectItem key={coach.id} value={coach.id}>
                                    {coach.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedCoach && (
                        <Badge variant="secondary" className="text-xs">
                            Séances de {selectedCoach.defaultDuration} min
                        </Badge>
                    )}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200" />
                        <span className="text-slate-600">Disponible</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300" />
                        <span className="text-slate-600">Indisponible</span>
                    </div>
                </div>

                {/* Calendar Grid */}
                {selectedCoach && (
                    <div className="space-y-6">
                        {days.map((day) => {
                            const slots = getSlotsForDay(day, selectedCoach);
                            if (slots.length === 0) return null;

                            const hasAvailableSlots = slots.some(s => s.isAvailable);

                            return (
                                <div key={day.toISOString()} className="space-y-3">
                                    {/* Day Header */}
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

                                    {/* Slots Grid */}
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                        {slots.map((slot, index) => {
                                            // Check for time gap
                                            const hasGapBefore = index > 0 && (() => {
                                                const prevSlot = slots[index - 1];
                                                const prevTime = new Date(prevSlot.date);
                                                const currentTime = new Date(slot.date);
                                                const prevDuration = prevSlot.duration || 60;
                                                const expectedNextTime = new Date(prevTime.getTime() + prevDuration * 60 * 1000);
                                                return currentTime.getTime() > expectedNextTime.getTime();
                                            })();

                                            return (
                                                <Fragment key={`slot-${day.toISOString()}-${index}`}>
                                                    {hasGapBefore && (
                                                        <div className="flex items-center justify-center p-2 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                                            <span className="text-[10px] text-slate-400 italic">Pause</span>
                                                        </div>
                                                    )}
                                                    <Card
                                                        onClick={() => handleSlotClick(slot)}
                                                        className={cn(
                                                            "group relative overflow-hidden transition-all duration-300 border-0 p-0",
                                                            slot.isAvailable
                                                                ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100"
                                                                : "cursor-not-allowed bg-gradient-to-br from-slate-100 to-slate-200 opacity-50"
                                                        )}
                                                    >
                                                        {/* Time Header Bar */}
                                                        <div className={cn(
                                                            "w-full px-2 py-1.5 flex items-center justify-center",
                                                            slot.isAvailable ? "bg-emerald-700" : "bg-slate-400"
                                                        )}>
                                                            <span className="text-xs md:text-sm font-bold text-white">{slot.time}</span>
                                                        </div>

                                                        {/* Content Section */}
                                                        <div className="flex flex-col items-center justify-center p-2 min-h-[2.5rem]">
                                                            {slot.isAvailable ? (
                                                                <span className="text-xs font-medium text-emerald-700">Libre</span>
                                                            ) : (
                                                                <span className="text-xs font-medium text-slate-500 line-through">—</span>
                                                            )}
                                                        </div>

                                                        {/* Shine effect on hover */}
                                                        {slot.isAvailable && (
                                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                                        )}
                                                    </Card>
                                                </Fragment>
                                            );
                                        })}
                                    </div>

                                    {/* No available slots message */}
                                    {!hasAvailableSlots && (
                                        <p className="text-center text-sm text-slate-400 italic py-2">
                                            Tous les créneaux sont réservés ou passés
                                        </p>
                                    )}
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

                        {/* End message */}
                        {daysToShow >= maxDays && (
                            <div className="flex justify-center py-8">
                                <div className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
                                    {maxDays} jours affichés (12 semaines)
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Confirmation Dialog */}
                <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                    <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-emerald-600" />
                                Confirmer la réservation
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div className="space-y-4">
                                    <p className="text-slate-600">Vous allez réserver une séance :</p>
                                    {selectedSlot && selectedCoach && (
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{selectedCoach.name}</p>
                                                    <p className="text-xs text-slate-500">Coach</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Calendar className="h-4 w-4 text-slate-500" />
                                                <span className="capitalize">
                                                    {format(selectedSlot.date, 'EEEE d MMMM yyyy', { locale: fr })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Clock className="h-4 w-4 text-slate-500" />
                                                <span>
                                                    {selectedSlot.time} - {format(
                                                        new Date(selectedSlot.date.getTime() + selectedSlot.duration * 60000),
                                                        'HH:mm'
                                                    )} ({selectedSlot.duration} min)
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isBooking}>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmBooking}
                                disabled={isBooking}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {isBooking ? 'Réservation...' : 'Confirmer'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
