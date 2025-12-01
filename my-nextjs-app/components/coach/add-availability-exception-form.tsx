'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AvailabilityExceptionModal } from './modals/availability-exception-modal';

type Room = {
  id: string;
  name: string;
};

type Member = {
  id: string;
  name: string | null;
  email: string;
};

type AddAvailabilityExceptionFormProps = {
  rooms: Room[];
  members?: Member[];
  defaultRoomId?: string;
};

export function AddAvailabilityExceptionForm({ rooms, members, defaultRoomId }: AddAvailabilityExceptionFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setIsModalOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Ajouter un créneau exceptionnel
      </Button>
      <AvailabilityExceptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rooms={rooms}
        members={members}
        defaultRoomId={defaultRoomId}
      />
    </>
  );
}
