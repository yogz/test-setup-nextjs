'use server';

import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { availabilityAdditions, users } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ============================================================================
// TYPES
// ============================================================================

export type CreateAvailabilityAdditionInput = {
  startTime: Date;
  endTime: Date;
  roomId?: string;
  reason?: string;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getAuthenticatedCoach() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== 'coach' && session.user.role !== 'owner')) {
    throw new Error('Unauthorized - Coach or Owner role required');
  }

  return session.user;
}

// ============================================================================
// CREATE AVAILABILITY ADDITION
// ============================================================================

export async function createAvailabilityAdditionAction(data: CreateAvailabilityAdditionInput) {
  try {
    const user = await getAuthenticatedCoach();

    const { startTime, endTime, roomId, reason } = data;

    // Validate times
    if (new Date(startTime) >= new Date(endTime)) {
      return { success: false, error: 'La date de fin doit être après la date de début' };
    }

    // Check if in the past
    if (new Date(startTime) < new Date()) {
      return { success: false, error: 'Impossible de créer un créneau dans le passé' };
    }

    // Create the availability addition
    const [addition] = await db.insert(availabilityAdditions).values({
      coachId: user.id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      roomId: roomId || null,
      reason: reason || null,
    }).returning();

    revalidatePath('/coach/sessions');
    revalidatePath('/coach/availability');

    return {
      success: true,
      message: 'Créneau exceptionnel ajouté avec succès',
      data: addition,
    };
  } catch (error) {
    console.error('Create availability addition error:', error);
    return { success: false, error: 'Une erreur est survenue' };
  }
}

// ============================================================================
// DELETE AVAILABILITY ADDITION
// ============================================================================

export async function deleteAvailabilityAdditionAction(additionId: string) {
  try {
    const user = await getAuthenticatedCoach();

    // Verify ownership
    const addition = await db.query.availabilityAdditions.findFirst({
      where: eq(availabilityAdditions.id, additionId),
    });

    if (!addition) {
      return { success: false, error: 'Créneau non trouvé' };
    }

    if (addition.coachId !== user.id && user.role !== 'owner') {
      return { success: false, error: 'Non autorisé' };
    }

    await db.delete(availabilityAdditions)
      .where(eq(availabilityAdditions.id, additionId));

    revalidatePath('/coach/sessions');
    revalidatePath('/coach/availability');

    return {
      success: true,
      message: 'Créneau exceptionnel supprimé',
    };
  } catch (error) {
    console.error('Delete availability addition error:', error);
    return { success: false, error: 'Une erreur est survenue' };
  }
}

// ============================================================================
// GET AVAILABILITY ADDITIONS
// ============================================================================

export async function getAvailabilityAdditionsAction(startDate?: Date, endDate?: Date) {
  try {
    const user = await getAuthenticatedCoach();

    const start = startDate || new Date();
    const end = endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

    const additions = await db.query.availabilityAdditions.findMany({
      where: and(
        eq(availabilityAdditions.coachId, user.id),
        gte(availabilityAdditions.startTime, start),
        lte(availabilityAdditions.endTime, end)
      ),
      orderBy: (table, { asc }) => [asc(table.startTime)],
    });

    return { success: true, data: additions };
  } catch (error) {
    console.error('Get availability additions error:', error);
    return { success: false, error: 'Une erreur est survenue' };
  }
}
