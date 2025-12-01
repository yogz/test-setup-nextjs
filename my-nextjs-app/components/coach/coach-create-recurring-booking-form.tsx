'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRecurringBookingAction } from '@/app/actions/recurring-booking-actions';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar, Plus } from 'lucide-react';

type Member = {
    id: string;
    name: string | null;
    email: string;
};

type CoachCreateRecurringBookingFormProps = {
    members: Member[];
    coachId: string;
};

const DAYS_OF_WEEK = [
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
];

const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 7; // Start at 7 AM
    return {
        value: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour}:00`,
    };
});

export function CoachCreateRecurringBookingForm({ members, coachId }: CoachCreateRecurringBookingFormProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        memberId: '',
        dayOfWeek: '',
        startTime: '',
        endTime: '',
        startDate: '',
        endDate: '',
        hasEndDate: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await createRecurringBookingAction({
                coachId: coachId,
                memberId: formData.memberId,
                dayOfWeek: parseInt(formData.dayOfWeek),
                startTime: formData.startTime,
                endTime: formData.endTime,
                startDate: formData.startDate,
                endDate: formData.hasEndDate ? formData.endDate : undefined,
            });

            if (result.success) {
                setOpen(false);
                router.refresh();
                // Reset form
                setFormData({
                    memberId: '',
                    dayOfWeek: '',
                    startTime: '',
                    endTime: '',
                    startDate: '',
                    endDate: '',
                    hasEndDate: false,
                });
            } else {
                setError(result.error || 'Une erreur est survenue');
            }
        } catch (err) {
            setError('Erreur lors de la création de la réservation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle récurrence
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Créer une réservation récurrente</DialogTitle>
                    <DialogDescription>
                        Définissez un créneau régulier pour un membre
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Member Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="member">Membre</Label>
                        <Select
                            value={formData.memberId}
                            onValueChange={(value) => setFormData({ ...formData, memberId: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un membre" />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                        {member.name || member.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Day of Week */}
                    <div className="space-y-2">
                        <Label htmlFor="dayOfWeek">Jour de la semaine</Label>
                        <Select
                            value={formData.dayOfWeek}
                            onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un jour" />
                            </SelectTrigger>
                            <SelectContent>
                                {DAYS_OF_WEEK.map((day) => (
                                    <SelectItem key={day.value} value={day.value.toString()}>
                                        {day.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Time Slots */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Heure de début</Label>
                            <Select
                                value={formData.startTime}
                                onValueChange={(value) => setFormData({ ...formData, startTime: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Début" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIME_SLOTS.map((time) => (
                                        <SelectItem key={time.value} value={time.value}>
                                            {time.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endTime">Heure de fin</Label>
                            <Select
                                value={formData.endTime}
                                onValueChange={(value) => setFormData({ ...formData, endTime: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Fin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIME_SLOTS.map((time) => (
                                        <SelectItem key={time.value} value={time.value}>
                                            {time.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Date de début</Label>
                        <input
                            type="date"
                            id="startDate"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            required
                        />
                    </div>

                    {/* Optional End Date */}
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="hasEndDate"
                                checked={formData.hasEndDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, hasEndDate: e.target.checked })
                                }
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="hasEndDate" className="cursor-pointer">
                                Définir une date de fin (sinon indéfini)
                            </Label>
                        </div>

                        {formData.hasEndDate && (
                            <input
                                type="date"
                                id="endDate"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        )}
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Création...' : 'Créer la récurrence'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
