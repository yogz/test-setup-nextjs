'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, User, Users } from 'lucide-react';
import { useState } from 'react';
import { unblockSlotAction, cancelSessionAction } from '@/app/actions/coach-availability-actions';
import { useRouter } from 'next/navigation';

type CalendarEventDetails = {
    type?: string;
    title?: string | null;
    start?: Date;
    end?: Date;
    startTime?: Date;
    endTime?: Date;
    capacity?: number | null;
    bookings?: any[];
    description?: string | null;
    reason?: string | null;
    roomId?: string;
    room?: { id: string; name: string } | null;
    member?: { id: string; name: string } | null;
    block?: { id?: string; reason?: string | null };
    session?: {
        id?: string;
        capacity?: number | null;
        bookings?: any[];
        description?: string | null;
        roomId?: string;
        room?: { id: string; name: string } | null;
        member?: { id: string; name: string } | null;
    };
};

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: CalendarEventDetails | null;
}

export function EventDetailsModal({ isOpen, onClose, event }: EventDetailsModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    if (!event) return null;

    const session = event.session ?? event;
    const block = event.block ?? (event.type === 'BLOCKED' ? event : null);
    const isGroup = event.type === 'GROUP';
    const isBlocked = event.type === 'BLOCKED';

    const startSource = (session as any)?.startTime || event.start || new Date();
    const endSource = (session as any)?.endTime || event.end || new Date();
    const start = new Date(startSource);
    const end = new Date(endSource);
    const bookingCount = session?.bookings?.length || 0;
    const capacity = session?.capacity ?? event.capacity ?? 0;

    const handleCancel = async () => {
        if (isBlocked) {
            // Débloquer le créneau
            if (!confirm('Êtes-vous sûr de vouloir débloquer ce créneau ?')) return;

            if (!block?.id) {
                alert('Impossible de débloquer : ID du créneau manquant');
                console.error('Block object:', block);
                return;
            }

            setIsLoading(true);
            try {
                await unblockSlotAction(block.id);
                alert('Créneau débloqué avec succès');
                onClose();
                router.refresh();
            } catch (error) {
                console.error('Erreur déblocage:', error);
                alert('Erreur lors du déblocage du créneau');
            } finally {
                setIsLoading(false);
            }
        } else {
            // Annuler une session
            if (!confirm('Êtes-vous sûr de vouloir annuler cette session ?')) return;

            console.log('Session object:', session);
            console.log('Session ID:', session?.id);

            if (!session?.id) {
                alert('Impossible d\'annuler : ID de la session manquant');
                console.error('Session object:', session);
                return;
            }

            setIsLoading(true);
            try {
                console.log('Appel cancelSessionAction avec ID:', session.id);
                await cancelSessionAction(session.id);
                alert('Session annulée avec succès');
                onClose();
                router.refresh();
            } catch (error) {
                console.error('Erreur annulation:', error);
                alert(`Erreur lors de l'annulation de la session: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isBlocked ? 'Créneau bloqué' : (isGroup ? 'Cours collectif' : 'Réservation individuelle')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {(isBlocked || isGroup || event.title) && (
                        <div className="flex items-center justify-between">
                            {(isBlocked || isGroup) && <h3 className="text-lg font-semibold">{event.title}</h3>}
                            <Badge variant={isBlocked ? 'destructive' : (isGroup ? 'secondary' : 'default')} className={!isBlocked && !isGroup ? 'ml-auto' : ''}>
                                {isBlocked ? 'Bloqué' : (isGroup ? 'Collectif' : 'Individuel')}
                            </Badge>
                        </div>
                    )}

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                                {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} -
                                {end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        {(session?.room?.name || event.room?.name) && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{session?.room?.name || event.room?.name}</span>
                            </div>
                        )}

                        {!isBlocked && (
                            <div className="flex items-center gap-2">
                                {isGroup ? <Users className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
                                <span>
                                    {isGroup
                                        ? `${bookingCount} / ${capacity || 0} participants`
                                        : (session?.member?.name || session?.bookings?.[0]?.member?.name || event.member?.name || 'Membre')}
                                </span>
                            </div>
                        )}

                        {!isBlocked && isGroup && (session?.description || event.description) && (
                            <div className="mt-4 rounded-md bg-muted p-3">
                                <p className="text-muted-foreground">{session?.description || event.description}</p>
                            </div>
                        )}

                        {isBlocked && (block?.reason || event.reason) && (
                            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
                                <p className="text-sm font-semibold text-red-800">Raison :</p>
                                <p className="text-red-700">{block?.reason || event.reason}</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Fermer</Button>
                    <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
                        {isBlocked ? 'Débloquer' : 'Annuler'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
