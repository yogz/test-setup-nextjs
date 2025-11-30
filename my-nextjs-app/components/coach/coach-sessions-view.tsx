'use client';

import { WeeklyTemplateEditor } from '@/components/coach/weekly-template-editor';
import { DailySlotList } from '@/components/coach/daily-slot-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Settings2 } from 'lucide-react';

interface CoachSessionsViewProps {
    settings: any;
    weeklyAvailability: any[];
    coachSessions: any[];
    blockedSlots: any[];
    availabilityAdditions?: any[];
    allRooms: any[];
    allMembers: any[];
    coachName: string;
}

export function CoachSessionsView({
    settings,
    weeklyAvailability,
    coachSessions,
    blockedSlots,
    availabilityAdditions,
    allRooms,
    allMembers,
    coachName
}: CoachSessionsViewProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
                {/* Header */}
                <div className="space-y-1.5">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                        Mon Planning
                    </h1>
                    <p className="text-slate-600 text-sm md:text-base font-light">
                        Visualisez votre calendrier et gérez vos disponibilités.
                    </p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="calendar" className="space-y-6">
                    <TabsList className="grid w-full max-w-md grid-cols-2 h-10 bg-slate-100/50 backdrop-blur-sm border border-slate-200">
                        <TabsTrigger
                            value="calendar"
                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-medium flex items-center gap-2"
                        >
                            <Calendar className="h-4 w-4" />
                            Calendrier
                        </TabsTrigger>
                        <TabsTrigger
                            value="template"
                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-medium flex items-center gap-2"
                        >
                            <Settings2 className="h-4 w-4" />
                            Mes Dispo
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="calendar" className="focus-visible:outline-none focus-visible:ring-0">
                        <DailySlotList
                            weeklyAvailability={weeklyAvailability}
                            blockedSlots={blockedSlots}
                            availabilityAdditions={availabilityAdditions}
                            sessions={coachSessions}
                            rooms={allRooms}
                            members={allMembers}
                            coachName={coachName}
                        />
                    </TabsContent>

                    <TabsContent value="template" className="focus-visible:outline-none focus-visible:ring-0">
                        <WeeklyTemplateEditor
                            initialSettings={settings}
                            initialAvailability={weeklyAvailability}
                            rooms={allRooms}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
