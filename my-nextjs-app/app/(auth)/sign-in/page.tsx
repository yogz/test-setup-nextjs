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
import { Loader2 } from 'lucide-react';

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
        setIsGoogleLoading(true);
        try {
            await authClient.signIn.social({
                provider: 'google',
                callbackURL: '/dashboard',
            });
        } catch (error) {
            setIsGoogleLoading(false);
            toast.error('Erreur lors de la connexion avec Google');
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-0 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="z-10 w-full h-full sm:h-auto sm:max-w-md">
                <Card className="min-h-screen sm:min-h-0 rounded-none sm:rounded-lg p-8 sm:p-8 flex flex-col justify-center">
                    <CardHeader className="p-0 mb-8 sm:mb-6">
                        <CardTitle className="text-4xl sm:text-3xl md:text-4xl text-center font-bold">
                            Bon retour !
                        </CardTitle>
                        <CardDescription className="text-center text-base sm:text-base mt-3">
                            Connectez-vous à votre compte
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-0 space-y-4 sm:space-y-3">
                        {/* Google Sign In - Primary Option */}
                        <GoogleButton onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
                            {isGoogleLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connexion en cours...
                                </>
                            ) : (
                                'Se connecter avec Google'
                            )}
                        </GoogleButton>

                        <div className="relative my-6 sm:my-4">
                            <div className="absolute inset-0 flex items-center">
                                <Separator />
                            </div>
                            <div className="relative flex justify-center text-sm sm:text-sm">
                                <span className="px-4 bg-white text-gray-500 font-medium">Ou</span>
                            </div>
                        </div>

                        <form onSubmit={handleSignIn} className="space-y-5 sm:space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="signin-email" className="text-base sm:text-sm">E-mail</Label>
                                <Input
                                    id="signin-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="signin-password" className="text-base sm:text-sm">Mot de passe</Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-blue-600 hover:underline"
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
                                    className="h-12 text-base"
                                />
                            </div>
                            <Button type="submit" className="w-full h-12 text-base" disabled={isLoading || isGoogleLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Connexion en cours...
                                    </>
                                ) : (
                                    'Se connecter'
                                )}
                            </Button>
                        </form>

                        <p className="mt-6 sm:mt-6 text-center text-sm sm:text-sm text-gray-600">
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
