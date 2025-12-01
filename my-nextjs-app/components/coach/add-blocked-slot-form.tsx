'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Ban } from 'lucide-react';
import { BlockSlotModal } from './modals/block-slot-modal';

export function AddBlockedSlotForm() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <Button variant="destructive" onClick={() => setIsModalOpen(true)}>
                <Ban className="mr-2 h-4 w-4" />
                Bloquer un créneau
            </Button>
            <BlockSlotModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
