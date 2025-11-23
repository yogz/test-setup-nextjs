'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { updateAvailabilityAction } from '@/app/actions/gym-actions';

const DAYS = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 0 },
];

export function AvailabilityForm() {
    const [mode, setMode] = useState<'one-to-one' | 'group'>('one-to-one');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);

    const handleDayToggle = (dayIndex: number) => {
        setSelectedDays(prev =>
            prev.includes(dayIndex)
                ? prev.filter(d => d !== dayIndex)
                : [...prev, dayIndex]
        );
    };

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
                    const startTime = formData.get('startTime') as string;
                    const endTime = formData.get('endTime') as string;
                    const slotDuration = parseInt(formData.get('slotDuration') as string);

                    // We need to manually append the array of days because FormData doesn't handle arrays well by default
                    // But wait, our server action expects an object with dayOfWeek as array.
                    // We can't easily pass array via standard form submission without hidden inputs or client-side handling.
                    // Let's use bind or just call the action directly? No, let's just pass the data.
                    // Actually, the action takes an input object. We can call it directly.

                    await updateAvailabilityAction({
                        dayOfWeek: selectedDays,
                        startTime,
                        endTime,
                        isRecurring: true,
                        type: 'ONE_TO_ONE',
                        title: '1:1 Training',
                        capacity: 1,
                        slotDuration,
                    });
                }} className="space-y-4">
                    <div className="space-y-3">
                        <Label>Days of Week</Label>
                        <div className="flex flex-wrap gap-4">
                            {DAYS.map((day) => (
                                <div key={day.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`day-${day.value}`}
                                        checked={selectedDays.includes(day.value)}
                                        onCheckedChange={() => handleDayToggle(day.value)}
                                    />
                                    <label
                                        htmlFor={`day-${day.value}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {day.label.slice(0, 3)}
                                    </label>
                                </div>
                            ))}
                        </div>
                        {selectedDays.length === 0 && (
                            <p className="text-xs text-destructive">Please select at least one day</p>
                        )}
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
                    <Button type="submit" className="w-full" disabled={selectedDays.length === 0}>Generate Slots</Button>
                </form>
            ) : (
                <form action={async (formData) => {
                    const startTime = formData.get('startTime') as string;
                    const endTime = formData.get('endTime') as string;
                    const title = formData.get('title') as string;
                    const description = formData.get('description') as string;
                    const capacity = parseInt(formData.get('capacity') as string);

                    await updateAvailabilityAction({
                        dayOfWeek: selectedDays,
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
                    <div className="space-y-3">
                        <Label>Days of Week</Label>
                        <div className="flex flex-wrap gap-4">
                            {DAYS.map((day) => (
                                <div key={day.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`group-day-${day.value}`}
                                        checked={selectedDays.includes(day.value)}
                                        onCheckedChange={() => handleDayToggle(day.value)}
                                    />
                                    <label
                                        htmlFor={`group-day-${day.value}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {day.label.slice(0, 3)}
                                    </label>
                                </div>
                            ))}
                        </div>
                        {selectedDays.length === 0 && (
                            <p className="text-xs text-destructive">Please select at least one day</p>
                        )}
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
                    <Button type="submit" className="w-full" disabled={selectedDays.length === 0}>Add Group Class</Button>
                </form>
            )}
        </div>
    );
}
