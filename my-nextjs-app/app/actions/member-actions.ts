'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUserWithPermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';

const updateDefaultCoachSchema = z.object({
    coachId: z.string().uuid(),
});

export async function updateDefaultCoachAction(data: { coachId: string }) {
    try {
        // Any member can update their own profile
        // We use a basic permission check or just get the session
        // Using requireUserWithPermission ensures they are logged in
        const user = await requireUserWithPermission(PERMISSIONS.bookings.create); // Basic permission for members

        const validation = updateDefaultCoachSchema.safeParse(data);
        if (!validation.success) {
            return { success: false, error: 'Invalid coach ID' };
        }

        const { coachId } = validation.data;

        // Verify coach exists
        const coach = await db.query.users.findFirst({
            where: eq(users.id, coachId),
        });

        if (!coach || (coach.role !== 'coach' && coach.role !== 'owner')) {
            return { success: false, error: 'Coach not found' };
        }

        await db.update(users)
            .set({ defaultCoachId: coachId })
            .where(eq(users.id, user.id));

        revalidatePath('/member/book');
        revalidatePath('/member/settings');

        return { success: true, message: 'Coach par défaut mis à jour' };
    } catch (error) {
        console.error('Error updating default coach:', error);
        return { success: false, error: 'Une erreur est survenue' };
    }
}

export async function getMemberSettingsAction() {
    try {
        const user = await requireUserWithPermission(PERMISSIONS.bookings.create);

        // Get all coaches
        const coaches = await db.query.users.findMany({
            where: or(eq(users.role, 'coach'), eq(users.role, 'owner')),
            columns: {
                id: true,
                name: true,
            },
        });

        // Get current user to see defaultCoachId
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
            columns: {
                defaultCoachId: true,
            },
        });

        return {
            success: true,
            coaches,
            defaultCoachId: currentUser?.defaultCoachId,
        };
    } catch (error) {
        console.error('Error fetching settings:', error);
        return { success: false, error: 'Erreur de chargement' };
    }
}
