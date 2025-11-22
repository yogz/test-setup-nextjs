/**
 * RBAC (Role-Based Access Control) - Permission Definitions
 *
 * This module defines all permissions and role-permission mappings.
 * Centralized permission management for the entire application.
 */

import { UserRole } from '@/lib/validations/auth';

// ============================================================================
// Permission Definitions
// ============================================================================

/**
 * All available permissions in the system
 * Organized by resource for better maintainability
 */
export const PERMISSIONS = {
  // User Management
  users: {
    view: 'users:view' as const,
    viewAll: 'users:view_all' as const,
    create: 'users:create' as const,
    update: 'users:update' as const,
    updateOwn: 'users:update_own' as const,
    delete: 'users:delete' as const,
    changeRole: 'users:change_role' as const,
  },

  // Profile Management
  profile: {
    view: 'profile:view' as const,
    viewOwn: 'profile:view_own' as const,
    update: 'profile:update' as const,
    updateOwn: 'profile:update_own' as const,
    delete: 'profile:delete' as const,
  },

  // Team Management
  team: {
    view: 'team:view' as const,
    create: 'team:create' as const,
    update: 'team:update' as const,
    delete: 'team:delete' as const,
    invite: 'team:invite' as const,
    removeMember: 'team:remove_member' as const,
  },

  // Content Management
  content: {
    view: 'content:view' as const,
    create: 'content:create' as const,
    update: 'content:update' as const,
    updateOwn: 'content:update_own' as const,
    delete: 'content:delete' as const,
    deleteOwn: 'content:delete_own' as const,
    publish: 'content:publish' as const,
  },

  // Settings
  settings: {
    view: 'settings:view' as const,
    viewOwn: 'settings:view_own' as const,
    update: 'settings:update' as const,
    updateOwn: 'settings:update_own' as const,
  },

  // Analytics
  analytics: {
    view: 'analytics:view' as const,
    viewOwn: 'analytics:view_own' as const,
    export: 'analytics:export' as const,
  },

  // Gym Domain
  bookings: {
    view: 'bookings:view' as const,
    viewOwn: 'bookings:view_own' as const,
    create: 'bookings:create' as const,
    cancel: 'bookings:cancel' as const,
    cancelOwn: 'bookings:cancel_own' as const,
  },
  sessions: {
    view: 'sessions:view' as const,
    viewOwn: 'sessions:view_own' as const,
    confirm: 'sessions:confirm' as const,
    comment: 'sessions:comment' as const,
  },
  availability: {
    view: 'availability:view' as const,
    update: 'availability:update' as const,
    updateOwn: 'availability:update_own' as const,
  },
} as const;

// ============================================================================
// Permission Types
// ============================================================================

type PermissionCategory = typeof PERMISSIONS;
type PermissionValues<T> = T extends Record<string, infer U> ? U : never;
type AllPermissions = PermissionValues<PermissionCategory[keyof PermissionCategory]>;

export type Permission = AllPermissions;

// ============================================================================
// Role Permission Mappings
// ============================================================================

