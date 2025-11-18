import { ZodError, ZodSchema } from 'zod';

/**
 * Validation Utilities
 * Helper functions for working with Zod schemas
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Safely validates data against a Zod schema
 * Returns a structured result object instead of throwing
 */
export function validateData<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    throw error; // Re-throw if it's not a ZodError
  }
}

/**
 * Validates data and returns only the data or throws
 * Use this when you want to handle errors at a higher level
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validates data without throwing
 * Returns undefined if validation fails
 */
export function safeParse<T>(
  schema: ZodSchema<T>,
  data: unknown
): T | undefined {
  const result = schema.safeParse(data);
  return result.success ? result.data : undefined;
}

/**
 * Format Zod errors into a user-friendly message
 */
export function formatZodError(error: ZodError): string {
  return error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
}

/**
 * Get the first error message from a ZodError
 */
export function getFirstError(error: ZodError): string {
  return error.issues[0]?.message || 'Validation failed';
}

// Re-export all validation schemas
export * from './auth';
