'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, User, Users, UserX, CheckCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { unblockSlotAction, cancelSessionAction } from '@/app/actions/coach-availability-actions';
import { markNoShowAction, markAttendedAction, addSessionCommentAction } from '@/app/actions/gym-actions';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';

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
    status?: string;
    block?: { id?: string; reason?: string | null };
    session?: {
        id?: string;
        capacity?: number | null;
        bookings?: any[];
        description?: string | null;
        roomId?: string;
        room?: { id: string; name: string } | null;
        member?: { id: string; name: string } | null;
        status?: string;
    };
};

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: CalendarEventDetails | null;
}

export function EventDetailsModal({ isOpen, onClose, event }: EventDetailsModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const router = useRouter();

    if (!event) return null;

    const sessionData = event.session;
    const blockData = event.block;
    const isGroup = event.type === 'GROUP';
    const isBlocked = event.type === 'BLOCKED';

    const start = new Date(event.start || new Date());
    const end = new Date(event.end || new Date());
    const bookingCount = sessionData?.bookings?.length || 0;
    const capacity = sessionData?.capacity ?? event.capacity ?? 0;
    const sessionStatus = sessionData?.status || event.status;
    const isPast = start < new Date();
    const isScheduled = sessionStatus === 'scheduled';
    const isCompleted = sessionStatus === 'completed';
    const isNoShow = sessionStatus === 'no_show';
    const sessionId = sessionData?.id;
    const blockId = blockData?.id;
    const blockReason = blockData?.reason || event.reason;

    const handleNoShow = async () => {
        if (!sessionId) {
            toast.error('Impossible de marquer l\'absence : ID de la session manquant');
            return;
        }

        setIsLoading(true);
        try {
            const result = await markNoShowAction({ sessionId });
            if (result.success) {
                toast.success('Absence enregistrée');
                onClose();
                router.refresh();
            } else {
                toast.error('error' in result ? result.error : 'Erreur lors du marquage de l\'absence');
            }
        } catch (error) {
            console.error('Erreur no-show:', error);
            toast.error('Erreur lors du marquage de l\'absence');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAttended = async () => {
        if (!sessionId) {
            toast.error('Impossible de confirmer la présence : ID de la session manquant');
            return;
        }

        setIsLoading(true);
        try {
            const result = await markAttendedAction({ sessionId });
            if (result.success) {
                toast.success('Présence confirmée');
                onClose();
                router.refresh();
            } else {
                toast.error('error' in result ? result.error : 'Erreur lors de la confirmation');
            }
        } catch (error) {
            console.error('Erreur présence:', error);
            toast.error('Erreur lors de la confirmation de la présence');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveNote = async () => {
        if (!sessionId || !noteContent.trim()) {
            return;
        }

        setIsSavingNote(true);
        try {
            const result = await addSessionCommentAction({
                sessionId,
                content: noteContent.trim()
            });
            if (result.success) {
                toast.success('Note enregistrée');
                setNoteContent('');
                setShowNotes(false);
                router.refresh();
            } else {
                toast.error('error' in result ? result.error : 'Erreur lors de l\'enregistrement de la note');
            }
        } catch (error) {
            console.error('Erreur note:', error);
            toast.error('Erreur lors de l\'enregistrement de la note');
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleCancel = async () => {
        if (isBlocked) {
            // Débloquer le créneau
            if (!blockId) {
                toast.error('Impossible de débloquer : ID du créneau manquant');
                return;
            }

            setIsLoading(true);
            try {
                await unblockSlotAction(blockId);
                toast.success('Créneau débloqué');
                onClose();
                router.refresh();
            } catch (error) {
                console.error('Erreur déblocage:', error);
                toast.error('Erreur lors du déblocage du créneau');
            } finally {
                setIsLoading(false);
            }
        } else {
            // Annuler une session
            if (!sessionId) {
                toast.error('Impossible d\'annuler : ID de la session manquant');
                return;
            }

            setIsLoading(true);
            try {
                await cancelSessionAction(sessionId);
                toast.success('Session annulée');
                onClose();
                router.refresh();
            } catch (error) {
                console.error('Erreur annulation:', error);
                toast.error('Erreur lors de l\'annulation de la session');
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
                            <div className="flex gap-2 flex-wrap">
                                <Badge variant={isBlocked ? 'destructive' : (isGroup ? 'secondary' : 'default')}>
                                    {isBlocked ? 'Bloqué' : (isGroup ? 'Collectif' : 'Individuel')}
                                </Badge>
                                {!isBlocked && isCompleted && (
                                    <Badge variant="default" className="bg-green-600">Terminé</Badge>
                                )}
                                {!isBlocked && isNoShow && (
                                    <Badge variant="outline" className="text-orange-600 border-orange-300">Absent</Badge>
                                )}
                            </div>
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
                        {(sessionData?.room?.name || event.room?.name) && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{sessionData?.room?.name || event.room?.name}</span>
                            </div>
                        )}

                        {!isBlocked && (
                            <div className="flex items-center gap-2">
                                {isGroup ? <Users className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
                                <span>
                                    {isGroup
                                        ? `${bookingCount} / ${capacity || 0} participants`
                                        : (sessionData?.member?.name || sessionData?.bookings?.[0]?.member?.name || event.member?.name || 'Membre')}
                                </span>
                            </div>
                        )}

                        {!isBlocked && isGroup && (sessionData?.description || event.description) && (
                            <div className="mt-4 rounded-md bg-muted p-3">
                                <p className="text-muted-foreground">{sessionData?.description || event.description}</p>
                            </div>
                        )}

                        {isBlocked && blockReason && (
                            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
                                <p className="text-sm font-semibold text-red-800">Raison :</p>
                                <p className="text-red-700">{blockReason}</p>
                            </div>
                        )}

                        {/* Section Notes - visible pour les sessions (pas les blocks) */}
                        {!isBlocked && sessionId && (
                            <div className="mt-4 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowNotes(!showNotes)}
                                    className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                                >
                                    <FileText className="h-4 w-4" />
                                    Ajouter une note
                                    {showNotes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>

                                {showNotes && (
                                    <div className="mt-3 space-y-3">
                                        <Textarea
                                            value={noteContent}
                                            onChange={(e) => setNoteContent(e.target.value)}
                                            placeholder="Notez vos observations sur cette séance..."
                                            className="min-h-[100px] resize-none"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setShowNotes(false);
                                                    setNoteContent('');
                                                }}
                                            >
                                                Annuler
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveNote}
                                                disabled={isSavingNote || !noteContent.trim()}
                                            >
                                                {isSavingNote ? 'Enregistrement...' : 'Enregistrer'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose}>Fermer</Button>

                    {/* Actions pour les sessions passées (pas les blocks) */}
                    {!isBlocked && isPast && isScheduled && (
                        <>
                            <Button
                                variant="default"
                                onClick={handleAttended}
                                disabled={isLoading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Présent
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleNoShow}
                                disabled={isLoading}
                                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                                <UserX className="h-4 w-4 mr-2" />
                                Absent
                            </Button>
                        </>
                    )}

                    {/* Bouton annuler pour sessions futures ou débloquer pour blocks */}
                    {(isBlocked || (!isPast && !isCompleted && !isNoShow)) && (
                        <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
                            {isBlocked ? 'Débloquer' : 'Annuler'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
