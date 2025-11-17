'use client';

import { useSession } from '@/lib/auth/client';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

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
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
          >
            Sign Out
          </button>
        </header>

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Profile Information</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-medium w-full sm:w-auto"
              >
                Edit Profile
              </button>
            )}
          </div>

          {saveMessage && (
            <div className={`mb-4 p-3 rounded-lg ${saveMessage.includes('success') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {saveMessage}
            </div>
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
                  <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                  <p className="text-lg">{session.user.name || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-lg">{session.user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                  <p className="text-lg">{(session.user as any).dateOfBirth || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Sex</label>
                  <p className="text-lg">{(session.user as any).sex || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                  <p className="text-lg">{(session.user as any).phone || 'Not set'}</p>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="+33 6 12 34 56 78"
                    />
                    <p className="mt-1 text-xs text-gray-500">International format (e.g., +33 6 12 34 56 78, +1 555 123 4567)</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors order-2 sm:order-1"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Account Info Cards */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 sm:p-6 bg-white border rounded-xl shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account
            </h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-gray-600">Email:</span> {session.user.email}</p>
              <p><span className="font-medium text-gray-600">User ID:</span> <span className="text-xs">{session.user.id.slice(0, 16)}...</span></p>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-white border rounded-xl shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Session
            </h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-gray-600">Expires:</span> {new Date(session.session.expiresAt).toLocaleDateString()}</p>
              <p><span className="font-medium text-gray-600">Created:</span> {new Date(session.user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-white border rounded-xl shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Status
            </h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-gray-600">Email Verified:</span> {session.user.emailVerified ? '✓ Yes' : '✗ No'}</p>
              <p><span className="font-medium text-gray-600">Account:</span> Active</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
