/**
 * RBAC Utility Functions
 *
 * Helper functions for checking permissions and roles.
 * Can be used on both client and server side.
 */

import { UserRole } from '@/lib/validations/auth';
import { Permission, ROLE_PERMISSIONS, ROLE_HIERARCHY } from './permissions';

// ============================================================================
// Permission Checking
// ============================================================================

/**
 * Check if a role has a specific permission
 *
 * @example
 * hasPermission('member', PERMISSIONS.users.delete) // false
 * hasPermission('owner', PERMISSIONS.users.delete) // true
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions
 *
 * @example
 * hasAnyPermission('coach', [
 *   PERMISSIONS.users.delete,
 *   PERMISSIONS.users.view
 * ]) // true (has users.view)
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has ALL of the specified permissions
 *
 * @example
 * hasAllPermissions('coach', [
 *   PERMISSIONS.users.view,
 *   PERMISSIONS.users.delete
 * ]) // false (doesn't have users.delete)
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 *
 * @example
 * getRolePermissions('member')
 * // ['profile:view_own', 'profile:update_own', ...]
 */
export function getRolePermissions(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

// ============================================================================
// Role Hierarchy Checking
// ============================================================================

/**
 * Check if a role is at least a certain level
 * Hierarchy: member (1) < coach (2) < owner (3)
 *
 * @example
 * isRoleAtLeast('coach', 'member') // true
 * isRoleAtLeast('member', 'coach') // false
 * isRoleAtLeast('coach', 'coach') // true
 */
export function isRoleAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a role is higher than another role
 *
 * @example
 * isRoleHigherThan('coach', 'member') // true
 * isRoleHigherThan('member', 'coach') // false
 * isRoleHigherThan('coach', 'coach') // false
 */
export function isRoleHigherThan(userRole: UserRole, compareRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[compareRole];
}

/**
 * Get the hierarchy level of a role
 *
 * @example
 * getRoleLevel('member') // 1
 * getRoleLevel('coach') // 2
 * getRoleLevel('owner') // 3
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role];
}

// ============================================================================
// Resource Ownership Checking
// ============================================================================

/**
 * Check if user can access a resource based on ownership
 *
 * @param userRole - The user's role
 * @param userId - The user's ID
 * @param resourceOwnerId - The ID of the resource owner
 * @param permission - The permission to check
 * @param ownPermission - The "own" version of the permission (if different from permission)
 *
 * @example
 * // User trying to update their own profile
 * canAccessResource(
 *   'member',
 *   'user-123',
 *   'user-123',
 *   PERMISSIONS.profile.update,
 *   PERMISSIONS.profile.updateOwn
 * ) // true
 *
 * // User trying to update someone else's profile
 * canAccessResource(
 *   'member',
 *   'user-123',
 *   'user-456',
 *   PERMISSIONS.profile.update,
 *   PERMISSIONS.profile.updateOwn
 * ) // false
 */
export function canAccessResource(
  userRole: UserRole,
  userId: string,
  resourceOwnerId: string,
  permission: Permission,
  ownPermission?: Permission
): boolean {
  // Check if user has the general permission
  if (hasPermission(userRole, permission)) {
    return true;
  }

  // Check if user owns the resource and has the "own" permission
  if (ownPermission && userId === resourceOwnerId) {
    return hasPermission(userRole, ownPermission);
  }

  return false;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get a human-readable role name
 *
 * @example
 * getRoleName('member') // 'Member'
 * getRoleName('coach') // 'Coach'
 */
export function getRoleName(role: UserRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Get all available roles sorted by hierarchy
 *
 * @example
 * getAllRoles() // ['member', 'coach', 'owner']
 */
export function getAllRoles(): UserRole[] {
  return Object.keys(ROLE_HIERARCHY).sort(
    (a, b) => ROLE_HIERARCHY[a as UserRole] - ROLE_HIERARCHY[b as UserRole]
  ) as UserRole[];
}

/**
 * Get roles that are lower than the given role
 *
 * @example
 * getLowerRoles('coach') // ['member']
 * getLowerRoles('member') // []
 */
export function getLowerRoles(role: UserRole): UserRole[] {
  const userLevel = ROLE_HIERARCHY[role];
  return getAllRoles().filter((r) => ROLE_HIERARCHY[r] < userLevel);
}

/**
 * Get roles that are higher than or equal to the given role
 *
 * @example
 * getRolesAtLeast('coach') // ['coach', 'owner']
 */
export function getRolesAtLeast(role: UserRole): UserRole[] {
  const userLevel = ROLE_HIERARCHY[role];
  return getAllRoles().filter((r) => ROLE_HIERARCHY[r] >= userLevel);
}
