'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Users, UserPlus } from 'lucide-react';

interface ActionMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSlot: { date: Date; time: string } | null;
    onBlockSlot: () => void;
    onCreateClass: () => void;
    onBookMember: () => void;
}

export function ActionMenuModal({
    isOpen,
    onClose,
    selectedSlot,
    onBlockSlot,
    onCreateClass,
    onBookMember
}: ActionMenuModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Que souhaitez-vous faire ?</DialogTitle>
                    <DialogDescription>
                        {selectedSlot && (
                            <>
                                {selectedSlot.date.toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                                {' à '}
                                {selectedSlot.time}
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                    <Button
                        variant="outline"
                        className="justify-start h-auto py-4 px-4"
                        onClick={onBlockSlot}
                    >
                        <Lock className="mr-3 h-5 w-5" />
                        <div className="text-left">
                            <div className="font-medium">Bloquer ce créneau</div>
                            <div className="text-sm text-muted-foreground">Rendre ce créneau indisponible</div>
                        </div>
                    </Button>
                    <Button
                        variant="outline"
                        className="justify-start h-auto py-4 px-4"
                        onClick={onCreateClass}
                    >
                        <Users className="mr-3 h-5 w-5" />
                        <div className="text-left">
                            <div className="font-medium">Créer un cours collectif</div>
                            <div className="text-sm text-muted-foreground">Ouvrir ce créneau à plusieurs membres</div>
                        </div>
                    </Button>
                    <Button
                        variant="outline"
                        className="justify-start h-auto py-4 px-4"
                        onClick={onBookMember}
                    >
                        <UserPlus className="mr-3 h-5 w-5" />
                        <div className="text-left">
                            <div className="font-medium">Réserver pour un membre</div>
                            <div className="text-sm text-muted-foreground">Bloquer pour une session individuelle</div>
                        </div>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
