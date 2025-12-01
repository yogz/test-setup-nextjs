import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users, recurringBookings } from '@/lib/db/schema';
import { eq, gte } from 'drizzle-orm';
import { CreateRecurringBookingForm } from '@/components/member/create-recurring-booking-form';
import { RecurringBookingsList } from '@/components/member/recurring-bookings-list';

export default async function MemberRecurringBookingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  if (session.user.role !== 'member') {
    redirect('/dashboard');
  }

  // Fetch all coaches
  const coaches = await db.query.users.findMany({
    where: eq(users.role, 'coach'),
    columns: {
      id: true,
      name: true,
    },
  });

  // Fetch member's recurring bookings
  const myBookings = await db.query.recurringBookings.findMany({
    where: eq(recurringBookings.memberId, session.user.id),
    with: {
      coach: {
        columns: {
          id: true,
          name: true,
        },
      },
      sessions: {
        where: (sessions, { gte }) => gte(sessions.startTime, new Date()),
        orderBy: (sessions, { asc }) => [asc(sessions.startTime)],
        limit: 10,
        columns: {
          id: true,
          startTime: true,
          status: true,
        },
      },
    },
    orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes réservations récurrentes</h1>
          <p className="mt-1 text-gray-600">
            Gérez vos créneaux réguliers avec vos coachs
          </p>
        </div>
        <CreateRecurringBookingForm coaches={coaches} />
      </div>

      <div className="rounded-lg border bg-white p-6">
        <RecurringBookingsList bookings={myBookings as any} />
      </div>

      {/* Info Section */}
      <div className="mt-6 rounded-lg bg-blue-50 p-4">
        <h3 className="font-semibold text-blue-900">Comment ça fonctionne ?</h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>• Créez une réservation récurrente pour automatiser vos sessions hebdomadaires</li>
          <li>• Les sessions sont générées automatiquement pour les 6 prochaines semaines</li>
          <li>• Vous pouvez annuler toutes les sessions futures en un clic</li>
          <li>• Les sessions passées restent dans votre historique pour la facturation</li>
        </ul>
      </div>
    </div>
  );
}
