'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createAvailabilityAdditionAction } from '@/app/actions/availability-additions-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

type Room = {
  id: string;
  name: string;
};

type Member = {
  id: string;
  name: string | null;
  email: string;
};

interface AvailabilityExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  members?: Member[];
  defaultRoomId?: string;
}

export function AvailabilityExceptionModal({
  isOpen,
  onClose,
  rooms,
  members,
  defaultRoomId
}: AvailabilityExceptionModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Generate time slots (same as WeeklyTemplateEditor)
  const timeSlots = [];
  for (let hour = 6; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeStr);
    }
  }

  const [formData, setFormData] = useState({
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    roomId: defaultRoomId || (rooms.length > 0 ? rooms[0].id : ''),
    reason: '',
    memberId: 'none', // 'none' or memberId
  });

  // Update default room when prop changes or rooms load
  useEffect(() => {
    if (defaultRoomId) {
      setFormData(prev => ({ ...prev, roomId: defaultRoomId }));
    } else if (rooms.length > 0 && !formData.roomId) {
      setFormData(prev => ({ ...prev, roomId: rooms[0].id }));
    }
  }, [defaultRoomId, rooms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Combine date and time
      const startTime = new Date(`${formData.date}T${formData.startTime}`);
      const endTime = new Date(`${formData.date}T${formData.endTime}`);

      const result = await createAvailabilityAdditionAction({
        startTime,
        endTime,
        roomId: formData.roomId,
        reason: formData.reason || undefined,
        memberId: formData.memberId === 'none' ? undefined : formData.memberId,
      });

      if (result.success) {
        if (formData.memberId !== 'none') {
          // If session created, show success message and offer redirect
          setSuccess('Séance créée et réservée avec succès !');
          router.refresh();
        } else {
          // Standard addition
          onClose();
          router.refresh();
          resetForm();
        }
      } else {
        setError(result.error || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Erreur lors de l\'ajout du créneau');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      startTime: '09:00',
      endTime: '10:00',
      roomId: defaultRoomId || (rooms.length > 0 ? rooms[0].id : ''),
      reason: '',
      memberId: 'none',
    });
    setSuccess(null);
    setError(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un créneau exceptionnel</DialogTitle>
          <DialogDescription>
            Ajoutez une disponibilité ou créez une séance pour un membre en dehors de votre semaine type.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-green-50 p-4 text-green-800 flex items-center justify-center flex-col gap-2">
              <p className="font-medium text-lg">Succès !</p>
              <p>{success}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push('/coach/sessions')} className="w-full">
                Voir le planning
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full">
                Fermer
              </Button>
            </div>
          </div>
        ) : (
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

            {/* Time Range (Select) */}
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
                  <SelectContent className="max-h-[200px]">
                    {timeSlots.map((time) => (
                      <SelectItem key={`start-${time}`} value={time}>
                        {time}
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
                  <SelectContent className="max-h-[200px]">
                    {timeSlots.map((time) => (
                      <SelectItem key={`end-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Room Selection (Required) */}
            <div className="space-y-2">
              <Label htmlFor="room">Salle</Label>
              <Select
                value={formData.roomId}
                onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                required
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

            {/* Member Association (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="member">Associer à un membre (optionnel)</Label>
              <Select
                value={formData.memberId}
                onValueChange={(value) => setFormData({ ...formData, memberId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Aucun (Disponibilité ouverte) --</SelectItem>
                  {members?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Si vous sélectionnez un membre, une séance sera automatiquement créée et réservée.
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Raison / Titre (optionnel)</Label>
              <Textarea
                id="reason"
                placeholder={formData.memberId !== 'none' ? "Titre de la séance (ex: Bilan)" : "Ex: Rattrapage, Demande spéciale..."}
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
                onClick={handleClose}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Ajout...' : (formData.memberId !== 'none' ? 'Créer la séance' : 'Ajouter le créneau')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
