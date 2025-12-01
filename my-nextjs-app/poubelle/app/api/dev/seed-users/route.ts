import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { users, accounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Development-only endpoint to create test users
 * Access: GET /api/dev/seed-users
 */
export async function GET(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const testUsers = [
        {
            email: 'coach@coach.coach',
            password: 'password123456',
            name: 'Test Coach',
            role: 'coach',
        },
        {
            email: 'owner@owner.owner',
            password: 'password123456',
            name: 'Test Owner',
            role: 'owner',
        },
        {
            email: 'nicolas.a.perez@gmail.com',
            password: 'password123456',
            name: 'Nicolas Perez',
            role: 'member',
        },
    ];

    const results = [];

    for (const userData of testUsers) {
        try {
            // Check if user already exists
            const existingUser = await db.query.users.findFirst({
                where: eq(users.email, userData.email),
            });

            if (existingUser) {
                // Delete existing credential accounts
                await db.delete(accounts).where(
                    eq(accounts.userId, existingUser.id)
                );

                // Create new credential account using better-auth
                await auth.api.signUpEmail({
                    body: {
                        email: userData.email,
                        password: userData.password,
                        name: userData.name,
                    },
                });

                // Update the role
                await db.update(users)
                    .set({
                        role: userData.role as any,
                        emailVerified: true,
                    })
                    .where(eq(users.id, existingUser.id));

                results.push({
                    email: userData.email,
                    status: 'password_reset',
                    role: userData.role,
                });
            } else {
                // Create new user using better-auth API
                await auth.api.signUpEmail({
                    body: {
                        email: userData.email,
                        password: userData.password,
                        name: userData.name,
                    },
                });

                // Update the role after creation
                const newUser = await db.query.users.findFirst({
                    where: eq(users.email, userData.email),
                });

                if (newUser) {
                    await db.update(users)
                        .set({
                            role: userData.role as any,
                            emailVerified: true,
                        })
                        .where(eq(users.id, newUser.id));
                }

                results.push({
                    email: userData.email,
                    status: 'created',
                    role: userData.role,
                });
            }
        } catch (error: any) {
            results.push({
                email: userData.email,
                status: 'error',
                error: error.message,
            });
        }
    }

    return NextResponse.json({
        message: 'Dev users seeding complete',
        results,
        note: 'All users have password: "password123456"',
    });
}
