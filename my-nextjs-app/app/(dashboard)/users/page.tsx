'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth/client';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getEditableUsers, updateUserAction, EditableUser } from '@/app/actions/user-list-actions';
import { UserRole } from '@/lib/validations/auth';

export default function UsersPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const { can, isLoading: permissionsLoading } = usePermissions();

  const [users, setUsers] = useState<EditableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEditSelf, setCanEditSelf] = useState(false);
  const [canEditOthers, setCanEditOthers] = useState(false);

  // Edit state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    dateOfBirth: '',
    sex: '',
    phone: '',
    role: '' as UserRole | '',
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!sessionPending && !session) {
      router.push('/');
      return;
    }

    // Check if user needs to complete onboarding
    if (session?.user && !(session.user as any).hasCompletedOnboarding) {
      router.push('/onboarding');
      return;
    }
  }, [session, sessionPending, router]);

  useEffect(() => {
    if (!session) return;

    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);
        const result = await getEditableUsers();

        if (result.success && result.users) {
          setUsers(result.users);
          setCanEditSelf(result.canEditSelf || false);
          setCanEditOthers(result.canEditOthers || false);
        } else {
          setError(result.error || 'Failed to load users');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [session]);

  const handleEdit = (user: EditableUser) => {
    setEditingUserId(user.id);
    setEditForm({
      name: user.name || '',
      dateOfBirth: user.dateOfBirth || '',
      sex: user.sex || '',
      phone: user.phone || '',
      role: user.role as UserRole,
    });
    setSaveMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditForm({
      name: '',
      dateOfBirth: '',
      sex: '',
      phone: '',
      role: '',
    });
    setSaveMessage(null);
  };

  const handleSave = async (userId: string) => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const result = await updateUserAction(userId, {
        name: editForm.name,
        dateOfBirth: editForm.dateOfBirth,
        sex: editForm.sex,
        phone: editForm.phone,
        ...(canEditOthers && editForm.role ? { role: editForm.role } : {}),
      });

      if (result.success) {
        setSaveMessage({ type: 'success', text: 'User updated successfully!' });

        // Refresh the user list
        const refreshResult = await getEditableUsers();
        if (refreshResult.success && refreshResult.users) {
          setUsers(refreshResult.users);
        }

        // Close edit mode after a short delay
        setTimeout(() => {
          setEditingUserId(null);
          setSaveMessage(null);
        }, 1500);
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Failed to update user' });
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'An unexpected error occurred' });
      console.error('Error updating user:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (sessionPending || permissionsLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col p-4 sm:p-6 md:p-8 bg-gray-50">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Users You Can Edit</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {canEditOthers
                ? 'Manage all users in the system'
                : canEditSelf
                  ? 'Manage your own profile'
                  : 'No users available to edit'}
            </p>
          </div>
          <Button onClick={handleBackToDashboard} variant="secondary">
            Back to Dashboard
          </Button>
        </header>

        {/* Info Alert */}
        <Alert className="mb-6">
          <AlertDescription>
            {canEditOthers ? (
              <>
                <strong>Owner Access:</strong> You can edit all users and change their roles.
              </>
            ) : canEditSelf ? (
              <>
                <strong>Member Access:</strong> You can only edit your own profile information.
              </>
            ) : (
              <>
                <strong>Limited Access:</strong> You do not have permission to edit users.
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Error Message */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Loading users...</p>
          </div>
        )}

        {/* Users List */}
        {!loading && users.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No users available to edit.</p>
            </CardContent>
          </Card>
        )}

        {!loading && users.length > 0 && (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg sm:text-xl">
                        {user.name || 'No name set'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {user.email}
                        {session.user.id === user.id && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    {editingUserId !== user.id && (
                      <Button onClick={() => handleEdit(user)} size="sm">
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {saveMessage && editingUserId === user.id && (
                    <Alert
                      className={`mb-4 ${
                        saveMessage.type === 'success'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <AlertDescription
                        className={
                          saveMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                        }
                      >
                        {saveMessage.text}
                      </AlertDescription>
                    </Alert>
                  )}

                  {editingUserId === user.id ? (
                    // Edit Form
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSave(user.id);
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`name-${user.id}`}>Name</Label>
                          <Input
                            id={`name-${user.id}`}
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            placeholder="Enter name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`dob-${user.id}`}>Date of Birth</Label>
                          <Input
                            id={`dob-${user.id}`}
                            type="date"
                            value={editForm.dateOfBirth}
                            onChange={(e) =>
                              setEditForm({ ...editForm, dateOfBirth: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`sex-${user.id}`}>Sex</Label>
                          <Select
                            value={editForm.sex}
                            onValueChange={(value) => setEditForm({ ...editForm, sex: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="non-binary">Non-binary</SelectItem>
                              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`phone-${user.id}`}>Phone</Label>
                          <Input
                            id={`phone-${user.id}`}
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            placeholder="+33 6 12 34 56 78"
                          />
                        </div>

                        {canEditOthers && (
                          <div className="space-y-2">
                            <Label htmlFor={`role-${user.id}`}>Role</Label>
                            <Select
                              value={editForm.role}
                              onValueChange={(value) =>
                                setEditForm({ ...editForm, role: value as UserRole })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select role..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="coach">Coach</SelectItem>
                                <SelectItem value="owner">Owner</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleCancelEdit}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    // Display Mode
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-500 text-sm">Role</Label>
                        <p className="mt-1 capitalize">{user.role}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-sm">Date of Birth</Label>
                        <p className="mt-1">{user.dateOfBirth || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-sm">Sex</Label>
                        <p className="mt-1 capitalize">{user.sex || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-sm">Phone</Label>
                        <p className="mt-1">{user.phone || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-sm">Email Verified</Label>
                        <p className="mt-1">{user.emailVerified ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-sm">Created</Label>
                        <p className="mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
