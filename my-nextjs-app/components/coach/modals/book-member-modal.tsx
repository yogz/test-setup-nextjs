'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createSessionFromFormAction } from '@/app/actions/coach-form-actions';
import { createRecurringBookingAction } from '@/app/actions/recurring-booking-actions';

interface Member {
    id: string;
    name: string | null;
    email: string;
}

interface Room {
    id: string;
    name: string;
}

interface BookMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: Date;
    members: Member[];
    rooms: Room[];
    defaultDuration?: number;
    defaultRoomId?: string | null;
    coachId: string;
}

export function BookMemberModal({
    isOpen,
    onClose,
    initialDate,
    members,
    rooms,
    defaultDuration = 60,
    defaultRoomId,
    coachId
}: BookMemberModalProps) {
    const [bookingType, setBookingType] = useState<'member' | 'trial'>('member');
    const [memberId, setMemberId] = useState('');
    const [prospectName, setProspectName] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('10:00');
    const [duration, setDuration] = useState('60');
    const [roomId, setRoomId] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
    const [frequency, setFrequency] = useState('1');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showBackdatingConfirm, setShowBackdatingConfirm] = useState(false);
    const [pendingSubmission, setPendingSubmission] = useState(false);

    // Reset and initialize form when modal opens
    useEffect(() => {
        if (isOpen) {
            const dateObj = initialDate || new Date();
            setDate(dateObj.toISOString().split('T')[0]);
            setTime(dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
            setBookingType('member');
            setMemberId('');
            setProspectName('');
            setDuration(defaultDuration.toString());
            setRoomId(defaultRoomId || rooms[0]?.id || '');
            setIsRecurring(false);
            setRecurrenceEndDate('');
            setFrequency('1');
            setNotes('');
        }
    }, [isOpen, initialDate, defaultDuration, defaultRoomId, rooms]);

    const handleSubmit = async (skipConfirmation = false) => {
        if (bookingType === 'member' && !memberId) {
            toast.error('Veuillez sélectionner un membre');
            return;
        }

        if (bookingType === 'trial' && !prospectName) {
            toast.error('Veuillez entrer le nom du prospect');
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();

            let title = 'Session individuelle';
            if (bookingType === 'member') {
                const memberName = members.find(m => m.id === memberId)?.name || 'Membre';
                title = memberName;
                formData.append('memberId', memberId);
            } else {
                title = `${prospectName} (Essai)`;
                // No memberId for trial
            }

            if (isRecurring && bookingType === 'member') {
                // Check if start date is in the past
                const now = new Date();
                const startDateTime = new Date(date);
                const [startHour, startMin] = time.split(':').map(Number);

                // Find first occurrence
                let firstOccurrence = new Date(startDateTime);
                firstOccurrence.setHours(startHour, startMin, 0, 0);

                // Adjust to match dayOfWeek
                const targetDayOfWeek = new Date(date).getDay();
                while (firstOccurrence.getDay() !== targetDayOfWeek) {
                    firstOccurrence.setDate(firstOccurrence.getDate() + 1);
                }

                if (firstOccurrence < now && !skipConfirmation) {
                    setShowBackdatingConfirm(true);
                    setIsLoading(false);
                    return;
                }

                // Use the new recurring booking action for members
                const result = await createRecurringBookingAction({
                    coachId: coachId,
                    memberId: memberId,
                    dayOfWeek: new Date(date).getDay(),
                    startTime: time,
                    endTime: (() => {
                        const [h, m] = time.split(':').map(Number);
                        const end = new Date();
                        end.setHours(h, m + parseInt(duration));
                        return end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    })(),
                    startDate: date,
                    endDate: recurrenceEndDate || undefined,
                });

                if (!result.success) {
                    throw new Error(result.error);
                }
            } else {
                // Use existing logic for single sessions or trials
                formData.append('title', title);
                formData.append('type', 'ONE_TO_ONE');
                formData.append('duration', duration);
                formData.append('sessionDate', date);
                formData.append('sessionTime', time);
                formData.append('roomId', roomId);
                formData.append('description', notes);

                if (isRecurring) {
                    // This path is now only for trials (which probably shouldn't be recurring but logic exists)
                    // OR if we failed to use the new action.
                    // But wait, trials don't have memberId, so they can't use recurringBookingAction.
                    // So we keep this for trials.
                    formData.append('isRecurring', 'true');
                    if (recurrenceEndDate) {
                        formData.append('recurrenceEndDate', recurrenceEndDate);
                    }
                    formData.append('frequency', frequency);
                    const dayOfWeek = new Date(date).getDay();
                    formData.append('weekdays', JSON.stringify([dayOfWeek]));
                } else {
                    formData.append('isRecurring', 'false');
                }

                // Add memberId if it's a single member session
                if (bookingType === 'member') {
                    formData.append('memberId', memberId);
                }

                await createSessionFromFormAction(formData);
            }

            toast.success('Réservation créée');
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Erreur lors de la réservation');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Nouvelle Réservation</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Booking Type */}
                        <div className="space-y-3">
                            <Label>Type de réservation</Label>
                            <RadioGroup
                                defaultValue="member"
                                value={bookingType}
                                onValueChange={(v) => setBookingType(v as 'member' | 'trial')}
                                className="flex space-x-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="member" id="r-member" />
                                    <Label htmlFor="r-member" className="cursor-pointer font-normal">Membre existant</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="trial" id="r-trial" />
                                    <Label htmlFor="r-trial" className="cursor-pointer font-normal">Cours d'essai</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Member Selection or Prospect Name */}
                        <div className="space-y-2">
                            {bookingType === 'member' ? (
                                <>
                                    <Label>Membre *</Label>
                                    <Select value={memberId} onValueChange={setMemberId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Rechercher un membre..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {members.map(member => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.name || member.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </>
                            ) : (
                                <>
                                    <Label>Nom du prospect *</Label>
                                    <Input
                                        value={prospectName}
                                        onChange={(e) => setProspectName(e.target.value)}
                                        placeholder="Ex: Jean Dupont"
                                    />
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Heure (HH:MM)</Label>
                                <Input
                                    type="text"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    placeholder="10:00"
                                    pattern="[0-9]{2}:[0-9]{2}"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Durée (min)</Label>
                                <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Salle</Label>
                                <Select value={roomId} onValueChange={setRoomId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir une salle" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map(room => (
                                            <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} id="repeat" />
                            <Label htmlFor="repeat" className="cursor-pointer">Répéter ce créneau</Label>
                        </div>

                        {isRecurring && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="space-y-2">
                                    <Label>Fréquence</Label>
                                    <Select value={frequency} onValueChange={setFrequency}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Toutes les semaines</SelectItem>
                                            <SelectItem value="2">Toutes les 2 semaines</SelectItem>
                                            <SelectItem value="3">Toutes les 3 semaines</SelectItem>
                                            <SelectItem value="4">Toutes les 4 semaines</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date de fin (optionnel)</Label>
                                    <Input
                                        type="date"
                                        value={recurrenceEndDate}
                                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                        min={date}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Notes (optionnel)</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Notes pour cette réservation..."
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                        <Button onClick={() => handleSubmit()} disabled={isLoading}>
                            {isLoading ? 'Réservation...' : 'Réserver'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            <AlertDialog open={showBackdatingConfirm} onOpenChange={setShowBackdatingConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Attention : Récurrence dans le passé</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette récurrence commence à une date passée. Cela va créer des sessions pour les dates antérieures à aujourd'hui (backdating).
                            <br /><br />
                            Voulez-vous continuer ?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsLoading(false)}>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleSubmit(true)}>
                            Confirmer et créer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
