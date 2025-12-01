'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { unblockSlotAction } from '@/app/actions/coach-availability-actions';
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
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

type BlockedSlot = {
    id: string;
    startTime: Date;
    endTime: Date;
    reason: string | null;
};

type BlockedSlotsListProps = {
    blockedSlots: BlockedSlot[];
};

export function BlockedSlotsList({ blockedSlots }: BlockedSlotsListProps) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (slotId: string) => {
        setDeletingId(slotId);

        try {
            await unblockSlotAction(slotId);
            router.refresh();
        } catch (err) {
            alert('Erreur lors du déblocage du créneau');
        } finally {
            setDeletingId(null);
        }
    };

    if (blockedSlots.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold">Aucun créneau bloqué</h3>
                <p className="mt-2 text-sm text-gray-600">
                    Vous n'avez pas de créneaux bloqués à venir.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {blockedSlots.map((slot) => {
                const startDate = new Date(slot.startTime);
                const endDate = new Date(slot.endTime);
                const sameDay = isSameDay(startDate, endDate);

                return (
                    <div
                        key={slot.id}
                        className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4"
                    >
                        <div className="flex-1">
                            {/* Date */}
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-red-700" />
                                <span className="font-semibold text-red-900">
                                    {sameDay ? (
                                        format(startDate, 'EEEE dd MMMM yyyy', { locale: fr })
                                    ) : (
                                        <>
                                            {format(startDate, 'EEEE dd MMMM yyyy', { locale: fr })}
                                            {' → '}
                                            {format(endDate, 'EEEE dd MMMM yyyy', { locale: fr })}
                                        </>
                                    )}
                                </span>
                            </div>

                            {/* Time */}
                            <div className="mt-1 flex items-center space-x-2 text-sm text-gray-700">
                                <Clock className="h-4 w-4" />
                                <span>
                                    {sameDay ? (
                                        <>
                                            {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                                        </>
                                    ) : (
                                        <>
                                            {format(startDate, 'HH:mm')} (début) - {format(endDate, 'HH:mm')} (fin)
                                        </>
                                    )}
                                </span>
                            </div>

                        {/* Reason */}
                        {slot.reason && (
                            <div className="mt-1 text-sm text-gray-600">
                                <span className="font-medium">Raison:</span> {slot.reason}
                            </div>
                        )}
                    </div>

                    {/* Delete Button */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-100 hover:text-red-700"
                                disabled={deletingId === slot.id}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Débloquer ce créneau ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cela rendra ce créneau potentiellement disponible si votre semaine type le permet.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDelete(slot.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Débloquer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                );
            })}
        </div>
    );
}
