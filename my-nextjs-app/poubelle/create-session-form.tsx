'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const WEEKDAYS = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 0, label: 'Dimanche' },
];

const DURATION_PRESETS = [
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 heure' },
    { value: 'custom', label: 'Personnalisé' },
];

interface CreateSessionFormProps {
    coachName: string;
    onSubmit: (formData: FormData) => Promise<void>;
}

export function CreateSessionForm({ coachName, onSubmit }: CreateSessionFormProps) {
    // Removed sessionType state - all sessions are ONE_TO_ONE
    const [isRecurring, setIsRecurring] = useState(false);
    const [durationPreset, setDurationPreset] = useState('60');
    const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
    const [customDuration, setCustomDuration] = useState('');

    const defaultTitle = `Training avec ${coachName}`;

    const handleWeekdayToggle = (day: number) => {
        setSelectedWeekdays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        // Add weekdays as JSON
        formData.set('weekdays', JSON.stringify(selectedWeekdays));

        // Add duration based on preset or custom
        const duration = durationPreset === 'custom' ? customDuration : durationPreset;
        formData.set('duration', duration);

        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
                <Label htmlFor="title">Titre de la session</Label>
                <Input
                    id="title"
                    name="title"
                    defaultValue={defaultTitle}
                    placeholder={defaultTitle}
                    required
                />
            </div>

            {/* Hidden input for session type - always ONE_TO_ONE */}
            <input type="hidden" name="type" value="ONE_TO_ONE" />

            {/* Duration */}
            <div className="space-y-3">
                <Label>Durée de la session</Label>
                <Select value={durationPreset} onValueChange={setDurationPreset}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {DURATION_PRESETS.map((preset) => (
                            <SelectItem key={preset.value} value={preset.value}>
                                {preset.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {durationPreset === 'custom' && (
                    <div className="space-y-2">
                        <Label htmlFor="customDuration">Durée personnalisée (en minutes)</Label>
                        <Input
                            id="customDuration"
                            type="number"
                            min="1"
                            value={customDuration}
                            onChange={(e) => setCustomDuration(e.target.value)}
                            placeholder="Ex: 90"
                            required
                        />
                    </div>
                )}
            </div>

            {/* Weekdays */}
            <div className="space-y-3">
                <Label>Jours de la semaine</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {WEEKDAYS.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox
                                id={`day-${day.value}`}
                                checked={selectedWeekdays.includes(day.value)}
                                onCheckedChange={() => handleWeekdayToggle(day.value)}
                            />
                            <Label htmlFor={`day-${day.value}`} className="font-normal cursor-pointer">
                                {day.label}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recurring */}
            <div className="flex items-center space-x-2">
                <Switch
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                />
                <Label htmlFor="recurring" className="cursor-pointer">Session récurrente</Label>
                <input type="hidden" name="isRecurring" value={isRecurring ? 'true' : 'false'} />
            </div>

            {/* Recurring Dates */}
            {isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Date de début</Label>
                        <Input
                            id="startDate"
                            name="startDate"
                            type="date"
                            required={isRecurring}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endDate">Date de fin</Label>
                        <Input
                            id="endDate"
                            name="recurrenceEndDate"
                            type="date"
                            required={isRecurring}
                        />
                    </div>
                </div>
            )}

            {/* Single date/time - Only for non-recurring */}
            {!isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="sessionDate">Date de la session</Label>
                        <Input
                            id="sessionDate"
                            name="sessionDate"
                            type="date"
                            required={!isRecurring}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sessionTime">Heure de début</Label>
                        <Input
                            id="sessionTime"
                            name="sessionTime"
                            type="time"
                            required={!isRecurring}
                        />
                    </div>
                </div>
            )}

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Description (optionnelle)</Label>
                <Input
                    id="description"
                    name="description"
                    placeholder="Informations complémentaires..."
                />
            </div>

            <Button type="submit" className="w-full">
                Créer la session
            </Button>
        </form>
    );
}
