# RBAC Quick Start Guide

Quick reference for using the RBAC system in your app.

## File Structure

```
lib/
├── rbac/
│   ├── permissions.ts     # All permissions & role mappings
│   ├── utils.ts           # Helper functions
│   ├── guards.ts          # Server-side protection
│   ├── index.ts           # Main export
│   ├── README.md          # Full documentation
│   └── QUICK_START.md     # This file
├── hooks/
│   └── usePermissions.ts  # React hooks
└── validations/
    └── auth.ts            # UserRole type exported here

app/
├── actions/
│   └── user-actions.ts    # Example server actions
└── components/
    └── examples/
        └── rbac-example.tsx  # Example React components
```

## Quick Reference

### Import What You Need

```typescript
// Client-side (React components)
import { usePermissions } from '@/lib/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/rbac/permissions';

// Server-side (Server actions, API routes)
import { requirePermission, requireRole } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
```

### Client-Side Usage

```tsx
'use client';

function MyComponent() {
  const { can, isAtLeast, isLoading } = usePermissions();

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      {/* Permission check */}
      {can(PERMISSIONS.users.delete) && <DeleteButton />}

      {/* Role check */}
      {isAtLeast('coach') && <CoachPanel />}
    </>
  );
}
```

### Server-Side Usage

```typescript
'use server';

export async function deleteUser(userId: string) {
  // Check permission (throws error if not allowed)
  await requirePermission(PERMISSIONS.users.delete);

  // Your logic here
  await db.delete(users).where(eq(users.id, userId));

  return { success: true };
}

export async function adminAction() {
  // Check role (throws error if not allowed)
  await requireRole('owner');

  // Your logic here
}
```

## Common Patterns

### 1. Hide Button Based on Permission

```tsx
{can(PERMISSIONS.users.delete) && (
  <button onClick={() => deleteUser(userId)}>
    Delete
  </button>
)}
```

### 2. Show Section for Role

```tsx
{isAtLeast('coach') && (
  <div>
    <h2>Coach Dashboard</h2>
    {/* Coach-only content */}
  </div>
)}
```

### 3. Protected Server Action

```typescript
export async function myAction() {
  await requirePermission(PERMISSIONS.something);
  // ... your code
}
```

### 4. Protected API Route

```typescript
export async function POST(req: Request) {
  try {
    await requireRole('owner');
    // ... your code
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    // ... handle other errors
  }
}
```

### 5. Resource Ownership Check

```typescript
// User can edit if they:
// 1. Have profile:update permission (coach/owner), OR
// 2. Own the profile AND have profile:updateOwn (member)

await requireResourceAccess(
  profileUserId,
  PERMISSIONS.profile.update,
  PERMISSIONS.profile.updateOwn
);
```

## Available Permissions

```typescript
PERMISSIONS.users.view
PERMISSIONS.users.viewAll
PERMISSIONS.users.create
PERMISSIONS.users.update
PERMISSIONS.users.updateOwn
PERMISSIONS.users.delete
PERMISSIONS.users.changeRole

PERMISSIONS.profile.view
PERMISSIONS.profile.viewOwn
PERMISSIONS.profile.update
PERMISSIONS.profile.updateOwn
PERMISSIONS.profile.delete

PERMISSIONS.team.view
PERMISSIONS.team.create
PERMISSIONS.team.update
PERMISSIONS.team.delete
PERMISSIONS.team.invite
PERMISSIONS.team.removeMember

PERMISSIONS.content.view
PERMISSIONS.content.create
PERMISSIONS.content.update
PERMISSIONS.content.updateOwn
PERMISSIONS.content.delete
PERMISSIONS.content.deleteOwn
PERMISSIONS.content.publish

PERMISSIONS.settings.view
PERMISSIONS.settings.viewOwn
PERMISSIONS.settings.update
PERMISSIONS.settings.updateOwn

PERMISSIONS.analytics.view
PERMISSIONS.analytics.viewOwn
PERMISSIONS.analytics.export
```

## Role Capabilities

### Member (Level 1)
- Manage own profile and content
- View team content
- View own analytics

### Coach (Level 2)
- All Member permissions
- View and manage team
- Manage all content
- View all analytics
- Invite members

### Owner (Level 3)
- All Coach permissions
- Manage user roles
- Delete users
- System settings
- Full admin access

## Hook API

```typescript
const {
  role,              // Current user's role
  userId,            // Current user's ID
  can,               // Check single permission
  canAny,            // Check any of permissions
  canAll,            // Check all permissions
  isAtLeast,         // Check role level
  isHigherThan,      // Check if role is higher
  canAccessResource, // Check resource ownership
  permissions,       // All user's permissions
  isLoading,         // Loading state
} = usePermissions();
```

## Server Guards

```typescript
// Get session/user
await requireSession()         // Get session or throw
await requireUser()           // Get user or throw
await getUserRole()           // Get role or throw

// Check permissions
await requirePermission(perm)
await requireAnyPermission([perm1, perm2])
await requireAllPermissions([perm1, perm2])

// Check roles
await requireRole('coach')
await requireAnyRole(['coach', 'owner'])

// Check resource access
await requireResourceAccess(ownerId, perm, ownPerm)

// Combined
await requireUserWithPermission(perm)  // Returns user
await requireUserWithRole('coach')     // Returns user
```

## Error Handling

Server guards throw these errors:

```typescript
UnauthorizedError  // User not logged in (401)
ForbiddenError     // User lacks permission (403)
```

Handle them in server actions:

```typescript
try {
  await requirePermission(PERMISSIONS.users.delete);
  // ... your code
  return { success: true };
} catch (error) {
  if (error instanceof UnauthorizedError) {
    return { error: 'Please log in' };
  }
  if (error instanceof ForbiddenError) {
    return { error: 'Permission denied' };
  }
  throw error;
}
```

## Examples

See these files for complete examples:
- `app/actions/user-actions.ts` - Server action examples
- `components/examples/rbac-example.tsx` - React component examples
- `lib/rbac/README.md` - Full documentation

## Adding New Permissions

1. Add to `lib/rbac/permissions.ts`:
   ```typescript
   export const PERMISSIONS = {
     myResource: {
       action: 'myResource:action' as const,
     },
   };
   ```

2. Add to role mappings:
   ```typescript
   export const ROLE_PERMISSIONS = {
     owner: [
       // ... existing
       PERMISSIONS.myResource.action,
     ],
   };
   ```

3. Use it:
   ```typescript
   {can(PERMISSIONS.myResource.action) && <MyButton />}
   await requirePermission(PERMISSIONS.myResource.action);
   ```

## Tips

1. **Always protect server-side** - Client checks are UX only
2. **Use ownership checks** - Don't just check roles
3. **Fail securely** - Deny by default
4. **Use TypeScript** - Get autocomplete for permissions
5. **Check examples** - See `user-actions.ts` and `rbac-example.tsx`
