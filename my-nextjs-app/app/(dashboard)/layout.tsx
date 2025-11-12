import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/layout/dashboard-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-muted/10">
        <DashboardNav user={session.user} />
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
