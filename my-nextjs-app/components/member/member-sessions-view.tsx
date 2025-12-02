'use client';

import { useMemo, useState, useRef, useCallback, useEffect, Fragment } from 'react';
import { format, addDays, isSameDay, startOfDay, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, User, Repeat, Clock, Calendar, X, CheckCircle } from 'lucide-react';
import { cancelBookingAction } from '@/app/actions/gym-actions';
import { toast } from 'sonner';
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

interface MemberSession {
    id: string; // booking id
    sessionId: string;
    title: string | null;
    startTime: Date;
    endTime: Date;
    type: 'ONE_TO_ONE' | 'GROUP';
    status: string; // booking status
    sessionStatus: string;
    coach: { id: string; name: string | null };
    room: { id: string; name: string } | null;
    isRecurring: boolean;
    description: string | null;
}

interface MemberSessionsViewProps {
    sessions: MemberSession[];
    memberName: string;
}

type SessionDisplayStatus = 'UPCOMING' | 'PAST' | 'CANCELLED';

interface DailySession extends MemberSession {
    displayStatus: SessionDisplayStatus;
}

export function MemberSessionsView({ sessions, memberName }: MemberSessionsViewProps) {
    const router = useRouter();
    const [selectedSession, setSelectedSession] = useState<DailySession | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Infinite scroll state
    const [daysToShow, setDaysToShow] = useState(14);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const maxDays = 84;

    // Generate days
    const days = useMemo(() => {
        const today = startOfDay(new Date());
        return Array.from({ length: Math.min(daysToShow, maxDays) }, (_, i) => addDays(today, i));
    }, [daysToShow]);

    // Pre-compute sessions by date for O(1) lookup (exclude cancelled sessions)
    const sessionsByDate = useMemo(() => {
        const map = new Map<string, DailySession[]>();
        const now = new Date();

        sessions
            // Filter out cancelled sessions
            .filter(s => s.status !== 'CANCELLED_BY_MEMBER' && s.status !== 'CANCELLED_BY_COACH')
            .forEach(s => {
                const dateKey = startOfDay(new Date(s.startTime)).toISOString();
                const sessionStart = new Date(s.startTime);

                let displayStatus: SessionDisplayStatus = 'UPCOMING';
                if (isBefore(sessionStart, now)) {
                    displayStatus = 'PAST';
                }

                const dailySession: DailySession = { ...s, displayStatus };

                if (!map.has(dateKey)) {
                    map.set(dateKey, []);
                }
                map.get(dateKey)!.push(dailySession);
            });

        // Sort sessions within each day by time
        map.forEach((daySessions) => {
            daySessions.sort((a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );
        });

        return map;
    }, [sessions]);

    // Load more days
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

    const getSessionsForDay = (date: Date): DailySession[] => {
        const dateKey = startOfDay(date).toISOString();
        return sessionsByDate.get(dateKey) || [];
    };

    const handleSessionClick = (session: DailySession) => {
        setSelectedSession(session);
        setIsDetailOpen(true);
    };

    const handleCancelBooking = async () => {
        if (!selectedSession) return;

        setIsCancelling(true);
        try {
            const result = await cancelBookingAction({ bookingId: selectedSession.id });
            if (result.success) {
                toast.success('Réservation annulée');
                setIsDetailOpen(false);
                router.refresh();
            } else {
                toast.error('error' in result ? result.error : 'Erreur lors de l\'annulation');
            }
        } catch (error) {
            toast.error('Erreur lors de l\'annulation');
        } finally {
            setIsCancelling(false);
        }
    };

    // Count upcoming sessions
    const upcomingCount = sessions.filter(s =>
        s.status === 'CONFIRMED' && new Date(s.startTime) >= new Date()
    ).length;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
                {/* Header */}
                <div className="space-y-1.5">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                        Mon Calendrier
                    </h1>
                    <p className="text-slate-600 text-sm md:text-base font-light">
                        Visualisez toutes vos séances à venir.
                    </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{upcomingCount}</p>
                            <p className="text-xs text-slate-500">séance{upcomingCount > 1 ? 's' : ''} à venir</p>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200" />
                        <span className="text-slate-600">À venir</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300" />
                        <span className="text-slate-600">Passée</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-red-50 to-red-100 border border-red-200" />
                        <span className="text-slate-600">Annulée</span>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="space-y-6">
                    {days.map((day) => {
                        const daySessions = getSessionsForDay(day);
                        if (daySessions.length === 0) return null;

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

                                {/* Sessions Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {daySessions.map((session, index) => {
                                        const startTime = new Date(session.startTime);
                                        const endTime = new Date(session.endTime);

                                        return (
                                            <Card
                                                key={`${session.id}-${index}`}
                                                onClick={() => handleSessionClick(session)}
                                                className={cn(
                                                    "group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-0 p-0",
                                                    session.displayStatus === 'UPCOMING' && "bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100",
                                                    session.displayStatus === 'PAST' && "bg-gradient-to-br from-slate-100 to-slate-200 opacity-70",
                                                    session.displayStatus === 'CANCELLED' && "bg-gradient-to-br from-red-50 to-red-100 opacity-70"
                                                )}
                                            >
                                                {/* Time Header Bar */}
                                                <div className={cn(
                                                    "w-full px-3 py-2 flex items-center justify-between",
                                                    session.displayStatus === 'UPCOMING' && "bg-emerald-700",
                                                    session.displayStatus === 'PAST' && "bg-slate-500",
                                                    session.displayStatus === 'CANCELLED' && "bg-red-400"
                                                )}>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3.5 w-3.5 text-white" />
                                                        <span className="text-sm font-bold text-white">
                                                            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                                                        </span>
                                                    </div>
                                                    {session.isRecurring && (
                                                        <Repeat className="h-3.5 w-3.5 text-white" />
                                                    )}
                                                </div>

                                                {/* Content Section */}
                                                <div className="flex flex-col p-3 min-h-[5rem]">
                                                    {/* Coach */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center">
                                                            <User className="h-4 w-4 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">
                                                                {session.coach?.name || 'Coach'}
                                                            </p>
                                                            <p className="text-xs text-slate-500">Coach</p>
                                                        </div>
                                                    </div>

                                                    {/* Room */}
                                                    {session.room && (
                                                        <div className="flex items-center gap-1.5 text-slate-600">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            <span className="text-xs">{session.room.name}</span>
                                                        </div>
                                                    )}

                                                    {/* Status badges */}
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {session.type === 'ONE_TO_ONE' ? 'Individuel' : 'Collectif'}
                                                        </Badge>
                                                        {session.displayStatus === 'CANCELLED' && (
                                                            <Badge variant="destructive" className="text-[10px]">
                                                                Annulée
                                                            </Badge>
                                                        )}
                                                        {session.displayStatus === 'PAST' && session.sessionStatus === 'completed' && (
                                                            <Badge className="text-[10px] bg-slate-600">
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                Terminée
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Shine effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Empty state */}
                    {sessions.length === 0 && (
                        <div className="text-center py-12">
                            <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 mb-4">Vous n'avez aucune séance programmée.</p>
                            <Button asChild>
                                <a href="/member/book">Réserver une séance</a>
                            </Button>
                        </div>
                    )}

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

                {/* Session Detail Dialog */}
                <AlertDialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-emerald-600" />
                                Détails de la séance
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div className="space-y-4">
                                    {selectedSession && (
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl space-y-3">
                                            {/* Coach */}
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {selectedSession.coach?.name || 'Coach'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">Coach</p>
                                                </div>
                                            </div>

                                            {/* Date */}
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Calendar className="h-4 w-4 text-slate-500" />
                                                <span className="capitalize">
                                                    {format(new Date(selectedSession.startTime), 'EEEE d MMMM yyyy', { locale: fr })}
                                                </span>
                                            </div>

                                            {/* Time */}
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Clock className="h-4 w-4 text-slate-500" />
                                                <span>
                                                    {format(new Date(selectedSession.startTime), 'HH:mm')} - {format(new Date(selectedSession.endTime), 'HH:mm')}
                                                </span>
                                            </div>

                                            {/* Room */}
                                            {selectedSession.room && (
                                                <div className="flex items-center gap-2 text-slate-700">
                                                    <MapPin className="h-4 w-4 text-slate-500" />
                                                    <span>{selectedSession.room.name}</span>
                                                </div>
                                            )}

                                            {/* Badges */}
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                <Badge variant="outline">
                                                    {selectedSession.type === 'ONE_TO_ONE' ? 'Individuel' : 'Collectif'}
                                                </Badge>
                                                {selectedSession.isRecurring && (
                                                    <Badge className="bg-violet-600">
                                                        <Repeat className="h-3 w-3 mr-1" />
                                                        Récurrent
                                                    </Badge>
                                                )}
                                                {selectedSession.displayStatus === 'CANCELLED' && (
                                                    <Badge variant="destructive">Annulée</Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Fermer</AlertDialogCancel>
                            {selectedSession &&
                             selectedSession.displayStatus === 'UPCOMING' && (
                                <Button
                                    variant="destructive"
                                    onClick={handleCancelBooking}
                                    disabled={isCancelling}
                                >
                                    {isCancelling ? 'Annulation...' : 'Annuler la séance'}
                                </Button>
                            )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
