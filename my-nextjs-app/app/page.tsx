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

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onSuccess: () => {
          // Redirect to dashboard after successful login
          window.location.href = '/dashboard';
        },
        onError: (ctx) => {
          // Show error message if login fails
          alert(ctx.error.message);
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

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    await authClient.signIn.magicLink(
      {
        email: magicLinkEmail,
        callbackURL: '/dashboard',
      },
      {
        onSuccess: () => {
          setMagicLinkSent(true);
        },
        onError: (ctx) => {
          alert(ctx.error.message);
        },
      }
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="z-10 w-full max-w-md">
        <Card className="p-6 sm:p-8">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl text-center">
              Upgrade Coaching
            </CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Sign in to enter to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
          {magicLinkSent ? (
            /* Magic Link Sent - Success Message */
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="rounded-full bg-green-100 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Check your email</h2>
              <p className="text-sm sm:text-base text-gray-600">
                We've sent a magic link to:
              </p>
              <p className="text-sm sm:text-base font-semibold text-gray-900 break-all">
                {magicLinkEmail}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Click the link in the email to sign in to your account.
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setMagicLinkSent(false);
                  setMagicLinkEmail('');
                }}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 mt-4"
              >
                ← Back
              </Button>
            </div>
          ) : (
            <>
                {/* Google Sign In - Secondary Option */}
                <GoogleButton onClick={handleGoogleSignIn}>
                  Sign in with Google
                </GoogleButton>

                <div className="relative my-4 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-3 sm:px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                  </div>
                </div>

          {!showMagicLink ? (
            <>
              {/* Magic Link Sign In - Primary Option */}
              <div className="space-y-3">
                <form onSubmit={handleMagicLinkSignIn} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="magic-link-email">Email Address</Label>
                    <Input
                      id="magic-link-email"
                      type="email"
                      value={magicLinkEmail}
                      onChange={(e) => setMagicLinkEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg">
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Sign in with Magic Link
                  </Button>
                </form>

                {/* Password Sign In - Last Option (Collapsed by default) */}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowMagicLink(true)}
                    className="w-full"
                  >
                    Or sign in with password →
                  </Button>
                </div>

                <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-blue-600 hover:underline font-semibold active:text-blue-700">
                    Sign up
                  </Link>
                </p>
              </div>
            </>
          ) : (
            /* Password Sign In Form */
            <div>
              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Sign In with Password
                </Button>
              </form>
              <Button
                type="button"
                variant="link"
                onClick={() => setShowMagicLink(false)}
                className="w-full mt-3 sm:mt-4"
              >
                ← Back to magic link
              </Button>
            </div>
          )}
            </>
          )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
