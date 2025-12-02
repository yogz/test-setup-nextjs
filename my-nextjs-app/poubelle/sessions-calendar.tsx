'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Session {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    type: 'ONE_TO_ONE' | 'GROUP';
    capacity: number | null;
    bookings: any[];
    status: string;
    duration: number | null;
}

interface SessionsCalendarProps {
    sessions: Session[];
}

export function SessionsCalendar({ sessions }: SessionsCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const getSessionsForDate = (date: Date) => {
        return sessions.filter(session => {
            const sessionDate = new Date(session.startTime);
            return (
                sessionDate.getDate() === date.getDate() &&
                sessionDate.getMonth() === date.getMonth() &&
                sessionDate.getFullYear() === date.getFullYear()
            );
        });
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };

    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

    const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // Create array of days
    const days = [];
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
    }
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold capitalize">{monthName}</h3>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {/* Week day headers */}
                {weekDays.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                        {day}
                    </div>
                ))}

                {/* Calendar days */}
                {days.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className="min-h-[100px]" />;
                    }

                    const date = new Date(year, month, day);
                    const daySessions = getSessionsForDate(date);
                    const isToday =
                        date.getDate() === new Date().getDate() &&
                        date.getMonth() === new Date().getMonth() &&
                        date.getFullYear() === new Date().getFullYear();

                    return (
                        <Card
                            key={day}
                            className={`min-h-[100px] p-2 ${isToday ? 'ring-2 ring-primary' : ''}`}
                        >
                            <div className="flex flex-col h-full">
                                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                                    {day}
                                </div>
                                <div className="flex-1 space-y-1 overflow-y-auto">
                                    {daySessions.map(session => {
                                        const isFull = session.bookings.length >= (session.capacity || 1);
                                        const availableSpots = (session.capacity || 1) - session.bookings.length;

                                        return (
                                            <div
                                                key={session.id}
                                                className={`text-xs p-1 rounded ${isFull
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    }`}
                                                title={session.title}
                                            >
                                                <div className="font-medium truncate">
                                                    {new Date(session.startTime).toLocaleTimeString('fr-FR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                                <div className="truncate">{session.title}</div>
                                                <div className="flex items-center justify-between">
                                                    <Badge
                                                        variant={session.type === 'ONE_TO_ONE' ? 'outline' : 'secondary'}
                                                        className="text-[10px] px-1 py-0"
                                                    >
                                                        {session.type === 'ONE_TO_ONE' ? '1:1' : 'Grp'}
                                                    </Badge>
                                                    <span className="text-[10px]">
                                                        {isFull ? 'Complet' : `${availableSpots} dispo`}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900" />
                    <span>Places disponibles</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900" />
                    <span>Complet</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded ring-2 ring-primary" />
                    <span>Aujourd'hui</span>
                </div>
            </div>
        </div>
    );
}
