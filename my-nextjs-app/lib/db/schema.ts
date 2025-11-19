import {
  pgTable,
  text,
  timestamp,
  boolean,
  varchar,
  integer,
  date,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================================================
// AUTH / IDENTITY (EXISTING)
// ============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  dateOfBirth: varchar('date_of_birth', { length: 10 }),
  sex: varchar('sex', { length: 20 }),
  phone: varchar('phone', { length: 20 }),
  role: varchar('role', { length: 20 }).default('member').notNull(),
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
// GYM DOMAIN ENUMS
// ============================================================================

export const sessionTypeEnum = pgEnum('session_type', ['ONE_TO_ONE', 'GROUP']);
export const sessionStatusEnum = pgEnum('session_status', [
  'PLANNED',
  'CANCELLED',
  'COMPLETED',
]);
export const bookingStatusEnum = pgEnum('booking_status', [
  'CONFIRMED',
  'CANCELLED_BY_MEMBER',
  'CANCELLED_BY_COACH',
  'NO_SHOW',
  'WAITLIST',
]);
export const membershipTypeEnum = pgEnum('membership_type', [
  'PACK',
  'SUBSCRIPTION',
  'SINGLE',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
]);

// ============================================================================
// LOCATIONS & ROOMS
// ============================================================================

export const locations = pgTable('locations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rooms = pgTable('rooms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  locationId: text('location_id')
    .notNull()
    .references(() => locations.id),
  name: varchar('name', { length: 255 }).notNull(),
  capacity: integer('capacity'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// COACH ↔ MEMBER LINK
// ============================================================================

export const coachMembers = pgTable('coach_members', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coachId: text('coach_id')
    .notNull()
    .references(() => users.id),
  memberId: text('member_id')
    .notNull()
    .references(() => users.id),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// TRAINING SESSIONS (BOOKABLE SLOTS)
// ============================================================================

export const trainingSessions = pgTable('training_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coachId: text('coach_id')
    .notNull()
    .references(() => users.id),
  roomId: text('room_id')
    .notNull()
    .references(() => rooms.id),
  type: sessionTypeEnum('type').notNull(), // ONE_TO_ONE / GROUP
  title: varchar('title', { length: 255 }),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  capacity: integer('capacity'), // for GROUP; 1 for 1:1
  status: sessionStatusEnum('status').default('PLANNED').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// MEMBERSHIPS / PACKS
// ============================================================================

export const memberships = pgTable('memberships', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text('member_id')
    .notNull()
    .references(() => users.id),
  type: membershipTypeEnum('type').notNull(), // PACK/SUBSCRIPTION/SINGLE
  name: varchar('name', { length: 255 }),
  sessionsTotal: integer('sessions_total'), // null = unlimited
  sessionsUsed: integer('sessions_used').default(0).notNull(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// BOOKINGS
// ============================================================================

export const bookings = pgTable('bookings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id')
    .notNull()
    .references(() => trainingSessions.id),
  memberId: text('member_id')
    .notNull()
    .references(() => users.id),
  status: bookingStatusEnum('status').default('CONFIRMED').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  cancelledAt: timestamp('cancelled_at'),
  membershipId: text('membership_id').references(() => memberships.id),
});

// ============================================================================
// PAYMENTS (LOG, EXTERNAL PROVIDER)
// ============================================================================

export const payments = pgTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text('member_id')
    .notNull()
    .references(() => users.id),
  membershipId: text('membership_id').references(() => memberships.id),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar('currency', { length: 3 }).default('EUR').notNull(),
  method: varchar('method', { length: 50 }), // "stripe", "sumup", "cash", ...
  externalRef: varchar('external_ref', { length: 255 }), // ID from external provider
  status: paymentStatusEnum('status').default('PAID').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// MEMBER NOTES
// ============================================================================

export const memberNotes = pgTable('member_notes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text('member_id')
    .notNull()
    .references(() => users.id),
  coachId: text('coach_id')
    .notNull()
    .references(() => users.id),
  sessionId: text('session_id').references(() => trainingSessions.id),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// COACH AVAILABILITIES
// ============================================================================

export const coachAvailabilities = pgTable('coach_availabilities', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  coachId: text('coach_id')
    .notNull()
    .references(() => users.id),
  locationId: text('location_id').references(() => locations.id),
  roomId: text('room_id').references(() => rooms.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
  role: z.enum(['member', 'coach', 'owner']).default('member'),
});

export const selectUserSchema = createSelectSchema(users);

// Sessions table schemas (auth sessions)
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

// Gym domain Zod schemas (basic for now)
export const insertLocationSchema = createInsertSchema(locations);
export const selectLocationSchema = createSelectSchema(locations);

export const insertRoomSchema = createInsertSchema(rooms);
export const selectRoomSchema = createSelectSchema(rooms);

export const insertCoachMemberSchema = createInsertSchema(coachMembers);
export const selectCoachMemberSchema = createSelectSchema(coachMembers);

export const insertTrainingSessionSchema = createInsertSchema(trainingSessions);
export const selectTrainingSessionSchema = createSelectSchema(trainingSessions);

export const insertMembershipSchema = createInsertSchema(memberships);
export const selectMembershipSchema = createSelectSchema(memberships);

export const insertBookingSchema = createInsertSchema(bookings);
export const selectBookingSchema = createSelectSchema(bookings);

export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);

export const insertMemberNoteSchema = createInsertSchema(memberNotes);
export const selectMemberNoteSchema = createSelectSchema(memberNotes);

export const insertCoachAvailabilitySchema = createInsertSchema(coachAvailabilities);
export const selectCoachAvailabilitySchema = createSelectSchema(coachAvailabilities);

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

export type Location = z.infer<typeof selectLocationSchema>;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Room = z.infer<typeof selectRoomSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type CoachMember = z.infer<typeof selectCoachMemberSchema>;
export type InsertCoachMember = z.infer<typeof insertCoachMemberSchema>;

export type TrainingSession = z.infer<typeof selectTrainingSessionSchema>;
export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;

export type Membership = z.infer<typeof selectMembershipSchema>;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;

export type Booking = z.infer<typeof selectBookingSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Payment = z.infer<typeof selectPaymentSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type MemberNote = z.infer<typeof selectMemberNoteSchema>;
export type InsertMemberNote = z.infer<typeof insertMemberNoteSchema>;

export type CoachAvailability = z.infer<typeof selectCoachAvailabilitySchema>;
export type InsertCoachAvailability = z.infer<typeof insertCoachAvailabilitySchema>;
