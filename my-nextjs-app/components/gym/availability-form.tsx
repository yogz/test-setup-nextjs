'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateAvailabilityAction } from '@/app/actions/gym-actions';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AvailabilityForm() {
    const [mode, setMode] = useState<'one-to-one' | 'group'>('one-to-one');

    return (
        <div className="space-y-6">
            <div className="flex space-x-4 border-b pb-2">
                <button
                    onClick={() => setMode('one-to-one')}
                    className={`pb-2 text-sm font-medium transition-colors ${mode === 'one-to-one'
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    1:1 Availability
                </button>
                <button
                    onClick={() => setMode('group')}
                    className={`pb-2 text-sm font-medium transition-colors ${mode === 'group'
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Group Class
                </button>
            </div>

            {mode === 'one-to-one' ? (
                <form action={async (formData) => {
                    const dayOfWeek = parseInt(formData.get('dayOfWeek') as string);
                    const startTime = formData.get('startTime') as string;
                    const endTime = formData.get('endTime') as string;
                    const slotDuration = parseInt(formData.get('slotDuration') as string);

                    await updateAvailabilityAction({
                        dayOfWeek,
                        startTime,
                        endTime,
                        isRecurring: true,
                        type: 'ONE_TO_ONE',
                        title: '1:1 Training',
                        capacity: 1,
                        slotDuration,
                    });
                }} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Day of Week</Label>
                        <Select name="dayOfWeek" required>
                            <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                            <SelectContent>
                                {DAYS.map((day, index) => (
                                    <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Time (e.g. 09:00)</Label>
                            <Input type="time" name="startTime" required />
                        </div>
                        <div className="space-y-2">
                            <Label>End Time (e.g. 17:00)</Label>
                            <Input type="time" name="endTime" required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Slot Duration (Minutes)</Label>
                        <Select name="slotDuration" defaultValue="60">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">30 Minutes</SelectItem>
                                <SelectItem value="45">45 Minutes</SelectItem>
                                <SelectItem value="60">60 Minutes</SelectItem>
                                <SelectItem value="90">90 Minutes</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">We will automatically split your time range into slots of this duration.</p>
                    </div>
                    <Button type="submit" className="w-full">Generate Slots</Button>
                </form>
            ) : (
                <form action={async (formData) => {
                    const dayOfWeek = parseInt(formData.get('dayOfWeek') as string);
                    const startTime = formData.get('startTime') as string;
                    const endTime = formData.get('endTime') as string;
                    const title = formData.get('title') as string;
                    const description = formData.get('description') as string;
                    const capacity = parseInt(formData.get('capacity') as string);

                    await updateAvailabilityAction({
                        dayOfWeek,
                        startTime,
                        endTime,
                        isRecurring: true,
                        title,
                        description,
                        capacity,
                        type: 'GROUP',
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
                            <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
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
                    <div className="space-y-2">
                        <Label>Capacity</Label>
                        <Input type="number" name="capacity" defaultValue="10" min="1" required />
                    </div>
                    <Button type="submit" className="w-full">Add Group Class</Button>
                </form>
            )}
        </div>
    );
}
