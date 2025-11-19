'use client';

/**
 * Example React Component with RBAC
 *
 * This file demonstrates how to use RBAC in React components.
 * Copy these patterns for your own components.
 */

import { usePermissions } from '@/lib/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import {
  deleteUserAction,
  inviteTeamMemberAction,
  publishContentAction,
} from '@/app/actions/user-actions';

// ============================================================================
// Example 1: Simple Permission-Based Rendering
// ============================================================================

export function UserActionsExample() {
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">User Actions</h2>

      {/* Only show delete button if user has permission */}
      {can(PERMISSIONS.users.delete) && (
        <button
          onClick={() => deleteUserAction('user-id')}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Delete User
        </button>
      )}

      {/* Only show invite button if user has permission */}
      {can(PERMISSIONS.team.invite) && (
        <button
          onClick={() => inviteTeamMemberAction('new@example.com')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Invite Team Member
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Example 2: Role-Based Dashboard
// ============================================================================

export function DashboardExample() {
  const { isAtLeast, role, isLoading } = usePermissions();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard - {role.toUpperCase()}</h1>

      {/* Everyone sees this */}
      <MemberSection />

      {/* Coach and Owner see this */}
      {isAtLeast('coach') && (
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Coach Tools</h2>
          <CoachSection />
        </div>
      )}

      {/* Only Owner sees this */}
      {isAtLeast('owner') && (
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Admin Panel</h2>
          <AdminSection />
        </div>
      )}
    </div>
  );
}

function MemberSection() {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Your Content</h3>
      <p className="text-gray-600">Manage your personal content here.</p>
    </div>
  );
}

function CoachSection() {
  const { can } = usePermissions();

  return (
    <div className="space-y-2">
      {can(PERMISSIONS.analytics.view) && (
        <div>
          <h4 className="font-medium">Team Analytics</h4>
          <p className="text-gray-600">View team performance metrics.</p>
        </div>
      )}

      {can(PERMISSIONS.content.publish) && (
        <button
          onClick={() => publishContentAction('content-id')}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Publish Content
        </button>
      )}
    </div>
  );
}

function AdminSection() {
  return (
    <div className="space-y-2">
      <h4 className="font-medium">System Settings</h4>
      <p className="text-gray-600">Manage users, roles, and system configuration.</p>
    </div>
  );
}

// ============================================================================
// Example 3: Multiple Permission Checks
// ============================================================================

export function ContentActionsExample() {
  const { canAny, canAll } = usePermissions();

  // Show if user has ANY of these permissions
  const canManageContent = canAny([
    PERMISSIONS.content.update,
    PERMISSIONS.content.delete,
  ]);

  // Show if user has ALL of these permissions
  const canFullyManage = canAll([
    PERMISSIONS.content.update,
    PERMISSIONS.content.delete,
    PERMISSIONS.content.publish,
  ]);

  return (
    <div className="space-y-4">
      {canManageContent && (
        <div className="space-x-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded">
            Edit
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded">
            Delete
          </button>
        </div>
      )}

      {canFullyManage && (
        <button className="px-4 py-2 bg-green-600 text-white rounded">
          Publish
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Example 4: Resource Ownership Check
// ============================================================================

interface ProfileActionsProps {
  profile: {
    id: string;
    userId: string;
    name: string;
  };
}

export function ProfileActionsExample({ profile }: ProfileActionsProps) {
  const { canAccessResource } = usePermissions();

  const canEdit = canAccessResource(
    profile.userId,
    PERMISSIONS.profile.update,
    PERMISSIONS.profile.updateOwn
  );

  const canDelete = canAccessResource(
    profile.userId,
    PERMISSIONS.profile.delete
  );

  return (
    <div className="space-y-4">
      <h3 className="font-bold">{profile.name}</h3>

      <div className="space-x-2">
        {canEdit && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded">
            Edit Profile
          </button>
        )}

        {canDelete && (
          <button className="px-4 py-2 bg-red-600 text-white rounded">
            Delete Profile
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Example 5: Permission-Based Navigation
// ============================================================================

export function NavigationExample() {
  const { can, isAtLeast } = usePermissions();

  return (
    <nav className="space-y-2">
      {/* Everyone can see Dashboard */}
      <a href="/dashboard" className="block px-4 py-2 hover:bg-gray-100">
        Dashboard
      </a>

      {/* Only coaches and owners */}
      {isAtLeast('coach') && (
        <a href="/team" className="block px-4 py-2 hover:bg-gray-100">
          Team Management
        </a>
      )}

      {/* Permission-based */}
      {can(PERMISSIONS.analytics.view) && (
        <a href="/analytics" className="block px-4 py-2 hover:bg-gray-100">
          Analytics
        </a>
      )}

      {/* Only owners */}
      {isAtLeast('owner') && (
        <a href="/admin" className="block px-4 py-2 hover:bg-gray-100">
          Admin Panel
        </a>
      )}
    </nav>
  );
}

// ============================================================================
// Example 6: Conditional Form Fields
// ============================================================================

export function UserFormExample() {
  const { can, isAtLeast } = usePermissions();

  return (
    <form className="space-y-4">
      {/* Everyone can edit these */}
      <input type="text" placeholder="Name" className="border p-2 rounded w-full" />
      <input type="email" placeholder="Email" className="border p-2 rounded w-full" />

      {/* Only coaches and owners see this field */}
      {isAtLeast('coach') && (
        <input type="text" placeholder="Team Name" className="border p-2 rounded w-full" />
      )}

      {/* Only users who can change roles see this */}
      {can(PERMISSIONS.users.changeRole) && (
        <select className="border p-2 rounded w-full">
          <option value="member">Member</option>
          <option value="coach">Coach</option>
          <option value="owner">Owner</option>
        </select>
      )}

      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
        Save
      </button>
    </form>
  );
}
