import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

export default async function DashboardPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="bg-card p-6 rounded-lg border">
        <p className="text-muted-foreground mb-4">
          Welcome back, {session.user.name || session.user.email}!
        </p>
        {session.user.name && (
          <p className="text-sm text-muted-foreground mb-2">
            Name: {session.user.name}
          </p>
        )}
        <p className="text-sm text-muted-foreground mb-2">
          Email: {session.user.email}
        </p>
        <p className="text-sm text-muted-foreground">
          Member since: {new Date(session.user.createdAt || Date.now()).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
