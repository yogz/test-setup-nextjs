'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth/client';

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
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2">
            Upgrade Coaching
          </h1>
          <p className="text-center text-gray-600 mb-6 text-sm sm:text-base">
            Sign in to enter to your account
          </p>
                {/* Google Sign In - Secondary Option */}
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-sm sm:text-base active:scale-95"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>

                <div className="relative my-4 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-3 sm:px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                  </div>
                </div>

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
                We've sent a magic link to <strong className="break-all">{magicLinkEmail}</strong>
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Click the link in the email to sign in to your account.
              </p>
              <button
                onClick={() => {
                  setMagicLinkSent(false);
                  setMagicLinkEmail('');
                  setShowMagicLink(false);
                }}
                className="text-xs sm:text-sm text-blue-600 hover:underline font-medium active:text-blue-700"
              >
                Back to sign in
              </button>
            </div>
          ) : !showMagicLink ? (
            <>
              {/* Magic Link Sign In - Primary Option */}
              <div className="space-y-3">
                <form onSubmit={handleMagicLinkSignIn} className="space-y-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={magicLinkEmail}
                      onChange={(e) => setMagicLinkEmail(e.target.value)}
                      className="w-full px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-900 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Sign in with Magic Link
                  </button>
                </form>

                {/* Password Sign In - Last Option (Collapsed by default) */}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowMagicLink(true)}
                    className="w-full text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium active:text-gray-900"
                  >
                    Or sign in with password →
                  </button>
                </div>

                <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
                  Don't have an account?{' '}
                  <a href="/signup" className="text-blue-600 hover:underline font-semibold active:text-blue-700">
                    Sign up
                  </a>
                </p>
              </div>
            </>
          ) : (
            /* Password Sign In Form */
            <>
              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg hover:bg-gray-900 transition-colors font-medium text-sm sm:text-base active:scale-95"
                >
                  Sign In with Password
                </button>
              </form>
              <button
                type="button"
                onClick={() => setShowMagicLink(false)}
                className="w-full text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium mt-3 sm:mt-4 active:text-blue-700"
              >
                ← Back to magic link
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
