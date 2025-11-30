import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { trainingSessions, users, weeklyAvailability } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { AdminSessionsTable } from '@/components/admin/admin-sessions-table';

export default async function AdminSessionsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Only owners can access this page
    if (!session || session.user.role !== 'owner') {
        redirect('/dashboard');
    }

    // Fetch all sessions with coach, member, and room data
    const allSessions = await db.query.trainingSessions.findMany({
        with: {
            coach: true,
            bookings: {
                with: {
                    member: true
                }
            },
            room: true
        },
        orderBy: (trainingSessions, { desc }) => [desc(trainingSessions.startTime)]
    });

    // Fetch all coaches' availability for problem detection
    const allAvailability = await db.query.weeklyAvailability.findMany();

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Administration des Sessions
                </h1>
                <p className="text-slate-600 text-sm md:text-base">
                    Gérez toutes les sessions et identifiez les problèmes potentiels.
                </p>
            </div>

            <AdminSessionsTable
                sessions={allSessions}
                availability={allAvailability}
            />
        </div>
    );
}
