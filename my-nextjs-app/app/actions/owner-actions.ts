'use server';

import { db } from '@/lib/db';
import { users, rooms, locations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Helper to check owner permission
async function requireOwner() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || session.user.role !== 'owner') {
        throw new Error('Unauthorized: Owner access required');
    }
    return session.user;
}

export async function createCoachAction(formData: FormData) {
    await requireOwner();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    // const specialty = formData.get('specialty') as string; // Not in schema yet, maybe add to metadata or separate table? 
    // For now, let's stick to basic user creation with role 'coach'.

    if (!name || !email || !password) {
        throw new Error('Missing required fields');
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Create user using Better Auth API to handle password hashing etc.
    // We need to use the auth.api.signUpEmail
    // Note: This runs on server, so we can use the API directly.

    try {
        await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            }
        });

        // If role isn't set by signUpEmail (depends on config), we might need to update it manually.
        // But assuming better-auth handles it if passed in body and allowed in schema.
        // Let's verify if we need to manually update role.
        // Better-auth usually doesn't allow setting role in signUp for security, unless configured.
        // Safest bet is to update it manually after creation if we have admin access to DB.

        const newUser = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (newUser && newUser.role !== 'coach') {
            await db.update(users)
                .set({ role: 'coach' })
                .where(eq(users.id, newUser.id));
        }

        revalidatePath('/dashboard');
        revalidatePath('/users');
    } catch (error: any) {
        console.error('Error creating coach:', error);
        throw new Error(error.message || 'Failed to create coach');
    }
}

export async function createRoomAction(formData: FormData) {
    await requireOwner();

    const name = formData.get('name') as string;
    const capacity = parseInt(formData.get('capacity') as string);
    const locationId = formData.get('locationId') as string;

    if (!name || isNaN(capacity) || !locationId) {
        throw new Error('Tous les champs requis doivent être remplis');
    }

    await db.insert(rooms).values({
        name,
        capacity,
        locationId,
    });

    revalidatePath('/dashboard');
    revalidatePath('/owner/admin');
}

export async function getLocationsAction() {
    await requireOwner();
    return await db.query.locations.findMany({
        orderBy: (locations, { asc }) => [asc(locations.name)],
    });
}

export async function getRoomsAction() {
    await requireOwner();
    return await db.query.rooms.findMany({
        with: {
            location: true,
        },
        orderBy: (rooms, { asc }) => [asc(rooms.name)],
    });
}

export async function createLocationAction(formData: FormData) {
    await requireOwner();

    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const country = formData.get('country') as string;

    if (!name) {
        throw new Error('Le nom est requis');
    }

    await db.insert(locations).values({
        name,
        address: address || null,
        city: city || null,
        country: country || null,
    });

    revalidatePath('/dashboard');
}

export async function updateLocationAction(formData: FormData) {
    await requireOwner();

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const country = formData.get('country') as string;

    if (!id || !name) {
        throw new Error('ID et nom sont requis');
    }

    await db.update(locations)
        .set({
            name,
            address: address || null,
            city: city || null,
            country: country || null,
        })
        .where(eq(locations.id, id));

    revalidatePath('/owner/admin');
    revalidatePath('/dashboard');
}

export async function deleteLocationAction(id: string) {
    await requireOwner();

    if (!id) {
        throw new Error('ID requis');
    }

    // Check if location has rooms
    const roomsInLocation = await db.query.rooms.findMany({
        where: eq(rooms.locationId, id),
    });

    if (roomsInLocation.length > 0) {
        throw new Error(`Impossible de supprimer cette localisation car elle contient ${roomsInLocation.length} salle(s)`);
    }

    await db.delete(locations).where(eq(locations.id, id));

    revalidatePath('/owner/admin');
    revalidatePath('/dashboard');
}

export async function updateRoomAction(formData: FormData) {
    await requireOwner();

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const capacity = parseInt(formData.get('capacity') as string);
    const locationId = formData.get('locationId') as string;
    const isActive = formData.get('isActive') === 'true';

    if (!id || !name || isNaN(capacity) || !locationId) {
        throw new Error('Tous les champs requis doivent être remplis');
    }

    await db.update(rooms)
        .set({
            name,
            capacity,
            locationId,
            isActive,
        })
        .where(eq(rooms.id, id));

    revalidatePath('/owner/admin');
    revalidatePath('/dashboard');
}

export async function deleteRoomAction(id: string) {
    await requireOwner();

    if (!id) {
        throw new Error('ID requis');
    }

    await db.delete(rooms).where(eq(rooms.id, id));

    revalidatePath('/owner/admin');
    revalidatePath('/dashboard');
}
