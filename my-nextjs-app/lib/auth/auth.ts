import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/db';
import { nextCookies } from 'better-auth/next-js';
import { magicLink } from 'better-auth/plugins';
import { users, sessions, accounts, verifications } from '@/lib/db/schema';

// Helper to check if OAuth provider is configured
const isProviderConfigured = (clientId?: string, clientSecret?: string) => {
  return !!(clientId && clientSecret);
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  user: {
    additionalFields: {
      dateOfBirth: {
        type: 'string',
        required: false,
        input: true,
      },
      sex: {
        type: 'string',
        required: false,
        input: true,
      },
      phone: {
        type: 'string',
        required: false,
        input: true,
      },
      hasCompletedOnboarding: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false, // Don't allow users to set this directly
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production with email service
    minPasswordLength: 12, // Stronger password requirement
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  socialProviders: {
    // Google OAuth - only enabled if credentials are provided
    ...(isProviderConfigured(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    ) && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    }),
    // Apple OAuth - only enabled if credentials are provided
    ...(isProviderConfigured(
      process.env.APPLE_CLIENT_ID,
      process.env.APPLE_CLIENT_SECRET
    ) && {
      apple: {
        clientId: process.env.APPLE_CLIENT_ID as string,
        clientSecret: process.env.APPLE_CLIENT_SECRET as string,
      },
    }),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (refresh session if used after 1 day)
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    'http://localhost:3000', // Required for local development
    'https://appleid.apple.com', // Required for Apple Sign In
  ],
  advanced: {
    // Enhanced security settings
    useSecureCookies: process.env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // CSRF protection
      path: '/',
    },
    disableCSRFCheck: false, // Keep CSRF protection enabled
  },
  // IMPORTANT: nextCookies must be the LAST plugin
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token, url }) => {
        // TODO: Implement email sending service (e.g., Resend, SendGrid, etc.)
        console.log('Magic link for', email);
        console.log('Magic link URL:', url);
        console.log('Token:', token);

        // For development, log the magic link to console
        // In production, replace this with actual email sending
        console.log('\n🔗 Magic Link Sign-In');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 To: ${email}`);
        console.log(`🔗 URL: ${url}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      },
    }),
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session.session;
export type AuthUser = typeof auth.$Infer.Session.user;
