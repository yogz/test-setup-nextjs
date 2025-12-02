'use client';

import { useState, useMemo } from 'react';
import { format, addDays, startOfDay, setHours, setMinutes, isBefore, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Check } from 'lucide-react';
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
    const [weekOffset, setWeekOffset] = useState(0);
    const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isBooking, setIsBooking] = useState(false);

    const selectedCoach = coaches.find(c => c.id === selectedCoachId);

    // Generate days for the current week view
    const days = useMemo(() => {
        const today = startOfDay(new Date());
        const startDate = addDays(today, weekOffset * 7);
        return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    }, [weekOffset]);

    // Generate available slots for a specific day and coach
    const getSlotsForDay = (date: Date, coach: CoachData): AvailableSlot[] => {
        if (!coach) return [];

        const dayOfWeek = date.getDay();
        const dayAvailability = coach.availability.filter(a => a.dayOfWeek === dayOfWeek && a.isIndividual);

        if (dayAvailability.length === 0) return [];

        const slots: AvailableSlot[] = [];
        const now = new Date();

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

                // Check if blocked
                const isBlocked = coach.blockedSlots.some(b => {
                    const bStart = new Date(b.startTime);
                    const bEnd = new Date(b.endTime);
                    return (bStart < slotEnd && bEnd > currentSlotTime);
                });

                // Check if already has a session
                const hasSession = coach.sessions.some(s => {
                    const sStart = new Date(s.startTime);
                    const sEnd = new Date(s.endTime);
                    return (sStart < slotEnd && sEnd > currentSlotTime);
                });

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
    };

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
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Aucun coach disponible pour le moment.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Réserver une séance</h1>
                <p className="text-muted-foreground mt-2">
                    Choisissez un coach et un créneau disponible
                </p>
            </div>

            {/* Coach Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Sélectionner un coach
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                        <SelectTrigger className="w-full max-w-xs">
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
                        <p className="text-sm text-muted-foreground mt-2">
                            Durée des séances : {selectedCoach.defaultDuration} minutes
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Week Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                    disabled={weekOffset === 0}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Semaine précédente
                </Button>
                <span className="text-sm font-medium">
                    {format(days[0], 'd MMM', { locale: fr })} - {format(days[6], 'd MMM yyyy', { locale: fr })}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    disabled={weekOffset >= 12}
                >
                    Semaine suivante
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>

            {/* Calendar Grid */}
            {selectedCoach && (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {days.map((day) => {
                        const slots = getSlotsForDay(day, selectedCoach);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <Card key={day.toISOString()} className={isToday ? 'border-primary' : ''}>
                                <CardHeader className="p-3 pb-2">
                                    <CardTitle className="text-sm font-medium text-center">
                                        <div className={isToday ? 'text-primary' : ''}>
                                            {format(day, 'EEEE', { locale: fr })}
                                        </div>
                                        <div className={`text-lg ${isToday ? 'text-primary font-bold' : ''}`}>
                                            {format(day, 'd', { locale: fr })}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                    {slots.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-4">
                                            Pas de disponibilité
                                        </p>
                                    ) : (
                                        <div className="space-y-1">
                                            {slots.map((slot, idx) => (
                                                <Button
                                                    key={idx}
                                                    variant={slot.isAvailable ? 'outline' : 'ghost'}
                                                    size="sm"
                                                    className={`w-full justify-center text-xs ${
                                                        slot.isAvailable
                                                            ? 'hover:bg-primary hover:text-primary-foreground cursor-pointer'
                                                            : 'opacity-40 cursor-not-allowed line-through'
                                                    }`}
                                                    disabled={!slot.isAvailable}
                                                    onClick={() => handleSlotClick(slot)}
                                                >
                                                    {slot.time}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border rounded" />
                    <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted rounded opacity-40" />
                    <span>Indisponible</span>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la réservation</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>Vous allez réserver une séance :</p>
                                {selectedSlot && selectedCoach && (
                                    <div className="bg-muted p-4 rounded-lg space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            <span className="font-medium">{selectedCoach.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {format(selectedSlot.date, 'EEEE d MMMM yyyy', { locale: fr })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
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
                        <AlertDialogAction onClick={handleConfirmBooking} disabled={isBooking}>
                            {isBooking ? 'Réservation...' : 'Confirmer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
