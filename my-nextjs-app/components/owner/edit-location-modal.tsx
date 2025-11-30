'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateLocationAction, deleteLocationAction } from '@/app/actions/owner-actions';
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

interface EditLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    location: {
        id: string;
        name: string;
        address: string | null;
        city: string | null;
        country: string | null;
    } | null;
}

export function EditLocationModal({ isOpen, onClose, location }: EditLocationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');

    useEffect(() => {
        if (location) {
            setName(location.name);
            setAddress(location.address || '');
            setCity(location.city || '');
            setCountry(location.country || '');
        }
    }, [location]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!location) return;

        setIsLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('id', location.id);
        formData.append('name', name);
        formData.append('address', address);
        formData.append('city', city);
        formData.append('country', country);

        try {
            await updateLocationAction(formData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!location) return;

        setIsLoading(true);
        try {
            await deleteLocationAction(location.id);
            setShowDeleteDialog(false);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la suppression');
            setShowDeleteDialog(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (!location) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier la localisation</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nom *</Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="Salle principale"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-address">Adresse</Label>
                            <Input
                                id="edit-address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="123 Rue de la République"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-city">Ville</Label>
                            <Input
                                id="edit-city"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Paris"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-country">Pays</Label>
                            <Input
                                id="edit-country"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder="France"
                            />
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
                            Cette action supprimera définitivement la localisation "{location.name}".
                            Toutes les salles associées seront également affectées.
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