/**
 * Defines which permissions each role has
 * This is the single source of truth for role capabilities
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  /**
   * MEMBER - Basic user
   * - Can manage own profile and content
   * - Can view team content
   * - Limited to own resources
   */
  member: [
    PERMISSIONS.profile.viewOwn,
    PERMISSIONS.profile.updateOwn,
    PERMISSIONS.users.updateOwn,
    PERMISSIONS.content.view,
    PERMISSIONS.content.create,
    PERMISSIONS.content.updateOwn,
    PERMISSIONS.content.deleteOwn,
    PERMISSIONS.team.view,
    PERMISSIONS.settings.viewOwn,
    PERMISSIONS.settings.updateOwn,
    PERMISSIONS.analytics.viewOwn,

    // Gym permissions
    PERMISSIONS.bookings.viewOwn,
    PERMISSIONS.bookings.create,
    PERMISSIONS.bookings.cancelOwn,
    PERMISSIONS.sessions.viewOwn,
    PERMISSIONS.sessions.comment,
    PERMISSIONS.availability.view,
  ] as const,

  /**
   * COACH - Team leader
   * - All member permissions
   * - Can manage team members
   * - Can view all content and analytics
   * - Can publish content
   */
  coach: [
    // Member permissions
    PERMISSIONS.profile.viewOwn,
    PERMISSIONS.profile.updateOwn,
    PERMISSIONS.users.updateOwn,
    PERMISSIONS.content.view,
    PERMISSIONS.content.create,
    PERMISSIONS.content.updateOwn,
    PERMISSIONS.content.deleteOwn,
    PERMISSIONS.team.view,
    PERMISSIONS.settings.viewOwn,
    PERMISSIONS.settings.updateOwn,
    PERMISSIONS.analytics.viewOwn,

    // Additional coach permissions
    PERMISSIONS.users.view,
    PERMISSIONS.users.viewAll,
    PERMISSIONS.profile.view,
    PERMISSIONS.team.invite,
    PERMISSIONS.content.update,
    PERMISSIONS.content.delete,
    PERMISSIONS.content.publish,
    PERMISSIONS.analytics.view,
    PERMISSIONS.analytics.export,

    // Gym permissions
    PERMISSIONS.bookings.view,
    PERMISSIONS.bookings.create,
    PERMISSIONS.bookings.cancel,
    PERMISSIONS.sessions.view,
    PERMISSIONS.sessions.confirm,
    PERMISSIONS.sessions.comment,
    PERMISSIONS.availability.view,
    PERMISSIONS.availability.updateOwn,
  ] as const,

  /**
   * OWNER - Full administrator
   * - All coach permissions
   * - Can manage all users and roles
   * - Can manage system settings
   * - Full access to everything
   */
  owner: [
    // Member permissions
    PERMISSIONS.profile.viewOwn,
    PERMISSIONS.profile.updateOwn,
    PERMISSIONS.users.updateOwn,
    PERMISSIONS.content.view,
    PERMISSIONS.content.create,
    PERMISSIONS.content.updateOwn,
    PERMISSIONS.content.deleteOwn,
    PERMISSIONS.team.view,
    PERMISSIONS.settings.viewOwn,
    PERMISSIONS.settings.updateOwn,
    PERMISSIONS.analytics.viewOwn,

    // Coach permissions
    PERMISSIONS.users.view,
    PERMISSIONS.users.viewAll,
    PERMISSIONS.profile.view,
    PERMISSIONS.team.invite,
    PERMISSIONS.content.update,
    PERMISSIONS.content.delete,
    PERMISSIONS.content.publish,
    PERMISSIONS.analytics.view,
    PERMISSIONS.analytics.export,

    // Gym permissions
    PERMISSIONS.bookings.view,
    PERMISSIONS.bookings.create,
    PERMISSIONS.bookings.cancel,
    PERMISSIONS.sessions.view,
    PERMISSIONS.sessions.confirm,
    PERMISSIONS.sessions.comment,
    PERMISSIONS.availability.view,
    PERMISSIONS.availability.updateOwn,

    // Owner-only permissions
    PERMISSIONS.users.create,
    PERMISSIONS.users.update,
    PERMISSIONS.users.delete,
    PERMISSIONS.users.changeRole,
    PERMISSIONS.profile.update,
    PERMISSIONS.profile.delete,
    PERMISSIONS.team.create,
    PERMISSIONS.team.update,
    PERMISSIONS.team.delete,
    PERMISSIONS.team.removeMember,
    PERMISSIONS.settings.view,
    PERMISSIONS.settings.update,
    PERMISSIONS.availability.update, // Owner can update anyone's availability
  ] as const,
};

// ============================================================================
// Role Hierarchy
// ============================================================================

/**
 * Role hierarchy levels
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  member: 1,
  coach: 2,
  owner: 3,
} as const;
