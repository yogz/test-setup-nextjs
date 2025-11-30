'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { updateCoachSettingsAction, updateWeeklyAvailabilityAction } from '@/app/actions/coach-availability-actions';
import { generateSessionsFromTemplateAction } from '@/app/actions/generate-sessions-action';
// import { useToast } from '@/hooks/use-toast'; // Assuming you have a toast hook, or I'll use simple alert for now

// Types
interface Room {
    id: string;
    name: string;
}

interface CoachSettings {
    defaultRoomId: string | null;
    defaultDuration: number;
}

interface WeeklySlot {
    startTime: string;
    endTime: string;
    isIndividual: boolean;
    isGroup: boolean;
    roomId?: string;
}

interface DayAvailability {
    dayOfWeek: number;
    isActive: boolean;
    slots: WeeklySlot[];
}

interface WeeklyTemplateEditorProps {
    initialSettings: CoachSettings;
    initialAvailability: any[]; // Type from DB
    rooms: Room[];
}

const DAYS = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 0, label: 'Dimanche' },
];

export function WeeklyTemplateEditor({ initialSettings, initialAvailability, rooms }: WeeklyTemplateEditorProps) {
    const [settings, setSettings] = useState(initialSettings);
    const [availability, setAvailability] = useState<DayAvailability[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize availability state from props
    useEffect(() => {
        const initialState: DayAvailability[] = DAYS.map(day => {
            const daySlots = initialAvailability.filter(a => a.dayOfWeek === day.value);
            return {
                dayOfWeek: day.value,
                isActive: daySlots.length > 0,
                slots: daySlots.length > 0 ? daySlots.map(s => ({
                    startTime: s.startTime,
                    endTime: s.endTime,
                    isIndividual: s.isIndividual ?? false,
                    isGroup: s.isGroup ?? false,
                    roomId: s.roomId || undefined,
                })) : [{
                    startTime: '09:00',
                    endTime: '18:00',
                    isIndividual: false,
                    isGroup: false,
                    roomId: undefined,
                }]
            };
        });
        setAvailability(initialState);
    }, [initialAvailability]);

    const handleSettingsChange = async (key: keyof CoachSettings, value: any) => {
        const newSettings = { ...settings, [key]: value === '' ? null : value };
        setSettings(newSettings);
        // Auto-save settings
        await updateCoachSettingsAction({
            defaultRoomId: newSettings.defaultRoomId ?? undefined,
            defaultDuration: newSettings.defaultDuration
        });
    };

    const toggleDay = (dayOfWeek: number) => {
        setAvailability(prev => prev.map(day => {
            if (day.dayOfWeek === dayOfWeek) {
                return { ...day, isActive: !day.isActive };
            }
            return day;
        }));
    };

    const addSlot = (dayOfWeek: number) => {
        setAvailability(prev => prev.map(day => {
            if (day.dayOfWeek === dayOfWeek) {
                return {
                    ...day,
                    slots: [...day.slots, {
                        startTime: '12:00',
                        endTime: '13:00',
                        isIndividual: false,
                        isGroup: false,
                        roomId: settings.defaultRoomId || undefined,
                    }]
                };
            }
            return day;
        }));
    };

    const removeSlot = (dayOfWeek: number, index: number) => {
        setAvailability(prev => prev.map(day => {
            if (day.dayOfWeek === dayOfWeek) {
                const newSlots = [...day.slots];
                newSlots.splice(index, 1);
                return { ...day, slots: newSlots };
            }
            return day;
        }));
    };

    const updateSlot = (dayOfWeek: number, index: number, field: keyof WeeklySlot, value: any) => {
        setAvailability(prev => prev.map(day => {
            if (day.dayOfWeek === dayOfWeek) {
                const newSlots = [...day.slots];
                newSlots[index] = { ...newSlots[index], [field]: value };
                return { ...day, slots: newSlots };
            }
            return day;
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save each day's availability
            await Promise.all(availability.map(day => {
                if (!day.isActive) {
                    return updateWeeklyAvailabilityAction(day.dayOfWeek, []);
                }
                return updateWeeklyAvailabilityAction(day.dayOfWeek, day.slots);
            }));
            // Show success message (alert for now)
            alert('Semaine type sauvegardée !');
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la sauvegarde');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Global Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Paramètres par défaut</CardTitle>
                    <CardDescription>Ces réglages s'appliqueront à vos nouvelles sessions</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Salle par défaut</Label>
                        <Select
                            value={settings.defaultRoomId || ''}
                            onValueChange={(val) => handleSettingsChange('defaultRoomId', val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choisir une salle" />
                            </SelectTrigger>
                            <SelectContent>
                                {rooms.map(room => (
                                    <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Durée par défaut (minutes)</Label>
                        <Select
                            value={settings.defaultDuration.toString()}
                            onValueChange={(val) => handleSettingsChange('defaultDuration', parseInt(val))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">30 min</SelectItem>
                                <SelectItem value="45">45 min</SelectItem>
                                <SelectItem value="60">1h</SelectItem>
                                <SelectItem value="90">1h30</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Weekly Schedule */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Horaires d'ouverture</CardTitle>
                            <CardDescription>Définissez vos créneaux de disponibilité récurrents</CardDescription>
                        </div>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Sauvegarder
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {availability.map((day) => {
                        const dayLabel = DAYS.find(d => d.value === day.dayOfWeek)?.label;
                        return (
                            <div key={day.dayOfWeek} className="border-b pb-6 last:border-0 last:pb-0">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-4">
                                        <Switch
                                            checked={day.isActive}
                                            onCheckedChange={() => toggleDay(day.dayOfWeek)}
                                        />
                                        <Label className="text-base font-semibold">{dayLabel}</Label>
                                    </div>
                                    {day.isActive && (
                                        <Button variant="ghost" size="sm" onClick={() => addSlot(day.dayOfWeek)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Ajouter un créneau
                                        </Button>
                                    )}
                                </div>

                                {day.isActive && (
                                    <div className="space-y-3 pl-14">
                                        {day.slots.map((slot, index) => (
                                            <div key={index} className="space-y-3 p-4 border rounded-lg bg-slate-50">
                                                {/* Time and Room Selection */}
                                                <div className="flex items-center gap-4 flex-wrap">
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="time"
                                                            className="w-32"
                                                            value={slot.startTime}
                                                            onChange={(e) => updateSlot(day.dayOfWeek, index, 'startTime', e.target.value)}
                                                        />
                                                        <span>to</span>
                                                        <Input
                                                            type="time"
                                                            className="w-32"
                                                            value={slot.endTime}
                                                            onChange={(e) => updateSlot(day.dayOfWeek, index, 'endTime', e.target.value)}
                                                        />
                                                    </div>
                                                    <Select
                                                        value={slot.roomId || ''}
                                                        onValueChange={(val) => updateSlot(day.dayOfWeek, index, 'roomId', val || undefined)}
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Select room" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {rooms.map(room => (
                                                                <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive/90"
                                                        onClick={() => removeSlot(day.dayOfWeek, index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* Type Selection */}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`indiv-${day.dayOfWeek}-${index}`}
                                                            checked={slot.isIndividual}
                                                            onCheckedChange={(checked) => updateSlot(day.dayOfWeek, index, 'isIndividual', !!checked)}
                                                        />
                                                        <Label htmlFor={`indiv-${day.dayOfWeek}-${index}`}>Individuel</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`group-${day.dayOfWeek}-${index}`}
                                                            checked={slot.isGroup}
                                                            onCheckedChange={(checked) => updateSlot(day.dayOfWeek, index, 'isGroup', !!checked)}
                                                        />
                                                        <Label htmlFor={`group-${day.dayOfWeek}-${index}`}>Collectif</Label>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
