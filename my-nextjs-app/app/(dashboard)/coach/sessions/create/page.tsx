import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createTrainingSessionAction } from '@/app/actions/gym-actions';

export default async function CreateSessionPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || (session.user.role !== 'coach' && session.user.role !== 'owner')) {
        redirect('/');
    }

    return (
        <div className="max-w-2xl mx-auto p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Create Training Session</CardTitle>
                    <CardDescription>Schedule a new class or session for members to book.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={async (formData) => {
                        'use server';
                        const title = formData.get('title') as string;
                        const description = formData.get('description') as string;
                        const date = formData.get('date') as string;
                        const startTime = formData.get('startTime') as string;
                        const endTime = formData.get('endTime') as string;
                        const capacity = parseInt(formData.get('capacity') as string);
                        const type = formData.get('type') as 'ONE_TO_ONE' | 'GROUP';

                        // Combine date and time
                        const startDateTime = new Date(`${date}T${startTime}`).toISOString();
                        const endDateTime = new Date(`${date}T${endTime}`).toISOString();

                        await createTrainingSessionAction({
                            title,
                            description,
                            startTime: startDateTime,
                            endTime: endDateTime,
                            capacity,
                            type,
                        });

                        redirect('/coach/dashboard');
                    }} className="space-y-6">

                        <div className="space-y-2">
                            <Label>Session Title</Label>
                            <Input name="title" placeholder="e.g. HIIT Workout" required />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea name="description" placeholder="What will you be doing?" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" name="date" required />
                            </div>
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

                        <div className="space-y-2">
                            <Label>Capacity</Label>
                            <Input type="number" name="capacity" defaultValue="10" min="1" required />
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button variant="outline" type="button">Cancel</Button>
                            <Button type="submit">Create Session</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
