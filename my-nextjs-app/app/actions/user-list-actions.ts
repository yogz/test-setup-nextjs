'use server';

/**
 * Server Actions for User List Management
 *
 * Handles fetching users that the current user can edit based on RBAC permissions.
 */

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, ne } from 'drizzle-orm';
import {
  requireUser,
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/rbac/guards';
import { UserRole } from '@/lib/validations/auth';
import { hasPermission } from '@/lib/rbac/utils';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export interface EditableUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  dateOfBirth: string | null;
  sex: string | null;
  phone: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetEditableUsersResult {
  success: boolean;
  users?: EditableUser[];
  error?: string;
  canEditSelf?: boolean;
  canEditOthers?: boolean;
}

/**
 * Get all users that the current user can edit
 *
 * Rules:
 * - Members: Can only edit themselves (returns just their own user)
 * - Coaches: Cannot edit any users (returns empty list)
 * - Owners: Can edit all users (returns all users)
 */
export async function getEditableUsers(): Promise<GetEditableUsersResult> {
  try {
    const currentUser = await requireUser();
    const role = (currentUser.role as UserRole) || 'member';

    // Check if user can update others or just themselves
    const canUpdateOthers = hasPermission(role, PERMISSIONS.users.update);
    const canUpdateOwn = hasPermission(role, PERMISSIONS.users.updateOwn);

    // If user can't update anyone, return empty list
    if (!canUpdateOthers && !canUpdateOwn) {
      return {
        success: true,
        users: [],
        canEditSelf: false,
        canEditOthers: false,
      };
    }

    let editableUsers: EditableUser[];

    if (canUpdateOthers) {
      // Owner: Can edit all users
      const allUsers = await db.query.users.findMany({
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      });

      editableUsers = allUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        dateOfBirth: user.dateOfBirth,
        sex: user.sex,
        phone: user.phone,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } else if (canUpdateOwn) {
      // Member: Can only edit themselves
      const ownUser = await db.query.users.findFirst({
        where: eq(users.id, currentUser.id),
      });

      editableUsers = ownUser ? [{
        id: ownUser.id,
        email: ownUser.email,
        name: ownUser.name,
        role: ownUser.role,
        dateOfBirth: ownUser.dateOfBirth,
        sex: ownUser.sex,
        phone: ownUser.phone,
        emailVerified: ownUser.emailVerified,
        createdAt: ownUser.createdAt,
        updatedAt: ownUser.updatedAt,
      }] : [];
    } else {
      editableUsers = [];
    }

    return {
      success: true,
      users: editableUsers,
      canEditSelf: canUpdateOwn,
      canEditOthers: canUpdateOthers,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: 'You must be logged in' };
    }
    if (error instanceof ForbiddenError) {
      return { success: false, error: 'You do not have permission to view users' };
    }
    console.error('Error fetching editable users:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update a user's information
 * This checks if the current user can edit the target user
 */
export async function updateUserAction(
  userId: string,
  data: {
    name?: string;
    dateOfBirth?: string;
    sex?: string;
    phone?: string;
    role?: UserRole;
  }
) {
  try {
    const currentUser = await requireUser();
    const userRole = (currentUser.role as UserRole) || 'member';

    // Check if user can update this specific user
    const canUpdateOthers = hasPermission(userRole, PERMISSIONS.users.update);
    const canUpdateOwn = hasPermission(userRole, PERMISSIONS.users.updateOwn);
    const isOwnProfile = currentUser.id === userId;

    // Verify permission
    if (!canUpdateOthers && (!canUpdateOwn || !isOwnProfile)) {
      throw new ForbiddenError('You do not have permission to update this user');
    }

    // Only owners can change roles
    if (data.role && !hasPermission(userRole, PERMISSIONS.users.changeRole)) {
      throw new ForbiddenError('You do not have permission to change user roles');
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
    if (data.sex !== undefined) updateData.sex = data.sex;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role !== undefined) updateData.role = data.role;

    // Update the user
    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: 'You must be logged in' };
    }
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message };
    }
    console.error('Error updating user:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
