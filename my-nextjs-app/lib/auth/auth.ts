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
      role: {
        type: 'string',
        required: false,
        defaultValue: 'member',
        input: false, // Don't allow users to set this directly
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
    'http://localhost:3000', // Required for local development (HTTP)
    'http://localhost:3005', // Alternative dev port
    'https://localhost:3000', // Required for mobile development (HTTPS)
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
      sendMagicLink: async ({ email, url }) => {
        // TODO: Implement email sending service (e.g., Resend, SendGrid, etc.)
        // In production, send via email service
        if (process.env.NODE_ENV === 'production') {
          // await sendEmail({ to: email, subject: 'Your magic link', body: url });
          console.log(`Magic link sent to ${email}`);
        } else {
          // Only log details in development (never log token itself)
          console.log('\n🔗 Magic Link Sign-In (DEV)');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`📧 To: ${email}`);
          console.log(`🔗 URL: ${url}`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
      },
    }),
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session.session;
export type AuthUser = typeof auth.$Infer.Session.user;
