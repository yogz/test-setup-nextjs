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
                        <CardTitle>Add Recurring Slot</CardTitle>
                        <CardDescription>Set your weekly recurring availability.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={async (formData) => {
                            'use server';
                            const dayOfWeek = parseInt(formData.get('dayOfWeek') as string);
                            const startTime = formData.get('startTime') as string;
                            const endTime = formData.get('endTime') as string;
                            const title = formData.get('title') as string;
                            const description = formData.get('description') as string;
                            const capacity = parseInt(formData.get('capacity') as string);
                            const type = formData.get('type') as 'ONE_TO_ONE' | 'GROUP';

                            await updateAvailabilityAction({
                                dayOfWeek,
                                startTime,
                                endTime,
                                isRecurring: true,
                                title,
                                description,
                                capacity,
                                type,
                            });
                        }} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Class Title</Label>
                                <Input name="title" placeholder="e.g. Morning Pilates" required />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input name="description" placeholder="Optional description" />
                            </div>

                            <div className="space-y-2">
                                <Label>Day of Week</Label>
                                <Select name="dayOfWeek" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select day" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DAYS.map((day, index) => (
                                            <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Input type="time" name="startTime" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Input type="time" name="endTime" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select name="type" defaultValue="GROUP">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GROUP">Group Class</SelectItem>
                                            <SelectItem value="ONE_TO_ONE">1-on-1</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Capacity</Label>
                                    <Input type="number" name="capacity" defaultValue="10" min="1" required />
                                </div>
                            </div>
                            <Button type="submit" className="w-full">Add Slot</Button>
                        </form>
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
