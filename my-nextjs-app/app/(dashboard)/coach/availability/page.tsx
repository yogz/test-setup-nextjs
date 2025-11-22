import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { coachAvailabilities } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { updateAvailabilityAction } from '@/app/actions/gym-actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function AvailabilityPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || (session.user.role !== 'coach' && session.user.role !== 'owner')) {
        redirect('/');
    }

    const availabilities = await db.query.coachAvailabilities.findMany({
        where: eq(coachAvailabilities.coachId, session.user.id),
        orderBy: [asc(coachAvailabilities.dayOfWeek), asc(coachAvailabilities.startTime)],
    });

    return (
        <div className="space-y-8 p-8">
            <h1 className="text-3xl font-bold tracking-tight">Manage Availability</h1>

            <div className="grid gap-8 md:grid-cols-2">
                {/* ADD NEW SLOT */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add Availability</CardTitle>
                        <CardDescription>Set your recurring weekly schedule.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AvailabilityForm />
                    </CardContent>
                </Card>

                {/* LIST SLOTS */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {availabilities.length === 0 ? (
                            <p className="text-muted-foreground">No availability set.</p>
                        ) : (
                            <div className="space-y-4">
                                {availabilities.map((slot) => (
                                    <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <div>
                                                <p className="font-medium">{slot.title || 'Untitled'} ({DAYS[slot.dayOfWeek]})</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {slot.startTime} - {slot.endTime} • {slot.type} • {slot.capacity} spots
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-destructive">
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
