/**
 * RBAC Server-Side Guards
 *
 * Guards for protecting server actions and API routes.
 * These run on the server and throw errors if permission checks fail.
 */

import { headers } from 'next/headers';
import { auth, AuthUser } from '@/lib/auth/auth';
import { UserRole } from '@/lib/validations/auth';
import { Permission } from './permissions';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleAtLeast,
  canAccessResource,
} from './utils';

// ============================================================================
// Error Classes
// ============================================================================

export class UnauthorizedError extends Error {
  constructor(message = 'You must be logged in to access this resource') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'You do not have permission to access this resource') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// ============================================================================
// Session Helpers
// ============================================================================

/**
 * Get the current session or throw UnauthorizedError
 * Use this at the start of protected server actions/API routes
 *
 * @example
 * export async function deleteUser(userId: string) {
 *   const session = await requireSession();
 *   // ... rest of function
 * }
 */
export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new UnauthorizedError();
  }

  return session;
}

/**
 * Get the current user or throw UnauthorizedError
 *
 * @example
 * export async function updateProfile(data: ProfileData) {
 *   const user = await requireUser();
 *   // ... use user
 * }
 */
export async function requireUser(): Promise<AuthUser> {
  const session = await requireSession();
  return session.user;
}

/**
 * Get the current user's role or throw UnauthorizedError
 *
 * @example
 * export async function someAction() {
 *   const role = await getUserRole();
 *   if (role === 'owner') {
 *     // ... owner-specific logic
 *   }
 * }
 */
export async function getUserRole(): Promise<UserRole> {
  const user = await requireUser();
  return (user.role as UserRole) || 'member';
}

// ============================================================================
// Permission Guards
// ============================================================================

/**
 * Require a specific permission or throw ForbiddenError
 *
 * @example
 * export async function deleteUser(userId: string) {
 *   await requirePermission(PERMISSIONS.users.delete);
 *   // User has permission, continue...
 * }
 */
export async function requirePermission(permission: Permission): Promise<void> {
  const role = await getUserRole();

  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(
      `This action requires the '${permission}' permission`
    );
  }
}

/**
 * Require ANY of the specified permissions or throw ForbiddenError
 *
 * @example
 * await requireAnyPermission([
 *   PERMISSIONS.users.update,
 *   PERMISSIONS.users.delete
 * ]);
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<void> {
  const role = await getUserRole();

  if (!hasAnyPermission(role, permissions)) {
    throw new ForbiddenError(
      'You do not have any of the required permissions'
    );
  }
}

/**
 * Require ALL of the specified permissions or throw ForbiddenError
 *
 * @example
 * await requireAllPermissions([
 *   PERMISSIONS.users.view,
 *   PERMISSIONS.users.update
 * ]);
 */
export async function requireAllPermissions(permissions: Permission[]): Promise<void> {
  const role = await getUserRole();

  if (!hasAllPermissions(role, permissions)) {
    throw new ForbiddenError(
      'You do not have all of the required permissions'
    );
  }
}

// ============================================================================
// Role Guards
// ============================================================================

/**
 * Require a specific role or throw ForbiddenError
 *
 * @example
 * export async function adminAction() {
 *   await requireRole('owner');
 *   // User is owner, continue...
 * }
 */
export async function requireRole(requiredRole: UserRole): Promise<void> {
  const role = await getUserRole();

  if (!isRoleAtLeast(role, requiredRole)) {
    throw new ForbiddenError(
      `This action requires the '${requiredRole}' role or higher`
    );
  }
}

/**
 * Require one of the specified roles or throw ForbiddenError
 *
 * @example
 * await requireAnyRole(['coach', 'owner']);
 */
export async function requireAnyRole(roles: UserRole[]): Promise<void> {
  const userRole = await getUserRole();

  if (!roles.includes(userRole)) {
    throw new ForbiddenError(
      `This action requires one of the following roles: ${roles.join(', ')}`
    );
  }
}

// ============================================================================
// Resource Ownership Guards
// ============================================================================

/**
 * Require permission or ownership of a resource
 *
 * @example
 * export async function updateProfile(userId: string, data: ProfileData) {
 *   await requireResourceAccess(
 *     userId,
 *     PERMISSIONS.profile.update,
 *     PERMISSIONS.profile.updateOwn
 *   );
 *   // User can update this profile
 * }
 */
export async function requireResourceAccess(
  resourceOwnerId: string,
  permission: Permission,
  ownPermission?: Permission
): Promise<void> {
  const user = await requireUser();
  const role = (user.role as UserRole) || 'member';

  if (!canAccessResource(role, user.id, resourceOwnerId, permission, ownPermission)) {
    throw new ForbiddenError(
      'You do not have permission to access this resource'
    );
  }
}

// ============================================================================
// Combined Guards
// ============================================================================

/**
 * Get user and check permission in one call
 * Returns the user if they have permission
 *
 * @example
 * export async function deleteUser(userId: string) {
 *   const currentUser = await requireUserWithPermission(
 *     PERMISSIONS.users.delete
 *   );
 *   // ... use currentUser
 * }
 */
export async function requireUserWithPermission(
  permission: Permission
): Promise<AuthUser> {
  const user = await requireUser();
  const role = (user.role as UserRole) || 'member';

  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(
      `This action requires the '${permission}' permission`
    );
  }

  return user;
}

/**
 * Get user and check role in one call
 * Returns the user if they have the required role
 *
 * @example
 * export async function adminDashboard() {
 *   const admin = await requireUserWithRole('owner');
 *   // ... use admin
 * }
 */
export async function requireUserWithRole(requiredRole: UserRole): Promise<AuthUser> {
  const user = await requireUser();
  const role = (user.role as UserRole) || 'member';

  if (!isRoleAtLeast(role, requiredRole)) {
    throw new ForbiddenError(
      `This action requires the '${requiredRole}' role or higher`
    );
  }

  return user;
}
