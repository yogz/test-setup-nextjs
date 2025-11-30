import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { trainingSessions, users, rooms } from '@/lib/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeeklyTemplateEditor } from '@/components/coach/weekly-template-editor';
import { CoachCalendar } from '@/components/coach/coach-calendar';
import { getCoachSettingsAction, getWeeklyAvailabilityAction, getBlockedSlotsAction } from '@/app/actions/coach-availability-actions';

export default async function CoachSessionsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || (session.user.role !== 'coach' && session.user.role !== 'owner')) {
        redirect('/dashboard');
    }

    // Fetch Data
    const [
        settings,
        weeklyAvailability,
        allRooms,
        allMembers,
        coachSessions,
        blockedSlots
    ] = await Promise.all([
        getCoachSettingsAction(),
        getWeeklyAvailabilityAction(),
        db.query.rooms.findMany(),
        db.query.users.findMany({ where: eq(users.role, 'member') }),
        db.query.trainingSessions.findMany({
            where: eq(trainingSessions.coachId, session.user.id),
            with: {
                bookings: {
                    with: {
                        member: true
                    }
                },
                room: true // Ensure room relation is fetched
            }
        }),
        getBlockedSlotsAction(new Date(), new Date(new Date().setFullYear(new Date().getFullYear() + 1))) // Fetch future blocks
    ]);

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des disponibilités</h1>
                    <p className="text-muted-foreground">
                        Configurez votre semaine type et gérez votre calendrier.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="calendar" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="template">Ma semaine type</TabsTrigger>
                    <TabsTrigger value="calendar">Calendrier</TabsTrigger>
                </TabsList>

                <TabsContent value="template" className="space-y-4">
                    <WeeklyTemplateEditor
                        initialSettings={settings}
                        initialAvailability={weeklyAvailability}
                        rooms={allRooms}
                    />
                </TabsContent>

                <TabsContent value="calendar" className="space-y-4">
                    <CoachCalendar
                        weeklyAvailability={weeklyAvailability}
                        blockedSlots={blockedSlots}
                        sessions={coachSessions}
                        rooms={allRooms}
                        members={allMembers}
                        coachName={session.user.name || 'Coach'}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
