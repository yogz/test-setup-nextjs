'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { GoogleButton } from '@/components/ui/google-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        await authClient.signIn.email(
            {
                email,
                password,
            },
            {
                onSuccess: () => {
                    // Redirect to dashboard after successful signin
                    window.location.href = '/dashboard';
                },
                onError: (ctx) => {
                    toast.error(ctx.error.message);
                    setIsLoading(false);
                },
            }
        );
    };

    const handleGoogleSignIn = async () => {
        await authClient.signIn.social({
            provider: 'google',
            callbackURL: '/dashboard',
        });
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="z-10 w-full max-w-md">
                <Card className="p-6 sm:p-8">
                    <CardHeader className="p-0 mb-6">
                        <CardTitle className="text-2xl sm:text-3xl md:text-4xl text-center">
                            Bon retour !
                        </CardTitle>
                        <CardDescription className="text-center text-sm sm:text-base">
                            Connectez-vous à votre compte
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-0 space-y-3">
                        {/* Google Sign In - Primary Option */}
                        <GoogleButton onClick={handleGoogleSignIn}>
                            Se connecter avec Google
                        </GoogleButton>

                        <div className="relative my-4 sm:my-6">
                            <div className="absolute inset-0 flex items-center">
                                <Separator />
                            </div>
                            <div className="relative flex justify-center text-xs sm:text-sm">
                                <span className="px-3 sm:px-4 bg-white text-gray-500 font-medium">Ou</span>
                            </div>
                        </div>

                        <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="signin-email">E-mail</Label>
                                <Input
                                    id="signin-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="signin-password">Mot de passe</Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Mot de passe oublié ?
                                    </Link>
                                </div>
                                <Input
                                    id="signin-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                {isLoading ? 'Connexion...' : 'Se connecter'}
                            </Button>
                        </form>

                        <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
                            Pas encore de compte ?{' '}
                            <Link href="/signup" className="text-blue-600 hover:underline font-semibold active:text-blue-700">
                                S'inscrire
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
