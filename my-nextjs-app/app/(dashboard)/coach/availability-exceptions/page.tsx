import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { availabilityAdditions, blockedSlots, rooms, coachSettings, users } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { AddAvailabilityExceptionForm } from '@/components/coach/add-availability-exception-form';
import { AvailabilityAdditionsList } from '@/components/coach/availability-additions-list';
import { AddBlockedSlotForm } from '@/components/coach/add-blocked-slot-form';
import { BlockedSlotsList } from '@/components/coach/blocked-slots-list';

export default async function CoachAvailabilityExceptionsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== 'coach' && session.user.role !== 'owner')) {
    redirect('/dashboard');
  }

  // Fetch all rooms
  const allRooms = await db.query.rooms.findMany({
    columns: {
      id: true,
      name: true,
    },
  });

  // Fetch coach settings for default room
  const settings = await db.query.coachSettings.findFirst({
    where: eq(coachSettings.coachId, session.user.id),
  });

  // Fetch all members for association
  const allMembers = await db.query.users.findMany({
    where: eq(users.role, 'member'),
    orderBy: (table, { asc }) => [asc(table.name)],
  });

  // Fetch availability additions (future only)
  const additions = await db.query.availabilityAdditions.findMany({
    where: and(
      eq(availabilityAdditions.coachId, session.user.id),
      gte(availabilityAdditions.startTime, new Date())
    ),
    orderBy: (table, { asc }) => [asc(table.startTime)],
  });

  // Fetch blocked slots for reference
  const blocked = await db.query.blockedSlots.findMany({
    where: and(
      eq(blockedSlots.coachId, session.user.id),
      gte(blockedSlots.startTime, new Date())
    ),
    orderBy: (table, { asc }) => [asc(table.startTime)],
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Créneaux exceptionnels</h1>
        <p className="mt-1 text-gray-600">
          Gérez vos disponibilités en dehors de votre semaine type
        </p>
      </div>

      {/* Availability Additions Section */}
      <div className="mb-8 rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Créneaux ajoutés</h2>
            <p className="text-sm text-gray-600">
              Disponibilités exceptionnelles que vous avez ajoutées
            </p>
          </div>
          <AddAvailabilityExceptionForm
            rooms={allRooms}
            members={allMembers}
            defaultRoomId={settings?.defaultRoomId || undefined}
          />
        </div>
        <AvailabilityAdditionsList additions={additions} />
      </div>

      {/* Blocked Slots Section */}
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Créneaux bloqués</h2>
            <p className="text-sm text-gray-600">
              Périodes où vous n'êtes PAS disponible (vacances, RDV...)
            </p>
          </div>
          <AddBlockedSlotForm />
        </div>
        <BlockedSlotsList blockedSlots={blocked} />
      </div>

      {/* Info Section */}
      <div className="mt-6 rounded-lg bg-blue-50 p-4">
        <h3 className="font-semibold text-blue-900">Différences entre les types de créneaux</h3>
        <div className="mt-2 space-y-2 text-sm text-blue-800">
          <div>
            <span className="font-medium">🟢 Créneaux ajoutés:</span> Disponibilités exceptionnelles
            en dehors de votre semaine type (ex: un samedi spécial, un rattrapage)
          </div>
          <div>
            <span className="font-medium">🔴 Créneaux bloqués:</span> Périodes où vous n'êtes PAS
            disponible malgré votre semaine type (ex: vacances, rendez-vous)
          </div>
          <div>
            <span className="font-medium">📅 Semaine type:</span> Votre planning récurrent hebdomadaire
            (géré dans la section Sessions)
          </div>
        </div>
      </div>
    </div>
  );
}
