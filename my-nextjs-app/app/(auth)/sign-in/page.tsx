'use client';

import { useState } from 'react';
import Link from 'next/link';
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
                    // Show error message if signin fails
                    alert(ctx.error.message);
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
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="z-10 w-full max-w-md">
                <Card className="p-6 sm:p-8">
                    <CardHeader className="p-0 mb-6">
                        <CardTitle className="text-2xl sm:text-3xl md:text-4xl text-center">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-center text-sm sm:text-base">
                            Sign in to your account
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-0 space-y-3">
                        {/* Google Sign In - Primary Option */}
                        <GoogleButton
                            onClick={handleGoogleSignIn}
                            disabled={isGoogleLoading || isLoading}
                        >
                            {isGoogleLoading ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Signing in with Google...
                                </>
                            ) : (
                                'Sign in with Google'
                            )}
                        </GoogleButton>

                        <div className="relative my-4 sm:my-6">
                            <div className="absolute inset-0 flex items-center">
                                <Separator />
                            </div>
                            <div className="relative flex justify-center text-xs sm:text-sm">
                                <span className="px-3 sm:px-4 bg-white text-gray-500 font-medium">Or</span>
                            </div>
                        </div>

                        <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="signin-email">Email</Label>
                                <Input
                                    id="signin-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading || isGoogleLoading}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="signin-password">Password</Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="signin-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading || isGoogleLoading}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" size="lg" disabled={isLoading || isGoogleLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link href="/signup" className="text-blue-600 hover:underline font-semibold active:text-blue-700">
                                Sign up
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
