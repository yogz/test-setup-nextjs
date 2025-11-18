import { z } from 'zod';

/**
 * Authentication & User Profile Validation Schemas
 * Using Zod 4 for runtime type safety and validation
 */

// ============================================================================
// Basic Field Validators
// ============================================================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters');

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be less than 128 characters')
  .refine(
    (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val),
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(255, 'Name must be less than 255 characters')
  .refine(
    (val) => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(val),
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  );

export const phoneSchema = z
  .string()
  .refine(
    (val) => val === '' || /^\+[1-9]\d{1,14}$/.test(val),
    'Phone must be in international format (e.g., +33612345678)'
  )
  .optional()
  .or(z.literal(''));

export const dateOfBirthSchema = z
  .string()
  .refine(
    (val) => val === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
    'Date must be in YYYY-MM-DD format'
  )
  .refine((date) => {
    if (date === '') return true;
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 13 && age <= 120;
  }, 'Must be at least 13 years old')
  .optional()
  .or(z.literal(''));

export const sexSchema = z
  .enum(['male', 'female', 'non-binary', 'prefer-not-to-say'], {
    message: 'Please select a valid option',
  })
  .optional()
  .or(z.literal(''));

// ============================================================================
// Authentication Schemas
// ============================================================================

export const signUpSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const magicLinkSchema = z.object({
  email: emailSchema,
});

// ============================================================================
// Profile Update Schemas
// ============================================================================

export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  dateOfBirth: dateOfBirthSchema,
  sex: sexSchema,
  phone: phoneSchema,
  hasCompletedOnboarding: z.boolean().optional(),
});

export const onboardingSchema = z.object({
  name: nameSchema,
  dateOfBirth: dateOfBirthSchema,
  sex: sexSchema,
  phone: phoneSchema,
  hasCompletedOnboarding: z.literal(true),
});

// ============================================================================
// User Schema (for database inserts/updates)
// ============================================================================

export const userInsertSchema = z.object({
  id: z.string().length(36).optional(), // UUID format
  email: emailSchema,
  emailVerified: z.boolean().default(false),
  name: nameSchema.optional(),
  image: z.string().refine((val) => val === '' || /^https?:\/\/.+/.test(val), 'Must be a valid URL').optional().or(z.literal('')),
  dateOfBirth: dateOfBirthSchema,
  sex: sexSchema,
  phone: phoneSchema,
  hasCompletedOnboarding: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type UserInsert = z.infer<typeof userInsertSchema>;
