import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMemberStatsAction } from '@/app/actions/gym-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default async function MemberStatsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect('/sign-in');
    }

    const statsResult = await getMemberStatsAction(session.user.id);

    if (!statsResult.success || !statsResult.data) {
        return <div>Error loading stats</div>;
    }

    const { totalBookings, completedSessions, upcomingSessions } = statsResult.data;

    // Calculate attendance rate (completed / (total - upcoming))
    // Avoid division by zero
    const pastSessions = totalBookings - upcomingSessions;
    const attendanceRate = pastSessions > 0 ? Math.round((completedSessions / pastSessions) * 100) : 100;

    return (
        <div className="space-y-8 p-8">
            <h1 className="text-3xl font-bold tracking-tight">My Stats</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedSessions}</div>
                        <p className="text-xs text-muted-foreground">
                            Sessions completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingSessions}</div>
                        <p className="text-xs text-muted-foreground">
                            Scheduled sessions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{attendanceRate}%</div>
                        <Progress value={attendanceRate} className="mt-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Placeholder for charts or detailed history */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your last 5 sessions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        Feature coming soon: detailed session history list.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
