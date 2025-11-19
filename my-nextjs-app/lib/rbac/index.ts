/**
 * RBAC System - Main Export
 *
 * Central export point for the RBAC system.
 * Import everything you need from here.
 */

// Permissions
export { PERMISSIONS, ROLE_PERMISSIONS, ROLE_HIERARCHY } from './permissions';
export type { Permission } from './permissions';

// Utilities
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  isRoleAtLeast,
  isRoleHigherThan,
  getRoleLevel,
  canAccessResource,
  getRoleName,
  getAllRoles,
  getLowerRoles,
  getRolesAtLeast,
} from './utils';

// Server Guards
export {
  requireSession,
  requireUser,
  getUserRole,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireAnyRole,
  requireResourceAccess,
  requireUserWithPermission,
  requireUserWithRole,
  UnauthorizedError,
  ForbiddenError,
} from './guards';
