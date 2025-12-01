'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { blockSlotAction } from '@/app/actions/coach-availability-actions';

interface BlockSlotModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: Date;
    initialStartTime?: string; // "HH:MM"
}

export function BlockSlotModal({ isOpen, onClose, initialDate, initialStartTime }: BlockSlotModalProps) {
    const router = useRouter();
    const [mode, setMode] = useState<'SLOT' | 'DAY' | 'PERIOD'>('SLOT');
    const [reason, setReason] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [isLoading, setIsLoading] = useState(false);

    // Reset and initialize form when modal opens with new data
    useEffect(() => {
        if (isOpen) {
            const dateStr = initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            setStartDate(dateStr);
            setEndDate(dateStr);
            setStartTime(initialStartTime || '09:00');
            setEndTime(initialStartTime ? addOneHour(initialStartTime) : '10:00');
            setMode(initialStartTime ? 'SLOT' : 'DAY');
            setReason('');
        }
    }, [isOpen, initialDate, initialStartTime]);

    function addOneHour(time: string): string {
        const [hours, minutes] = time.split(':').map(Number);
        const nextHour = (hours + 1) % 24;
        return `${nextHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    const handleSubmit = async () => {
        // Validation
        if (!startDate) {
            alert('Veuillez sélectionner une date de début');
            return;
        }
        if (mode === 'PERIOD' && !endDate) {
            alert('Veuillez sélectionner une date de fin');
            return;
        }

        setIsLoading(true);
        try {
            let start: Date, end: Date;

            switch (mode) {
                case 'SLOT':
                    // Créneau spécifique avec heures
                    start = new Date(`${startDate}T${startTime}`);
                    end = new Date(`${startDate}T${endTime}`);
                    break;

                case 'DAY':
                    // Jour complet
                    start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    end = new Date(startDate);
                    end.setHours(23, 59, 59, 999);
                    break;

                case 'PERIOD':
                    // Période (plusieurs jours complets)
                    start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    break;
            }

            // Validation: check if dates are valid
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                alert('Dates invalides');
                return;
            }

            if (end <= start) {
                alert('La fin doit être après le début');
                return;
            }

            await blockSlotAction(start, end, reason);
            onClose();
            router.refresh(); // Rafraîchir la page pour afficher le nouveau créneau bloqué
        } catch (error) {
            console.error(error);
            alert('Erreur lors du blocage du créneau');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bloquer un créneau</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Type de blocage */}
                    <div className="space-y-2">
                        <Label className="text-base font-semibold">Type de blocage</Label>
                        <RadioGroup value={mode} onValueChange={(v: any) => setMode(v)} className="space-y-2">
                            <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-slate-50">
                                <RadioGroupItem value="SLOT" id="slot" />
                                <Label htmlFor="slot" className="flex-1 cursor-pointer">
                                    <div className="font-medium">Créneau spécifique</div>
                                    <div className="text-xs text-gray-500">Bloquer un horaire précis (ex: 14h-16h)</div>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-slate-50">
                                <RadioGroupItem value="DAY" id="day" />
                                <Label htmlFor="day" className="flex-1 cursor-pointer">
                                    <div className="font-medium">Jour complet</div>
                                    <div className="text-xs text-gray-500">Bloquer toute la journée (00h-23h59)</div>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-slate-50">
                                <RadioGroupItem value="PERIOD" id="period" />
                                <Label htmlFor="period" className="flex-1 cursor-pointer">
                                    <div className="font-medium">Période</div>
                                    <div className="text-xs text-gray-500">Bloquer plusieurs jours consécutifs (ex: vacances)</div>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{mode === 'PERIOD' ? 'Date de début' : 'Date'}</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        {mode === 'PERIOD' && (
                            <div className="space-y-2">
                                <Label>Date de fin</Label>
                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        )}
                    </div>

                    {/* Heures (seulement pour créneau spécifique) */}
                    {mode === 'SLOT' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Heure de début</Label>
                                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Heure de fin</Label>
                                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Motif (optionnel)</Label>
                        <Input
                            placeholder="Ex: Vacances, RDV médecin..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Blocage...' : 'Bloquer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
