'use client';

import { useSession } from '@/lib/auth/client';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { can } = usePermissions();

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sex, setSex] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!isPending && !session) {
      router.push('/');
      return;
    }

    // Check if user needs to complete onboarding
    if (session?.user && !(session.user as any).hasCompletedOnboarding) {
      router.push('/onboarding');
      return;
    }

    // Initialize form with user data
    if (session?.user) {
      setName(session.user.name || '');
      setDateOfBirth((session.user as any).dateOfBirth || '');
      setSex((session.user as any).sex || '');
      setPhone((session.user as any).phone || '');
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/');
        },
      },
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          dateOfBirth,
          sex,
          phone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSaveMessage('Profile updated successfully!');
      setIsEditing(false);

      // Refresh the session to get updated data
      window.location.reload();
    } catch (error: any) {
      setSaveMessage(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to current session data
    if (session?.user) {
      setName(session.user.name || '');
      setDateOfBirth((session.user as any).dateOfBirth || '');
      setSex((session.user as any).sex || '');
      setPhone((session.user as any).phone || '');
    }
    setIsEditing(false);
    setSaveMessage('');
  };

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </main>
    );
  }

  // Don't render dashboard content if not authenticated
  if (!session) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col p-4 sm:p-6 md:p-8 bg-gray-50">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back, {session.user.name || session.user.email}!</p>
          </div>
          <Button
            onClick={handleSignOut}
            className="w-full sm:w-auto"
          >
            Sign Out
          </Button>
        </header>

        {/* Profile Section */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-xl sm:text-2xl">Profile Information</CardTitle>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
          {saveMessage && (
            <Alert className={`mb-4 ${saveMessage.includes('success') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <AlertDescription className={saveMessage.includes('success') ? 'text-green-800' : 'text-red-800'}>
                {saveMessage}
              </AlertDescription>
            </Alert>
          )}

          {!isEditing ? (
            <div className="flex flex-col md:flex-row gap-8">
              {/* Profile Picture */}
              <div className="flex flex-col items-center md:items-start">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4">
                  {session.user.image ? (
                    <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                      {session.user.name?.[0]?.toUpperCase() || session.user.email[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* User Information Display */}
              <div className="space-y-4 flex-1">
                <div>
                  <Label className="text-gray-500">Name</Label>
                  <p className="text-lg mt-1">{session.user.name || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="text-lg mt-1">{session.user.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Date of Birth</Label>
                  <p className="text-lg mt-1">{(session.user as any).dateOfBirth || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Sex</Label>
                  <p className="text-lg mt-1">{(session.user as any).sex || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Phone</Label>
                  <p className="text-lg mt-1">{(session.user as any).phone || 'Not set'}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile}>
              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Picture Display (non-editable) */}
                <div className="flex flex-col items-center md:items-start">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4">
                    {session.user.image ? (
                      <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                        {name?.[0]?.toUpperCase() || session.user.email[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Form */}
                <div className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <Label htmlFor="dashboard-name">Name</Label>
                    <Input
                      id="dashboard-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dashboard-dob">Date of Birth</Label>
                    <Input
                      id="dashboard-dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dashboard-sex">Sex</Label>
                    <Select
                      value={sex}
                      onValueChange={(value) => setSex(value)}
                    >
                      <SelectTrigger className="w-full">
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
                    <Label htmlFor="dashboard-phone">Phone</Label>
                    <Input
                      id="dashboard-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value;

                        // Allow user to enter any format, just ensure it starts with +
                        if (value.length === 0) {
                          setPhone('');
                        } else if (value.startsWith('+')) {
                          // User is entering international format, allow it as-is
                          setPhone(value);
                        } else if (value.startsWith('0') && value.replace(/\D/g, '').length <= 10) {
                          // French format starting with 0, auto-convert to +33
                          const digits = value.replace(/\D/g, '');
                          if (digits.startsWith('0')) {
                            const formatted = '+33 ' + digits.substring(1);
                            setPhone(formatted);
                          } else {
                            setPhone(value);
                          }
                        } else if (!value.includes('+')) {
                          // No + sign, add it
                          setPhone('+' + value);
                        } else {
                          setPhone(value);
                        }
                      }}
                      placeholder="+33 6 12 34 56 78"
                    />
                    <p className="mt-1 text-xs text-gray-500">International format (e.g., +33 6 12 34 56 78, +1 555 123 4567)</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="order-1 sm:order-2"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {(can(PERMISSIONS.users.update) || can(PERMISSIONS.users.updateOwn)) && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Quick Actions</CardTitle>
              <CardDescription>Manage your account and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/users">
                <Button className="w-full sm:w-auto">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {can(PERMISSIONS.users.update) ? 'Manage Users' : 'View My Profile'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Account Info Cards */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium text-gray-600">Email:</span> {session.user.email}</p>
              <p><span className="font-medium text-gray-600">User ID:</span> <span className="text-xs">{session.user.id.slice(0, 16)}...</span></p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium text-gray-600">Expires:</span> {new Date(session.session.expiresAt).toLocaleDateString()}</p>
              <p><span className="font-medium text-gray-600">Created:</span> {new Date(session.user.createdAt).toLocaleDateString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium text-gray-600">Email Verified:</span> {session.user.emailVerified ? '✓ Yes' : '✗ No'}</p>
              <p><span className="font-medium text-gray-600">Account:</span> Active</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
