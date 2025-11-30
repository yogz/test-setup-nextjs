'use client';

import { useState, useMemo } from 'react';
import { SessionFilters } from './session-filters';
import { SessionCard } from './session-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Grid } from 'lucide-react';
import type { AvailableSlot } from '@/lib/utils/availability';

interface Session {
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
}

// Format unifié pour affichage
interface DisplayableSession extends Session {
    isAvailableSlot?: boolean; // true si c'est un créneau de disponibilité, false si session existante
}

interface SessionListProps {
    sessions: Session[];
    availableSlots?: AvailableSlot[];
    userId: string;
}

export function SessionList({ sessions, availableSlots = [], userId }: SessionListProps) {
    const [filters, setFilters] = useState<{
        coachId?: string;
        type?: string;
        date?: string;
    }>({});

    // Combiner les sessions existantes et les créneaux disponibles
    const allDisplayableSessions = useMemo<DisplayableSession[]>(() => {
        // Sessions existantes
        const existingSessions: DisplayableSession[] = sessions.map(s => ({
            ...s,
            isAvailableSlot: false,
        }));

        // Créneaux disponibles convertis en format DisplayableSession
        const slotSessions: DisplayableSession[] = availableSlots.map(slot => ({
            id: `slot-${slot.coachId}-${slot.startTime.getTime()}`, // ID temporaire
            title: 'Session individuelle disponible',
            description: null,
            type: 'ONE_TO_ONE',
            startTime: slot.startTime,
            endTime: slot.endTime,
            capacity: 1,
            isRecurring: null,
            level: null,
            coachId: slot.coachId,
            coach: { id: slot.coachId, name: slot.coachName },
            room: null, // Sera assignée lors de la réservation
            bookings: [],
            isAvailableSlot: true,
        }));

        // Combiner et trier par date
        return [...existingSessions, ...slotSessions].sort(
            (a, b) => a.startTime.getTime() - b.startTime.getTime()
        );
    }, [sessions, availableSlots]);

    // Get unique coaches
    const coaches = useMemo(() => {
        const uniqueCoaches = new Map();
        allDisplayableSessions.forEach(session => {
            if (!uniqueCoaches.has(session.coach.id)) {
                uniqueCoaches.set(session.coach.id, session.coach);
            }
        });
        return Array.from(uniqueCoaches.values());
    }, [allDisplayableSessions]);

    // Filter sessions
    const filteredSessions = useMemo(() => {
        return allDisplayableSessions.filter(session => {
            if (filters.coachId && session.coachId !== filters.coachId) {
                return false;
            }
            if (filters.type && session.type !== filters.type) {
                return false;
            }
            if (filters.date) {
                const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
                if (sessionDate !== filters.date) {
                    return false;
                }
            }
            return true;
        });
    }, [allDisplayableSessions, filters]);

    // Group sessions by date
    const sessionsByDate = useMemo(() => {
        const grouped = new Map<string, DisplayableSession[]>();
        filteredSessions.forEach(session => {
            const dateKey = new Date(session.startTime).toISOString().split('T')[0];
            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, []);
            }
            grouped.get(dateKey)!.push(session);
        });
        return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [filteredSessions]);

    const hasActiveFilters = filters.coachId || filters.type || filters.date;

    return (
        <div className="space-y-6">
            <SessionFilters coaches={coaches} onFiltersChange={setFilters} />

            {hasActiveFilters && (
                <div className="text-sm text-muted-foreground">
                    {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} trouvée{filteredSessions.length !== 1 ? 's' : ''}
                </div>
            )}

            <Tabs defaultValue="grid" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="grid" className="gap-2">
                        <Grid className="h-4 w-4" />
                        Grille
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Calendrier
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="grid" className="mt-6">
                    {filteredSessions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Aucune session disponible pour le moment.
                            {hasActiveFilters && ' Essayez de modifier vos filtres.'}
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredSessions.map(session => (
                                <SessionCard
                                    key={session.id}
                                    session={session}
                                    userId={userId}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="calendar" className="mt-6">
                    {sessionsByDate.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Aucune session disponible pour le moment.
                            {hasActiveFilters && ' Essayez de modifier vos filtres.'}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {sessionsByDate.map(([date, dateSessions]) => (
                                <div key={date} className="space-y-4">
                                    <h3 className="text-lg font-semibold sticky top-0 bg-background py-2">
                                        {new Date(date).toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {dateSessions.map(session => (
                                            <SessionCard
                                                key={session.id}
                                                session={session}
                                                userId={userId}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
