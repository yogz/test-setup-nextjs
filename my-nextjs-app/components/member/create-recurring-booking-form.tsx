'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { Calendar } from 'lucide-react';

type Coach = {
  id: string;
  name: string | null;
};

type CreateRecurringBookingFormProps = {
  coaches: Coach[];
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

export function CreateRecurringBookingForm({ coaches }: CreateRecurringBookingFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    coachId: '',
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
        coachId: formData.coachId,
        dayOfWeek: parseInt(formData.dayOfWeek),
        startTime: formData.startTime,
        endTime: formData.endTime,
        startDate: formData.startDate,
        endDate: formData.hasEndDate ? formData.endDate : undefined,
      });

      if (result.success) {
        toast.success('Réservation récurrente créée !');
        setOpen(false);
        router.refresh();
        // Reset form
        setFormData({
          coachId: '',
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
          <Calendar className="mr-2 h-4 w-4" />
          Nouvelle réservation récurrente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer une réservation récurrente</DialogTitle>
          <DialogDescription>
            Réservez un créneau régulier chaque semaine avec votre coach
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Coach Selection */}
          <div className="space-y-2">
            <Label htmlFor="coach">Coach</Label>
            <Select
              value={formData.coachId}
              onValueChange={(value) => setFormData({ ...formData, coachId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un coach" />
              </SelectTrigger>
              <SelectContent>
                {coaches.map((coach) => (
                  <SelectItem key={coach.id} value={coach.id}>
                    {coach.name || 'Coach sans nom'}
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
              {loading ? 'Création...' : 'Créer la réservation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
