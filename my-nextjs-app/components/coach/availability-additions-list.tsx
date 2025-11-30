'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteAvailabilityAdditionAction } from '@/app/actions/availability-additions-actions';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Calendar, Clock, MapPin, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type AvailabilityAddition = {
  id: string;
  startTime: Date;
  endTime: Date;
  reason: string | null;
  roomId: string | null;
};

type AvailabilityAdditionsListProps = {
  additions: AvailabilityAddition[];
};

export function AvailabilityAdditionsList({ additions }: AvailabilityAdditionsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (additionId: string) => {
    setDeletingId(additionId);

    const result = await deleteAvailabilityAdditionAction(additionId);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Erreur lors de la suppression');
    }

    setDeletingId(null);
  };

  if (additions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold">Aucun créneau exceptionnel</h3>
        <p className="mt-2 text-sm text-gray-600">
          Ajoutez des disponibilités en dehors de votre semaine type
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {additions.map((addition) => (
        <div
          key={addition.id}
          className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4"
        >
          <div className="flex-1">
            {/* Date */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-700" />
              <span className="font-semibold text-green-900">
                {format(new Date(addition.startTime), 'EEEE dd MMMM yyyy', { locale: fr })}
              </span>
            </div>

            {/* Time */}
            <div className="mt-1 flex items-center space-x-2 text-sm text-gray-700">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(addition.startTime), 'HH:mm')} -{' '}
                {format(new Date(addition.endTime), 'HH:mm')}
              </span>
            </div>

            {/* Reason */}
            {addition.reason && (
              <div className="mt-1 text-sm text-gray-600">
                <span className="font-medium">Raison:</span> {addition.reason}
              </div>
            )}
          </div>

          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={deletingId === addition.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer le créneau exceptionnel</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer ce créneau exceptionnel ? Cette
                  action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(addition.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  );
}
