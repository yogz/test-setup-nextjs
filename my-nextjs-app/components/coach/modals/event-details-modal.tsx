'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, User, Users } from 'lucide-react';
import { useState } from 'react';

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
    block?: { reason?: string | null };
    session?: { capacity?: number | null; bookings?: any[]; description?: string | null; roomId?: string };
};

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: CalendarEventDetails | null;
}

export function EventDetailsModal({ isOpen, onClose, event }: EventDetailsModalProps) {
    const [isLoading, setIsLoading] = useState(false);

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
        if (!confirm('Êtes-vous sûr de vouloir annuler ?')) return;

        setIsLoading(true);
        try {
            alert('Fonctionnalité à implémenter');
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erreur lors de l\'annulation');
        } finally {
            setIsLoading(false);
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
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <Badge variant={isBlocked ? 'destructive' : (isGroup ? 'secondary' : 'default')}>
                            {isBlocked ? 'Bloqué' : (isGroup ? 'Collectif' : 'Individuel')}
                        </Badge>
                    </div>

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
                        {(session?.roomId || event.roomId) && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>Salle</span>
                            </div>
                        )}

                        {!isBlocked && (
                            <div className="flex items-center gap-2">
                                {isGroup ? <Users className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
                                <span>
                                    {isGroup
                                        ? `${bookingCount} / ${capacity || 0} participants`
                                        : (session?.bookings?.[0]?.member?.name || 'Membre')}
                                </span>
                            </div>
                        )}

                        {(session?.description || event.description) && (
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
