'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Calendar, Clock, MapPin, User, Users, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Session {
    id: string;
    title: string | null;
    startTime: Date;
    endTime: Date;
    type: 'ONE_TO_ONE' | 'GROUP';
    status: string;
    capacity: number | null;
    description: string | null;
    coachId: string;
    roomId: string;
    coach?: any;
    bookings?: any[];
    room?: any;
}

interface Availability {
    coachId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

interface AdminSessionsTableProps {
    sessions: Session[];
    availability: Availability[];
}

type Problem = {
    type: 'outside_availability' | 'no_room' | 'cancelled';
    message: string;
};

export function AdminSessionsTable({ sessions, availability }: AdminSessionsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCoach, setFilterCoach] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterProblems, setFilterProblems] = useState<boolean>(false);

    // Detect problems for each session
    const sessionsWithProblems = useMemo(() => {
        return sessions.map(session => {
            const problems: Problem[] = [];

            // Check if session is cancelled
            if (session.status === 'CANCELLED') {
                problems.push({
                    type: 'cancelled',
                    message: 'Session annulée'
                });
            }

            // Check if no room assigned
            if (!session.roomId) {
                problems.push({
                    type: 'no_room',
                    message: 'Aucune salle assignée'
                });
            }

            // Check if outside coach availability
            const sessionDate = new Date(session.startTime);
            const dayOfWeek = sessionDate.getDay();
            const sessionStartTime = format(sessionDate, 'HH:mm');
            const sessionEndTime = format(new Date(session.endTime), 'HH:mm');

            const coachAvailability = availability.filter(
                a => a.coachId === session.coachId && a.dayOfWeek === dayOfWeek
            );

            const isWithinAvailability = coachAvailability.some(avail => {
                return sessionStartTime >= avail.startTime && sessionEndTime <= avail.endTime;
            });

            if (coachAvailability.length > 0 && !isWithinAvailability) {
                problems.push({
                    type: 'outside_availability',
                    message: 'Hors disponibilités du coach'
                });
            }

            return {
                ...session,
                problems
            };
        });
    }, [sessions, availability]);

    // Get unique coaches for filter
    const coaches = useMemo(() => {
        const uniqueCoaches = new Map();
        sessions.forEach(s => {
            if (s.coach && !uniqueCoaches.has(s.coachId)) {
                uniqueCoaches.set(s.coachId, s.coach);
            }
        });
        return Array.from(uniqueCoaches.values());
    }, [sessions]);

    // Filter sessions
    const filteredSessions = useMemo(() => {
        return sessionsWithProblems.filter(session => {
            // Search filter
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                session.coach?.name?.toLowerCase().includes(searchLower) ||
                session.bookings?.[0]?.member?.name?.toLowerCase().includes(searchLower) ||
                session.title?.toLowerCase().includes(searchLower);

            // Coach filter
            const matchesCoach = filterCoach === 'all' || session.coachId === filterCoach;

            // Status filter
            const matchesStatus = filterStatus === 'all' || session.status === filterStatus;

            // Problems filter
            const matchesProblems = !filterProblems || session.problems.length > 0;

            return matchesSearch && matchesCoach && matchesStatus && matchesProblems;
        });
    }, [sessionsWithProblems, searchTerm, filterCoach, filterStatus, filterProblems]);

    const problemCount = sessionsWithProblems.filter(s => s.problems.length > 0).length;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <Input
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        <Select value={filterCoach} onValueChange={setFilterCoach}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les coachs" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les coachs</SelectItem>
                                {coaches.map(coach => (
                                    <SelectItem key={coach.id} value={coach.id}>
                                        {coach.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les statuts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="SCHEDULED">Planifiée</SelectItem>
                                <SelectItem value="CANCELLED">Annulée</SelectItem>
                                <SelectItem value="COMPLETED">Terminée</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="filter-problems"
                            checked={filterProblems}
                            onChange={(e) => setFilterProblems(e.target.checked)}
                            className="rounded"
                        />
                        <label htmlFor="filter-problems" className="text-sm font-medium cursor-pointer">
                            Problèmes uniquement ({problemCount})
                        </label>
                    </div>
                </div>
            </Card>

            {/* Sessions Table */}
            <div className="space-y-2">
                <div className="text-sm text-slate-600">
                    {filteredSessions.length} session{filteredSessions.length > 1 ? 's' : ''} trouvée{filteredSessions.length > 1 ? 's' : ''}
                </div>

                {filteredSessions.map(session => (
                    <Card
                        key={session.id}
                        className={cn(
                            "p-4",
                            session.problems.length > 0 && "border-orange-300 bg-orange-50/50"
                        )}
                    >
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Date & Time */}
                            <div className="flex items-center gap-2 min-w-[200px]">
                                <Calendar className="h-4 w-4 text-slate-600" />
                                <div>
                                    <div className="font-medium">
                                        {format(new Date(session.startTime), 'EEEE d MMM', { locale: fr })}
                                    </div>
                                    <div className="text-sm text-slate-600 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                                    </div>
                                </div>
                            </div>

                            {/* Coach & Member */}
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-slate-600" />
                                    <span className="font-medium">Coach:</span>
                                    <span>{session.coach?.name || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    {session.type === 'GROUP' ?
                                        <Users className="h-4 w-4 text-violet-600" /> :
                                        <User className="h-4 w-4 text-blue-600" />
                                    }
                                    <span className="font-medium">Membre:</span>
                                    <span>{session.bookings?.[0]?.member?.name || session.title || 'N/A'}</span>
                                    {session.type === 'GROUP' && session.capacity && (
                                        <Badge variant="secondary" className="text-xs">
                                            {session.bookings?.length || 0}/{session.capacity}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Room */}
                            <div className="flex items-center gap-2 text-sm min-w-[120px]">
                                <MapPin className="h-4 w-4 text-slate-600" />
                                <span>{session.room?.name || 'N/A'}</span>
                            </div>

                            {/* Status */}
                            <div>
                                <Badge variant={
                                    session.status === 'SCHEDULED' ? 'default' :
                                        session.status === 'CANCELLED' ? 'destructive' :
                                            'secondary'
                                }>
                                    {session.status}
                                </Badge>
                            </div>

                            {/* Problems */}
                            <div className="flex flex-wrap gap-1 min-w-[200px]">
                                {session.problems.map((problem, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="outline"
                                        className="bg-orange-100 text-orange-700 border-orange-300 text-xs"
                                    >
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        {problem.message}
                                    </Badge>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {filteredSessions.length === 0 && (
                    <Card className="p-8 text-center text-slate-500">
                        Aucune session trouvée
                    </Card>
                )}
            </div>
        </div>
    );
}
