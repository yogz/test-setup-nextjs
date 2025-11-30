'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAvailabilityAdditionAction } from '@/app/actions/availability-additions-actions';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';

type Room = {
  id: string;
  name: string;
};

type AddAvailabilityExceptionFormProps = {
  rooms: Room[];
};

export function AddAvailabilityExceptionForm({ rooms }: AddAvailabilityExceptionFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    roomId: '',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Combine date and time
      const startTime = new Date(`${formData.date}T${formData.startTime}`);
      const endTime = new Date(`${formData.date}T${formData.endTime}`);

      const result = await createAvailabilityAdditionAction({
        startTime,
        endTime,
        roomId: formData.roomId || undefined,
        reason: formData.reason || undefined,
      });

      if (result.success) {
        setOpen(false);
        router.refresh();
        // Reset form
        setFormData({
          date: '',
          startTime: '',
          endTime: '',
          roomId: '',
          reason: '',
        });
      } else {
        setError(result.error || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Erreur lors de l\'ajout du créneau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un créneau exceptionnel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un créneau exceptionnel</DialogTitle>
          <DialogDescription>
            Ajoutez une disponibilité en dehors de votre semaine type (ex: un samedi
            exceptionnel, un rattrapage, etc.)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Heure de début</Label>
              <Input
                type="time"
                id="startTime"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Heure de fin</Label>
              <Input
                type="time"
                id="endTime"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Room Selection */}
          {rooms.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="room">Salle (optionnel)</Label>
              <Select
                value={formData.roomId}
                onValueChange={(value) => setFormData({ ...formData, roomId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une salle" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Raison (optionnel)</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Rattrapage, Demande spéciale, etc."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={2}
            />
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
              {loading ? 'Ajout...' : 'Ajouter le créneau'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
