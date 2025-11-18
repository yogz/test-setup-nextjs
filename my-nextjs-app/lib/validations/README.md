# Zod Validation Configuration

This directory contains all Zod validation schemas and utilities for runtime type safety.

## Overview

- **Zod Version**: 4.1.12
- **drizzle-zod**: 0.8.3
- **Integration**: Fully integrated with Better Auth and Drizzle ORM

## File Structure

```
lib/validations/
├── index.ts        # Validation utilities and exports
├── auth.ts         # Authentication & user profile schemas
└── README.md       # This file
```

## Available Schemas

### Authentication Schemas (`auth.ts`)

#### Sign Up
```typescript
import { signUpSchema } from '@/lib/validations';

const result = signUpSchema.parse({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123',
  confirmPassword: 'SecurePass123',
});
```

#### Sign In
```typescript
import { signInSchema } from '@/lib/validations';

const result = signInSchema.parse({
  email: 'john@example.com',
  password: 'SecurePass123',
});
```

#### Magic Link
```typescript
import { magicLinkSchema } from '@/lib/validations';

const result = magicLinkSchema.parse({
  email: 'john@example.com',
});
```

#### Update Profile
```typescript
import { updateProfileSchema } from '@/lib/validations';

const result = updateProfileSchema.parse({
  name: 'John Doe',
  dateOfBirth: '1990-01-15',
  sex: 'male',
  phone: '+33612345678',
});
```

#### Onboarding
```typescript
import { onboardingSchema } from '@/lib/validations';

const result = onboardingSchema.parse({
  name: 'John Doe',
  dateOfBirth: '1990-01-15',
  sex: 'male',
  phone: '+33612345678',
  hasCompletedOnboarding: true,
});
```

### Database Schemas (`lib/db/schema.ts`)

Generated from Drizzle tables using `drizzle-zod`:

```typescript
import { insertUserSchema, selectUserSchema } from '@/lib/db/schema';

// Validate before inserting
const newUser = insertUserSchema.parse({
  email: 'john@example.com',
  name: 'John Doe',
  emailVerified: false,
});

// Validate database query results
const user = selectUserSchema.parse(dbResult);
```

## Validation Utilities

### `validateData<T>`
Safely validates data and returns a structured result:

```typescript
import { validateData, updateProfileSchema } from '@/lib/validations';

const result = validateData(updateProfileSchema, formData);

if (result.success) {
  console.log(result.data); // Typed data
} else {
  console.log(result.errors); // Array of { path, message }
}
```

### `validate<T>`
Validates and throws on error (use with try/catch):

```typescript
import { validate, signUpSchema } from '@/lib/validations';

try {
  const data = validate(signUpSchema, formData);
  // Use data
} catch (error) {
  if (error instanceof ZodError) {
    // Handle validation error
  }
}
```

### `safeParse<T>`
Returns data or undefined (no throwing):

```typescript
import { safeParse, emailSchema } from '@/lib/validations';

const email = safeParse(emailSchema, userInput);
if (email) {
  // Email is valid
}
```

### `formatZodError`
Format validation errors into a user-friendly string:

```typescript
import { formatZodError } from '@/lib/validations';
import { ZodError } from 'zod';

try {
  schema.parse(data);
} catch (error) {
  if (error instanceof ZodError) {
    const message = formatZodError(error);
    // "email: Invalid email address, password: Password too short"
  }
}
```

### `getFirstError`
Get the first validation error message:

```typescript
import { getFirstError } from '@/lib/validations';
import { ZodError } from 'zod';

try {
  schema.parse(data);
} catch (error) {
  if (error instanceof ZodError) {
    alert(getFirstError(error));
  }
}
```

## Field Validation Rules

### Email
- Required
- Valid email format
- Max 255 characters

### Password
- Min 12 characters
- Max 128 characters
- Must contain: uppercase, lowercase, and number

### Name
- Required
- Max 255 characters
- Letters, spaces, hyphens, and apostrophes only

### Phone
- Optional
- International format: `+[country code][number]`
- Example: `+33612345678`, `+15551234567`

### Date of Birth
- Optional
- Format: `YYYY-MM-DD`
- Age must be 13-120 years

### Sex
- Optional
- Values: `male`, `female`, `non-binary`, `prefer-not-to-say`

## Usage in API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { updateProfileSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Use validatedData (fully typed and validated)

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.issues.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

## Usage in Client Components

```typescript
'use client';

import { signUpSchema } from '@/lib/validations';
import { ZodError } from 'zod';

function SignUpForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = signUpSchema.parse({
        name,
        email,
        password,
        confirmPassword,
      });

      // Submit validatedData
    } catch (error) {
      if (error instanceof ZodError) {
        // Show validation errors to user
        error.issues.forEach((issue) => {
          console.log(`${issue.path}: ${issue.message}`);
        });
      }
    }
  };
}
```

## Type Exports

All schemas export TypeScript types:

```typescript
import type {
  SignUpInput,
  SignInInput,
  MagicLinkInput,
  UpdateProfileInput,
  OnboardingInput,
  UserInsert,
} from '@/lib/validations';

import type {
  User,
  InsertUser,
  Session,
  InsertSession,
  Account,
  InsertAccount,
} from '@/lib/db/schema';
```

## Best Practices

1. **Always validate on the server**: Client-side validation is UX, server-side is security
2. **Use TypeScript types from schemas**: `z.infer<typeof schema>`
3. **Handle ZodError gracefully**: Provide user-friendly error messages
4. **Validate early**: Check data as close to the entry point as possible
5. **Use drizzle-zod schemas**: For database operations to ensure type safety

## Migration from Unvalidated Code

Before (no validation):
```typescript
const body = await request.json();
const { name, email } = body; // Any type, unsafe
```

After (with Zod):
```typescript
const body = await request.json();
const { name, email } = updateProfileSchema.parse(body); // Fully typed and validated
```

## Resources

- [Zod Documentation](https://zod.dev)
- [drizzle-zod Documentation](https://orm.drizzle.team/docs/zod)
- [Better Auth with Zod](https://www.better-auth.com)
