'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Need to check if I have this
import { Switch } from '@/components/ui/switch';
import { createSessionFromFormAction } from '@/app/actions/coach-form-actions'; // Reuse or create new?

// Assuming Textarea component exists or I'll use Input for now or create it
// Let's use Input for description/material for now if Textarea not available, or standard textarea

interface Room {
    id: string;
    name: string;
}

interface CreateClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: Date;
    rooms: Room[];
    coachName: string;
}

export function CreateClassModal({ isOpen, onClose, initialDate, rooms, coachName }: CreateClassModalProps) {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('10:00');
    const [duration, setDuration] = useState('60');
    const [capacity, setCapacity] = useState('10');
    const [roomId, setRoomId] = useState('');

    // Options
    const [recurrence, setRecurrence] = useState('NONE'); // NONE, WEEKLY, BIWEEKLY
    const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
    const [level, setLevel] = useState('ALL');
    const [minParticipants, setMinParticipants] = useState('');
    const [visibility, setVisibility] = useState('PUBLIC');
    const [description, setDescription] = useState('');
    const [material, setMaterial] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    // Reset and initialize form when modal opens
    useEffect(() => {
        if (isOpen) {
            const dateObj = initialDate || new Date();
            setDate(dateObj.toISOString().split('T')[0]);
            setTime(dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
            setTitle('');
            setDuration('60');
            setCapacity('10');
            setRoomId(rooms[0]?.id || '');
            setRecurrence('NONE');
            setRecurrenceEndDate('');
            setLevel('ALL');
            setMinParticipants('');
            setVisibility('PUBLIC');
            setDescription('');
            setMaterial('');
        }
    }, [isOpen, initialDate, rooms]);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('type', 'GROUP');
            formData.append('capacity', capacity);
            formData.append('duration', duration);
            formData.append('sessionDate', date);
            formData.append('sessionTime', time);
            formData.append('roomId', roomId);
            formData.append('description', description);

            // New fields - need to update server action to handle them
            formData.append('level', level);
            formData.append('minParticipants', minParticipants);
            formData.append('visibility', visibility);
            formData.append('material', material);

            if (recurrence !== 'NONE') {
                formData.append('isRecurring', 'true');
                formData.append('recurrenceEndDate', recurrenceEndDate);
                // Need to handle bi-weekly logic in server action if needed
                // For now, let's stick to weekly logic or update action
                // The current action expects 'weekdays' array for recurring
                // We need to calculate the weekday from the date
                const dayOfWeek = new Date(date).getDay();
                formData.append('weekdays', JSON.stringify([dayOfWeek]));
            } else {
                formData.append('isRecurring', 'false');
            }

            await createSessionFromFormAction(formData);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la création du cours');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Créer un cours collectif</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nom du cours *</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Yoga Débutant" />
                        </div>
                        <div className="space-y-2">
                            <Label>Salle *</Label>
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

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Heure</Label>
                            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Durée (min)</Label>
                            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Capacité Max *</Label>
                            <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Niveau</Label>
                            <Select value={level} onValueChange={setLevel}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tous niveaux</SelectItem>
                                    <SelectItem value="BEGINNER">Débutant</SelectItem>
                                    <SelectItem value="INTERMEDIATE">Intermédiaire</SelectItem>
                                    <SelectItem value="ADVANCED">Avancé</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-lg font-semibold">Options</Label>
                        <div className="p-4 border rounded-md space-y-4 bg-muted/20">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Récurrence</Label>
                                    <Select value={recurrence} onValueChange={setRecurrence}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NONE">Ponctuel</SelectItem>
                                            <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                                            {/* <SelectItem value="BIWEEKLY">Bi-mensuel</SelectItem> */}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {recurrence !== 'NONE' && (
                                    <div className="space-y-2">
                                        <Label>Date de fin</Label>
                                        <Input type="date" value={recurrenceEndDate} onChange={(e) => setRecurrenceEndDate(e.target.value)} />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Participants min.</Label>
                                    <Input
                                        type="number"
                                        value={minParticipants}
                                        onChange={(e) => setMinParticipants(e.target.value)}
                                        placeholder="Optionnel"
                                    />
                                    <p className="text-xs text-muted-foreground">Cours annulé si non atteint</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Visibilité</Label>
                                    <Select value={visibility} onValueChange={setVisibility}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PUBLIC">Public</SelectItem>
                                            <SelectItem value="PRIVATE">Sur invitation</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Matériel à apporter</Label>
                                <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Ex: Tapis, Bouteille d'eau..." />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Création...' : 'Créer le cours'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
