'use client';

import { useState, useEffect } from 'react';
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
    const [mode, setMode] = useState<'SINGLE' | 'MULTIPLE'>('SINGLE');
    const [isFullDay, setIsFullDay] = useState(false);
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
            setMode('SINGLE');
            setIsFullDay(false);
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
        if (mode === 'MULTIPLE' && !endDate) {
            alert('Veuillez sélectionner une date de fin');
            return;
        }

        setIsLoading(true);
        try {
            let start: Date, end: Date;

            if (mode === 'SINGLE') {
                if (isFullDay) {
                    start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    end = new Date(startDate);
                    end.setHours(23, 59, 59, 999);
                } else {
                    start = new Date(`${startDate}T${startTime}`);
                    end = new Date(`${startDate}T${endTime}`);
                }
            } else {
                // Multiple days - always full days for simplicity in this version, or block range?
                // Prompt says: "If multiple days: start date, end date"
                // Let's assume blocking the whole period
                start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
            }

            // Additional validation: check if dates are valid
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                alert('Dates invalides');
                return;
            }

            if (end <= start) {
                alert('La date de fin doit être après la date de début');
                return;
            }

            await blockSlotAction(start, end, reason);
            onClose();
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
                    <RadioGroup value={mode} onValueChange={(v: any) => setMode(v)} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="SINGLE" id="single" />
                            <Label htmlFor="single">Ce créneau uniquement</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="MULTIPLE" id="multiple" />
                            <Label htmlFor="multiple">Plusieurs jours</Label>
                        </div>
                    </RadioGroup>

                    {mode === 'SINGLE' && (
                        <div className="flex items-center space-x-2">
                            <Switch checked={isFullDay} onCheckedChange={setIsFullDay} id="full-day" />
                            <Label htmlFor="full-day">Journée entière</Label>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date de début</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        {mode === 'MULTIPLE' && (
                            <div className="space-y-2">
                                <Label>Date de fin</Label>
                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        )}
                    </div>

                    {!isFullDay && mode === 'SINGLE' && (
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
