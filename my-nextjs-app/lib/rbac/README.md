# RBAC System Documentation

A complete Role-Based Access Control (RBAC) system for managing permissions across your application.

## Table of Contents

- [Overview](#overview)
- [Roles](#roles)
- [Permissions](#permissions)
- [Usage Examples](#usage-examples)
  - [Client-Side (React Components)](#client-side-react-components)
  - [Server-Side (Server Actions)](#server-side-server-actions)
  - [API Routes](#api-routes)
- [File Structure](#file-structure)

## Overview

This RBAC system provides:

- **3 Roles**: Member, Coach, Owner (hierarchical)
- **Type-safe permissions**: Full TypeScript support
- **Client & Server**: Works in both React components and server actions
- **Resource ownership**: Check if users can access their own resources
- **Easy to extend**: Add new permissions and roles easily

## Roles

### Member (Level 1)
Basic user with limited permissions:
- Manage own profile
- Create and manage own content
- View team content
- View own analytics

### Coach (Level 2)
Team leader with extended permissions:
- All Member permissions
- View and manage team members
- Manage all content
- View all analytics
- Invite team members

### Owner (Level 3)
Full administrator:
- All Coach permissions
- Manage user roles
- Delete users
- Manage system settings
- Full access to everything

## Permissions

Permissions are organized by resource:

```typescript
import { PERMISSIONS } from '@/lib/rbac/permissions';

// Users
PERMISSIONS.users.view
PERMISSIONS.users.create
PERMISSIONS.users.update
PERMISSIONS.users.delete
PERMISSIONS.users.changeRole

// Profile
PERMISSIONS.profile.viewOwn
PERMISSIONS.profile.updateOwn
PERMISSIONS.profile.update
PERMISSIONS.profile.delete

// Team
PERMISSIONS.team.view
PERMISSIONS.team.invite
PERMISSIONS.team.removeMember

// Content
PERMISSIONS.content.view
PERMISSIONS.content.create
PERMISSIONS.content.update
PERMISSIONS.content.delete
PERMISSIONS.content.publish

// And more...
```

## Usage Examples

### Client-Side (React Components)

#### Basic Permission Check

```tsx
'use client';

import { usePermissions } from '@/lib/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export function UserActions() {
  const { can, isLoading } = usePermissions();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {can(PERMISSIONS.users.delete) && (
        <button>Delete User</button>
      )}

      {can(PERMISSIONS.users.create) && (
        <button>Create User</button>
      )}
    </div>
  );
}
```

#### Role-Based Rendering

```tsx
'use client';

import { usePermissions } from '@/lib/hooks/usePermissions';

export function Dashboard() {
  const { isAtLeast, role } = usePermissions();

  return (
    <div>
      <h1>Dashboard - {role}</h1>

      {/* Everyone sees this */}
      <MemberDashboard />

      {/* Coach and Owner see this */}
      {isAtLeast('coach') && <CoachPanel />}

      {/* Only Owner sees this */}
      {isAtLeast('owner') && <AdminPanel />}
    </div>
  );
}
```

#### Resource Ownership Check

```tsx
'use client';

import { usePermissions } from '@/lib/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export function ProfileActions({ profile }: { profile: Profile }) {
  const { canAccessResource } = usePermissions();

  const canEdit = canAccessResource(
    profile.userId,
    PERMISSIONS.profile.update,
    PERMISSIONS.profile.updateOwn
  );

  return (
    <div>
      {canEdit && <button>Edit Profile</button>}
    </div>
  );
}
```

#### Using Individual Hooks

```tsx
'use client';

import { useRole, usePermission } from '@/lib/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export function AdminButton() {
  const isOwner = useRole('owner');
  const canDelete = usePermission(PERMISSIONS.users.delete);

  if (!isOwner || !canDelete) return null;

  return <button>Admin Action</button>;
}
```

### Server-Side (Server Actions)

#### Basic Permission Guard

```typescript
'use server';

import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export async function deleteUser(userId: string) {
  // Throws ForbiddenError if user doesn't have permission
  await requirePermission(PERMISSIONS.users.delete);

  // Continue with deletion...
  await db.delete(users).where(eq(users.id, userId));

  return { success: true };
}
```

#### Role Guard

```typescript
'use server';

import { requireRole } from '@/lib/rbac/guards';

export async function adminDashboardData() {
  // Only owners can access this
  await requireRole('owner');

  // Fetch admin data...
  const data = await db.query.users.findMany();

  return data;
}
```

#### Resource Ownership Guard

```typescript
'use server';

import { requireResourceAccess } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export async function updateProfile(userId: string, data: ProfileData) {
  // User can update if they:
  // 1. Have PERMISSIONS.profile.update (coach/owner), OR
  // 2. Own the profile AND have PERMISSIONS.profile.updateOwn (member)
  await requireResourceAccess(
    userId,
    PERMISSIONS.profile.update,
    PERMISSIONS.profile.updateOwn
  );

  // Update the profile...
  await db.update(users).set(data).where(eq(users.id, userId));

  return { success: true };
}
```

#### Get User with Permission

```typescript
'use server';

import { requireUserWithPermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export async function createTeam(teamData: TeamData) {
  // Get current user and verify permission in one call
  const currentUser = await requireUserWithPermission(
    PERMISSIONS.team.create
  );

  // Create team with current user as owner
  const team = await db.insert(teams).values({
    ...teamData,
    ownerId: currentUser.id,
  });

  return team;
}
```

#### Multiple Permission Checks

```typescript
'use server';

import { requireAllPermissions, requireAnyPermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export async function publishContent(contentId: string) {
  // Require ALL of these permissions
  await requireAllPermissions([
    PERMISSIONS.content.update,
    PERMISSIONS.content.publish,
  ]);

  // Or require ANY of these permissions
  await requireAnyPermission([
    PERMISSIONS.content.publish,
    PERMISSIONS.team.update,
  ]);

  // Publish the content...
}
```

#### Error Handling

```typescript
'use server';

import { requirePermission, UnauthorizedError, ForbiddenError } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export async function sensitiveAction() {
  try {
    await requirePermission(PERMISSIONS.users.delete);
    // Perform action...
    return { success: true };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { error: 'Please log in to continue' };
    }
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission for this action' };
    }
    throw error;
  }
}
```

### API Routes

#### Protected API Route

```typescript
// app/api/admin/users/route.ts
import { NextRequest } from 'next/server';
import { requirePermission, UnauthorizedError, ForbiddenError } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.users.delete);

    const { userId } = await request.json();
    await db.delete(users).where(eq(users.id, userId));

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (error instanceof ForbiddenError) {
      return Response.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Role-Based API Route

```typescript
// app/api/coach/analytics/route.ts
import { requireRole } from '@/lib/rbac/guards';

export async function GET() {
  try {
    // Only coaches and owners can access
    await requireRole('coach');

    const analytics = await getCoachAnalytics();

    return Response.json(analytics);
  } catch (error) {
    // Handle errors...
  }
}
```

## File Structure

```
lib/
├── rbac/
│   ├── permissions.ts      # Permission definitions & role mappings
│   ├── utils.ts           # Permission checking utilities
│   ├── guards.ts          # Server-side guards
│   └── README.md          # This file
└── hooks/
    └── usePermissions.ts  # Client-side React hooks
```

## Adding New Permissions

1. Add permission to `PERMISSIONS` object in `permissions.ts`:

```typescript
export const PERMISSIONS = {
  // ... existing permissions
  billing: {
    view: 'billing:view' as const,
    update: 'billing:update' as const,
  },
} as const;
```

2. Add to appropriate roles in `ROLE_PERMISSIONS`:

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  owner: [
    // ... existing permissions
    PERMISSIONS.billing.view,
    PERMISSIONS.billing.update,
  ] as const,
};
```

3. Use in your code:

```typescript
// Client
const { can } = usePermissions();
{can(PERMISSIONS.billing.view) && <BillingPanel />}

// Server
await requirePermission(PERMISSIONS.billing.update);
```

## Best Practices

1. **Always check permissions on the server** - Client-side checks are for UX only
2. **Use resource ownership checks** - Don't just check roles, check ownership too
3. **Fail securely** - Deny by default, allow explicitly
4. **Centralize permissions** - Don't hardcode permission strings
5. **Document role changes** - Keep this README updated when adding permissions
