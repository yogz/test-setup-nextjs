'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createRoomAction, getLocationsAction } from '@/app/actions/owner-actions';
import { Loader2 } from 'lucide-react';

interface AddRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Location {
    id: string;
    name: string;
    city: string | null;
}

export function AddRoomModal({ isOpen, onClose }: AddRoomModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadLocations();
        }
    }, [isOpen]);

    const loadLocations = async () => {
        try {
            const locs = await getLocationsAction();
            setLocations(locs);
            if (locs.length > 0) {
                setSelectedLocationId(locs[0].id);
            }
        } catch (err) {
            console.error('Error loading locations:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        formData.append('locationId', selectedLocationId);

        try {
            await createRoomAction(formData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajouter une nouvelle salle</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                            {error}
                        </div>
                    )}

                    {locations.length === 0 && (
                        <div className="p-3 text-sm text-orange-600 bg-orange-50 rounded-md">
                            Aucune localisation disponible. Veuillez d'abord créer une localisation.
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="locationId">Localisation *</Label>
                        <Select value={selectedLocationId} onValueChange={setSelectedLocationId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une localisation" />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.id}>
                                        {loc.name} {loc.city ? `(${loc.city})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nom de la salle *</Label>
                        <Input id="name" name="name" required placeholder="Salle A" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="capacity">Capacité *</Label>
                        <Input id="capacity" name="capacity" type="number" required min="1" placeholder="10" />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                        <Button type="submit" disabled={isLoading || locations.length === 0}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Créer la salle
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
