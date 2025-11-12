'use client';

import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';

export function DashboardNav({ user }: { user: any }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
        <nav className="space-y-2">
          <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-muted transition-colors">
            Overview
          </Link>
          <Link href="/settings" className="block px-3 py-2 rounded hover:bg-muted transition-colors">
            Settings
          </Link>
          <Link href="/profile" className="block px-3 py-2 rounded hover:bg-muted transition-colors">
            Profile
          </Link>
        </nav>
      </div>
      <div className="absolute bottom-0 w-64 p-6 border-t">
        <p className="text-sm text-muted-foreground truncate mb-2">{user.email}</p>
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </>
  );
}
