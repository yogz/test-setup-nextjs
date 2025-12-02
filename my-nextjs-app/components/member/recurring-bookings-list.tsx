'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cancelRecurringBookingAction } from '@/app/actions/recurring-booking-actions';
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
import { Calendar, Clock, User, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type RecurringBooking = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string | null;
  status: string;
  createdAt: Date;
  coach: {
    id: string;
    name: string | null;
  };
  sessions: Array<{
    id: string;
    startTime: Date;
    status: string;
  }>;
};

const DAYS_OF_WEEK = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

type RecurringBookingsListProps = {
  bookings: RecurringBooking[];
};

export function RecurringBookingsList({ bookings }: RecurringBookingsListProps) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);

    const result = await cancelRecurringBookingAction({
      recurringBookingId: bookingId,
      futureOnly: true,
    });

    if (result.success) {
      toast.success('Réservation annulée');
      router.refresh();
    } else {
      toast.error(result.error || 'Erreur lors de l\'annulation');
    }

    setCancellingId(null);
  };

  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold">Aucune réservation récurrente</h3>
        <p className="mt-2 text-sm text-gray-600">
          Créez votre première réservation récurrente pour automatiser vos sessions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className={`rounded-lg border p-4 ${
            booking.status === 'CANCELLED'
              ? 'border-gray-300 bg-gray-50'
              : 'border-blue-200 bg-blue-50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center space-x-2">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white">
                  {DAYS_OF_WEEK[booking.dayOfWeek]}
                </span>
                <span className="text-lg font-semibold">
                  {booking.startTime} - {booking.endTime}
                </span>
                {booking.status === 'CANCELLED' && (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                    Annulée
                  </span>
                )}
              </div>

              {/* Coach Info */}
              <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>Coach: {booking.coach.name || 'Non défini'}</span>
              </div>

              {/* Date Range */}
              <div className="mt-1 flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  Du {format(new Date(booking.startDate), 'dd MMM yyyy', { locale: fr })}
                  {booking.endDate
                    ? ` au ${format(new Date(booking.endDate), 'dd MMM yyyy', { locale: fr })}`
                    : ' (indéfini)'}
                </span>
              </div>

              {/* Next Sessions */}
              {booking.sessions.length > 0 && booking.status === 'ACTIVE' && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700">
                    Prochaines sessions :
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {booking.sessions.slice(0, 4).map((session) => (
                      <span
                        key={session.id}
                        className="rounded bg-white px-2 py-1 text-xs text-gray-700"
                      >
                        {format(new Date(session.startTime), 'dd MMM', { locale: fr })}
                      </span>
                    ))}
                    {booking.sessions.length > 4 && (
                      <span className="rounded bg-white px-2 py-1 text-xs text-gray-500">
                        +{booking.sessions.length - 4} autres
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {booking.status === 'ACTIVE' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={cancellingId === booking.id}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Annuler la réservation récurrente</AlertDialogTitle>
                    <AlertDialogDescription>
                      Voulez-vous annuler cette réservation récurrente ? Toutes les sessions
                      futures seront annulées. Les sessions passées resteront inchangées.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Non, garder</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancel(booking.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Oui, annuler
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
