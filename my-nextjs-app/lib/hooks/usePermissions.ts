'use client';

/**
 * RBAC Client-Side React Hook
 *
 * Hook for checking permissions in React components.
 * Use this to show/hide UI elements based on user permissions.
 */

import { useSession } from '@/lib/auth/client';
import { UserRole } from '@/lib/validations/auth';
import { Permission } from '@/lib/rbac/permissions';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleAtLeast,
  isRoleHigherThan,
  getRolePermissions,
  canAccessResource,
} from '@/lib/rbac/utils';

export interface UsePermissionsReturn {
  /**
   * The user's role
   */
  role: UserRole;

  /**
   * The user's ID
   */
  userId: string | undefined;

  /**
   * Check if user has a specific permission
   */
  can: (permission: Permission) => boolean;

  /**
   * Check if user has ANY of the specified permissions
   */
  canAny: (permissions: Permission[]) => boolean;

  /**
   * Check if user has ALL of the specified permissions
   */
  canAll: (permissions: Permission[]) => boolean;

  /**
   * Check if user's role is at least the specified role
   */
  isAtLeast: (requiredRole: UserRole) => boolean;

  /**
   * Check if user's role is higher than the specified role
   */
  isHigherThan: (compareRole: UserRole) => boolean;

  /**
   * Check if user can access a resource (with ownership check)
   */
  canAccessResource: (
    resourceOwnerId: string,
    permission: Permission,
    ownPermission?: Permission
  ) => boolean;

  /**
   * Get all permissions for the user's role
   */
  permissions: readonly Permission[];

  /**
   * Loading state
   */
  isLoading: boolean;
}

/**
 * Hook for checking permissions in React components
 *
 * @example
 * function MyComponent() {
 *   const { can, isAtLeast, isLoading } = usePermissions();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *
 *   return (
 *     <>
 *       {can(PERMISSIONS.users.delete) && <DeleteButton />}
 *       {isAtLeast('coach') && <CoachDashboard />}
 *     </>
 *   );
 * }
 */
export function usePermissions(): UsePermissionsReturn {
  const { data: session, isPending } = useSession();

  // Better Auth includes additionalFields in the user type
  const user = session?.user as any;
  const role = (user?.role as UserRole) || 'member';
  const userId = user?.id;

  return {
    role,
    userId,
    isLoading: isPending,

    can: (permission: Permission) => {
      return hasPermission(role, permission);
    },

    canAny: (permissions: Permission[]) => {
      return hasAnyPermission(role, permissions);
    },

    canAll: (permissions: Permission[]) => {
      return hasAllPermissions(role, permissions);
    },

    isAtLeast: (requiredRole: UserRole) => {
      return isRoleAtLeast(role, requiredRole);
    },

    isHigherThan: (compareRole: UserRole) => {
      return isRoleHigherThan(role, compareRole);
    },

    canAccessResource: (
      resourceOwnerId: string,
      permission: Permission,
      ownPermission?: Permission
    ) => {
      if (!userId) return false;
      return canAccessResource(role, userId, resourceOwnerId, permission, ownPermission);
    },

    permissions: getRolePermissions(role),
  };
}

/**
 * Hook to check if user has a specific role
 *
 * @example
 * function AdminPanel() {
 *   const isOwner = useRole('owner');
 *
 *   if (!isOwner) return <Forbidden />;
 *
 *   return <AdminContent />;
 * }
 */
export function useRole(requiredRole: UserRole): boolean {
  const { isAtLeast } = usePermissions();
  return isAtLeast(requiredRole);
}

/**
 * Hook to check if user has a specific permission
 *
 * @example
 * function DeleteUserButton({ userId }: { userId: string }) {
 *   const canDelete = usePermission(PERMISSIONS.users.delete);
 *
 *   if (!canDelete) return null;
 *
 *   return <Button onClick={() => deleteUser(userId)}>Delete</Button>;
 * }
 */
export function usePermission(permission: Permission): boolean {
  const { can } = usePermissions();
  return can(permission);
}
