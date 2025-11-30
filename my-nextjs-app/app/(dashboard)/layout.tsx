import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    CalendarDays,
    BarChart3,
    LogOut,
    User,
    Dumbbell,
    ClipboardList,
    BookCheck
} from 'lucide-react';
import { SignOutButton } from '@/components/ui/sign-out-button';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect('/');
    }

    const role = session.user.role;

    const NavItems = () => (
        <>
            {/* COACH LINKS */}
            {(role === 'coach' || role === 'owner') && (
                <>
                    <Link href="/coach/dashboard" className="flex flex-col md:flex-row items-center md:gap-2 text-slate-300 hover:text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <LayoutDashboard size={24} className="md:w-5 md:h-5" />
                        <span className="text-[10px] md:text-sm mt-1 md:mt-0">Coach</span>
                    </Link>
                    <Link href="/coach/sessions" className="flex flex-col md:flex-row items-center md:gap-2 text-slate-300 hover:text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <ClipboardList size={24} className="md:w-5 md:h-5" />
                        <span className="text-[10px] md:text-sm mt-1 md:mt-0">Sessions</span>
                    </Link>
                </>
            )}

            {/* MEMBER LINKS - Only show for non-coach users */}
            {role === 'member' && (
                <>
                    <Link href="/schedule" className="flex flex-col md:flex-row items-center md:gap-2 text-slate-300 hover:text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <CalendarDays size={24} className="md:w-5 md:h-5" />
                        <span className="text-[10px] md:text-sm mt-1 md:mt-0">Schedule</span>
                    </Link>

                    <Link href="/bookings" className="flex flex-col md:flex-row items-center md:gap-2 text-slate-300 hover:text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <BookCheck size={24} className="md:w-5 md:h-5" />
                        <span className="text-[10px] md:text-sm mt-1 md:mt-0">Bookings</span>
                    </Link>

                    <Link href="/member/stats" className="flex flex-col md:flex-row items-center md:gap-2 text-slate-300 hover:text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <BarChart3 size={24} className="md:w-5 md:h-5" />
                        <span className="text-[10px] md:text-sm mt-1 md:mt-0">Stats</span>
                    </Link>
                </>
            )}
        </>
    );

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
            {/* DESKTOP SIDEBAR - Hidden on Mobile */}
            <aside className="hidden md:flex w-64 bg-slate-900 text-white p-6 flex-col fixed h-full">
                <div className="mb-8 flex items-center gap-2">
                    <div className="bg-primary/20 p-2 rounded-lg">
                        <Dumbbell className="text-primary h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-wider">GYM APP</h1>
                        <p className="text-xs text-slate-400 uppercase tracking-widest">{role}</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItems />
                </nav>

                <div className="pt-6 border-t border-slate-800">
                    <Link href="/dashboard" className="flex items-center gap-3 mb-4 px-2 hover:bg-slate-800 rounded-lg p-2 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                            <User size={16} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{session.user.name}</p>
                            <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
                        </div>
                    </Link>

                    <SignOutButton />
                </div>
            </aside>

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                {/* MOBILE HEADER */}
                <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <Dumbbell className="text-primary h-5 w-5" />
                        <span className="font-bold">GYM APP</span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                        <span className="text-xs font-bold">{session.user.name?.[0] || 'U'}</span>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
                    {children}
                </main>

                {/* MOBILE BOTTOM NAV - Fixed at bottom */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-2 pb-safe flex justify-around items-center z-50">
                    <NavItems />
                    <div className="flex flex-col items-center text-slate-300 hover:text-white p-2 rounded-lg">
                        <SignOutButton />
                    </div>
                </nav>
            </div>
        </div>
    );
}
