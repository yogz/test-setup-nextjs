'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { GoogleButton } from '@/components/ui/google-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    await authClient.signUp.email(
      {
        name,
        email,
        password,
      },
      {
        onSuccess: () => {
          // Redirect to dashboard after successful signup
          window.location.href = '/dashboard';
        },
        onError: (ctx) => {
          // Show error message if signup fails
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

  const [isOpen, setIsOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="z-10 w-full max-w-md">
        <Card className="p-6 sm:p-8">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl text-center">
              Create Account
            </CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Get started with your free account
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-3">
            {/* Google Sign Up - Primary Option */}
            <GoogleButton onClick={handleGoogleSignIn}>
              Sign up with Google
            </GoogleButton>

            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-3 sm:px-4 bg-white text-gray-500 font-medium">Or</span>
              </div>
            </div>

            {/* Email/Password Sign Up - Secondary Option (Collapsed) */}
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="w-full text-center py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium active:text-gray-900">
                  Sign up with email and password →
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-3 sm:space-y-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                <form onSubmit={handleSignup} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 12 characters"
                    required
                    minLength={12}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={12}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create Account
                </Button>
              </form>
              </CollapsibleContent>
            </Collapsible>

            <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/" className="text-blue-600 hover:underline font-semibold active:text-blue-700">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
