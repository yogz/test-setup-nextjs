'use server';

/**
 * Example Server Actions with RBAC Protection
 *
 * These are examples of how to protect server actions with permissions.
 * Copy these patterns for your own server actions.
 */

import {
  requirePermission,
  requireRole,
  requireResourceAccess,
  requireUserWithPermission,
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { UserRole } from '@/lib/validations/auth';

// ============================================================================
// Example 1: Simple Permission Check
// ============================================================================

/**
 * Delete a user - requires specific permission
 */
export async function deleteUserAction(userId: string) {
  try {
    // Only users with users:delete permission can do this
    await requirePermission(PERMISSIONS.users.delete);

    // TODO: Implement actual deletion
    // await db.delete(users).where(eq(users.id, userId));

    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: 'You must be logged in' };
    }
    if (error instanceof ForbiddenError) {
      return { success: false, error: 'You do not have permission to delete users' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Example 2: Role-Based Check
// ============================================================================

/**
 * Access admin dashboard - requires owner role
 */
export async function getAdminDashboardData() {
  try {
    // Only owners can access this
    await requireRole('owner');

    // TODO: Fetch admin data
    // const users = await db.query.users.findMany();
    // const stats = await getSystemStats();

    return {
      success: true,
      data: {
        users: [],
        stats: {},
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: 'You must be logged in' };
    }
    if (error instanceof ForbiddenError) {
      return { success: false, error: 'Only owners can access this dashboard' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Example 3: Resource Ownership Check
// ============================================================================

/**
 * Update a user profile
 * Allows:
 * - Coaches/Owners to update any profile
 * - Members to update their own profile
 */
export async function updateUserProfileAction(
  userId: string,
  data: {
    name?: string;
    phone?: string;
    dateOfBirth?: string;
  }
) {
  try {
    // Check if user can access this resource
    // Either has profile:update OR (owns profile AND has profile:updateOwn)
    await requireResourceAccess(
      userId,
      PERMISSIONS.profile.update,
      PERMISSIONS.profile.updateOwn
    );

    // TODO: Update profile
    // await db.update(users).set(data).where(eq(users.id, userId));

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: 'You must be logged in' };
    }
    if (error instanceof ForbiddenError) {
      return { success: false, error: 'You cannot update this profile' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Example 4: Get User with Permission
// ============================================================================

/**
 * Invite team member - requires permission and returns current user
 */
export async function inviteTeamMemberAction(email: string) {
  try {
    // Get current user and verify permission in one call
    const currentUser = await requireUserWithPermission(PERMISSIONS.team.invite);

    // TODO: Send invitation
    // await sendTeamInvitation({
    //   email,
    //   invitedBy: currentUser.id,
    // });

    return {
      success: true,
      message: `Invitation sent to ${email}`,
      invitedBy: currentUser.name,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: 'You must be logged in' };
    }
    if (error instanceof ForbiddenError) {
      return { success: false, error: 'You do not have permission to invite team members' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Example 5: Change User Role (Admin Only)
// ============================================================================

/**
 * Change a user's role - requires users:changeRole permission
 */
export async function changeUserRoleAction(userId: string, newRole: UserRole) {
  try {
    await requirePermission(PERMISSIONS.users.changeRole);

    // TODO: Update user role
    // await db.update(users).set({ role: newRole }).where(eq(users.id, userId));

    return {
      success: true,
      message: `User role changed to ${newRole}`,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: 'You must be logged in' };
    }
    if (error instanceof ForbiddenError) {
      return { success: false, error: 'Only owners can change user roles' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Example 6: Content Management
// ============================================================================

/**
 * Publish content - requires content:publish permission
 */
export async function publishContentAction(contentId: string) {
  try {
    await requirePermission(PERMISSIONS.content.publish);

    // TODO: Publish content
    // await db.update(content).set({ published: true }).where(eq(content.id, contentId));

    return {
      success: true,
      message: 'Content published successfully',
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: 'You must be logged in' };
    }
    if (error instanceof ForbiddenError) {
      return { success: false, error: 'Only coaches and owners can publish content' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}
