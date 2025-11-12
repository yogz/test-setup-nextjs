import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/db';
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
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
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
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    'https://appleid.apple.com', // Required for Apple Sign In
  ],
});

export type AuthSession = typeof auth.$Infer.Session.session;
export type AuthUser = typeof auth.$Infer.Session.user;
