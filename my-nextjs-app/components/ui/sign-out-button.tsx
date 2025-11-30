'use client';

import { signOut } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push('/');
                },
            },
        });
    };

    return (
        <Button
            variant="outline"
            className="w-full justify-start gap-2 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={handleSignOut}
        >
            <LogOut size={18} />
            Sign Out
        </Button>
    );
}
