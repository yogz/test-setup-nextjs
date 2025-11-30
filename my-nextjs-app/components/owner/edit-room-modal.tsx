'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateRoomAction, deleteRoomAction } from '@/app/actions/owner-actions';
import { Loader2, Trash2 } from 'lucide-react';
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

interface EditRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    room: {
        id: string;
        name: string;
        capacity: number | null;
        locationId: string;
        isActive: boolean;
    } | null;
    locations: Array<{
        id: string;
        name: string;
        city: string | null;
    }>;
}

export function EditRoomModal({ isOpen, onClose, room, locations }: EditRoomModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState('');
    const [locationId, setLocationId] = useState('');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (room) {
            setName(room.name);
            setCapacity(room.capacity?.toString() || '');
            setLocationId(room.locationId);
            setIsActive(room.isActive);
        }
    }, [room]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!room) return;

        setIsLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('id', room.id);
        formData.append('name', name);
        formData.append('capacity', capacity);
        formData.append('locationId', locationId);
        formData.append('isActive', isActive.toString());

        try {
            await updateRoomAction(formData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!room) return;

        setIsLoading(true);
        try {
            await deleteRoomAction(room.id);
            setShowDeleteDialog(false);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la suppression');
            setShowDeleteDialog(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (!room) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier la salle</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="edit-location">Localisation *</Label>
                            <Select value={locationId} onValueChange={setLocationId} required>
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
                            <Label htmlFor="edit-room-name">Nom *</Label>
                            <Input
                                id="edit-room-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="Salle A"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-capacity">Capacité *</Label>
                            <Input
                                id="edit-capacity"
                                type="number"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                                required
                                min="1"
                                placeholder="10"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="edit-active"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="edit-active" className="cursor-pointer">Salle active</Label>
                        </div>

                        <DialogFooter className="flex justify-between">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setShowDeleteDialog(true)}
                                className="mr-auto"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                            </Button>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enregistrer
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action supprimera définitivement la salle "{room.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
