import { pgTable, text, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  dateOfBirth: varchar('date_of_birth', { length: 10 }),
  sex: varchar('sex', { length: 20 }),
  phone: varchar('phone', { length: 20 }),
  hasCompletedOnboarding: boolean('has_completed_onboarding').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique().$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// Zod Schemas Generated from Drizzle Tables
// ============================================================================

// Users table schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email('Invalid email address').max(255),
  name: z.string().max(255).optional(),
  dateOfBirth: z.string().includes('-').optional(), // YYYY-MM-DD format
  sex: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']).optional(),
  phone: z.string().startsWith('+').optional(), // International format
});

export const selectUserSchema = createSelectSchema(users);

// Sessions table schemas
export const insertSessionSchema = createInsertSchema(sessions, {
  token: z.string().length(36), // UUID format
  userId: z.string().length(36),
});

export const selectSessionSchema = createSelectSchema(sessions);

// Accounts table schemas
export const insertAccountSchema = createInsertSchema(accounts, {
  userId: z.string().length(36),
  providerId: z.string().min(1),
  accountId: z.string().min(1),
});

export const selectAccountSchema = createSelectSchema(accounts);

// Verifications table schemas
export const insertVerificationSchema = createInsertSchema(verifications);
export const selectVerificationSchema = createSelectSchema(verifications);

// ============================================================================
// Type Exports
// ============================================================================

export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Session = z.infer<typeof selectSessionSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Account = z.infer<typeof selectAccountSchema>;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Verification = z.infer<typeof selectVerificationSchema>;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
