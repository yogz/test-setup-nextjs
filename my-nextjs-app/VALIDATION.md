# Validation Guide

This document describes the comprehensive Zod validation implementation across the application.

## Overview

All data entering the application is validated using **Zod** schemas for:
- Runtime type safety
- Data integrity
- Security protection
- Better error messages

---

## Validation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Input                              │
│           (Forms, API calls, Server Actions)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Zod Schema Validation                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ • Field-level validation (type, format, length)      │  │
│  │ • Business rules (age limits, phone format)          │  │
│  │ • Cross-field validation (password confirmation)     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
        ✅ Valid           ❌ Invalid
                │                 │
                ▼                 ▼
        Process Data      Return Errors
        Write to DB       (User-friendly)
```

---

## Where Validation Happens

### ✅ **1. Server Actions** (`app/actions/*.ts`)

**ALL server actions must validate input data.**

```typescript
import { validateData } from '@/lib/validations';
import { updateUserSchema } from '@/lib/validations/auth';

export async function updateUserAction(userId: string, data: UpdateUserInput) {
  // Validate input
  const validationResult = validateData(updateUserSchema, data);
  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validationResult.errors,
    };
  }

  const validatedData = validationResult.data;

  // Use validated data only
  await db.update(users).set(validatedData);
}
```

### ✅ **2. API Routes** (`app/api/*/route.ts`)

**ALL API endpoints must validate request bodies.**

```typescript
import { updateProfileSchema } from '@/lib/validations/auth';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Use validated data
    await db.update(users).set(validatedData);

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
    // Handle other errors
  }
}
```

### ✅ **3. Database Operations** (`lib/db/schema.ts`)

**All Drizzle schemas have Zod validation.**

```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const users = pgTable('users', { /* ... */ });

// Auto-generated Zod schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email('Invalid email'),
  role: z.enum(['member', 'coach', 'owner']),
});
```

---

## Available Schemas

### Authentication & User Management

Located in `lib/validations/auth.ts`:

| Schema | Purpose | Fields |
|--------|---------|--------|
| `emailSchema` | Email validation | Email format, max 255 chars |
| `passwordSchema` | Password validation | Min 12 chars, complexity rules |
| `nameSchema` | Name validation | Letters, spaces, hyphens, apostrophes |
| `phoneSchema` | Phone validation | International format (+33...) |
| `dateOfBirthSchema` | DOB validation | YYYY-MM-DD, age 13-120 |
| `sexSchema` | Sex validation | male/female/non-binary/prefer-not-to-say |
| `roleSchema` | Role validation | member/coach/owner |
| `signUpSchema` | User registration | name, email, password, confirmPassword |
| `signInSchema` | User login | email, password |
| `magicLinkSchema` | Magic link auth | email |
| `updateProfileSchema` | Profile updates | name, dateOfBirth, sex, phone |
| `onboardingSchema` | Onboarding flow | All profile fields + onboarding flag |
| `updateUserSchema` | User management | name, dateOfBirth, sex, phone, role |
| `deleteUserSchema` | User deletion | userId (UUID) |
| `changeUserRoleSchema` | Role changes | userId, newRole |

---

## Field-Level Validators

### Email Validation

```typescript
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters');
```

**Checks:**
- ✅ Not empty
- ✅ Valid email format
- ✅ Max 255 characters

---

### Password Validation

```typescript
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be less than 128 characters')
  .refine(
    (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val),
    'Password must contain uppercase, lowercase, and number'
  );
```

**Checks:**
- ✅ Min 12 characters (strong passwords)
- ✅ Max 128 characters
- ✅ Contains uppercase letter
- ✅ Contains lowercase letter
- ✅ Contains number

---

### Phone Validation

```typescript
export const phoneSchema = z
  .string()
  .refine(
    (val) => val === '' || /^\+[1-9]\d{1,14}$/.test(val),
    'Phone must be in international format (e.g., +33612345678)'
  )
  .optional()
  .or(z.literal(''));
```

**Checks:**
- ✅ International format (`+` followed by digits)
- ✅ 1-15 digits after `+`
- ✅ Optional (can be empty)

**Valid examples:**
- `+33612345678` (France)
- `+15551234567` (USA)
- `` (empty/optional)

---

### Date of Birth Validation

```typescript
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
```

**Checks:**
- ✅ YYYY-MM-DD format
- ✅ Age between 13 and 120
- ✅ Optional (can be empty)

---

### Name Validation

```typescript
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(255, 'Name must be less than 255 characters')
  .refine(
    (val) => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(val),
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  );
```

**Checks:**
- ✅ Not empty
- ✅ Max 255 characters
- ✅ Letters only (including accented characters)
- ✅ Allows spaces, hyphens, apostrophes

**Valid examples:**
- `Jean-Pierre`
- `O'Connor`
- `María José`

---

## Validation Utilities

Located in `lib/validations/index.ts`:

### `validateData<T>(schema, data)`

Returns a result object (doesn't throw).

```typescript
const result = validateData(updateUserSchema, data);

if (!result.success) {
  console.log(result.errors);
  // [{ path: 'email', message: 'Invalid email' }]
  return;
}

const validData = result.data; // Type-safe!
```

**Use when:** You want to handle errors immediately

---

### `validate<T>(schema, data)`

Throws error if validation fails.

```typescript
try {
  const validData = validate(updateUserSchema, data);
  // Use validData
} catch (error) {
  if (error instanceof ZodError) {
    // Handle validation error
  }
}
```

**Use when:** You have error handling at a higher level

---

### `safeParse<T>(schema, data)`

Returns `undefined` if validation fails.

```typescript
const validData = safeParse(updateUserSchema, data);

if (!validData) {
  // Validation failed
  return;
}

// Use validData
```

**Use when:** You just need to check if data is valid

---

### `formatZodError(error)`

Format Zod errors into a user-friendly string.

```typescript
try {
  schema.parse(data);
} catch (error) {
  if (error instanceof ZodError) {
    const message = formatZodError(error);
    // "email: Invalid email, name: Name is required"
  }
}
```

---

### `getFirstError(error)`

Get the first error message.

```typescript
try {
  schema.parse(data);
} catch (error) {
  if (error instanceof ZodError) {
    const message = getFirstError(error);
    // "Invalid email"
  }
}
```

---

## Error Handling Patterns

### Pattern 1: Server Actions (Recommended)

```typescript
export async function myAction(data: MyInput) {
  try {
    // Validate
    const validationResult = validateData(mySchema, data);
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validationResult.errors,
      };
    }

    const validData = validationResult.data;

    // Business logic
    await doSomething(validData);

    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    // Handle other errors
  }
}
```

### Pattern 2: API Routes

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = mySchema.parse(body);

    // Use validatedData

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Client-Side Validation

While server-side validation is mandatory, client-side validation improves UX.

### React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUserSchema } from '@/lib/validations/auth';

function MyForm() {
  const form = useForm({
    resolver: zodResolver(updateUserSchema),
  });

  const onSubmit = async (data: UpdateUserInput) => {
    // Data is already validated by the form
    const result = await updateUserAction(userId, data);
    // Handle result
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

---

## Security Best Practices

### ✅ DO

1. **Always validate on the server** - Client validation can be bypassed
2. **Use TypeScript types from Zod** - `z.infer<typeof schema>`
3. **Validate UUIDs** - Use `z.string().uuid()`
4. **Sanitize user input** - Zod helps, but be aware of XSS
5. **Use specific error messages** - Help users fix issues
6. **Validate array lengths** - Prevent DOS attacks
7. **Set max string lengths** - Prevent buffer overflows

### ❌ DON'T

1. **Don't trust client-side validation alone**
2. **Don't skip validation for "internal" functions**
3. **Don't expose detailed errors to clients** - Could leak info
4. **Don't validate after database insert** - Too late!
5. **Don't use loose types** - `z.any()` defeats the purpose

---

## Common Validation Scenarios

### Validate UUID

```typescript
const userIdSchema = z.string().uuid('Invalid user ID');
```

### Validate Enum

```typescript
const roleSchema = z.enum(['member', 'coach', 'owner']);
```

### Validate Email

```typescript
const emailSchema = z.string().email('Invalid email');
```

### Validate Optional Field

```typescript
const phoneSchema = z.string().optional().or(z.literal(''));
```

### Cross-Field Validation

```typescript
const signUpSchema = z.object({
  password: z.string().min(12),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);
```

### Conditional Validation

```typescript
const userSchema = z.object({
  type: z.enum(['coach', 'member']),
  certificationDate: z.date().optional(),
}).refine(
  (data) => data.type !== 'coach' || data.certificationDate !== undefined,
  {
    message: 'Coaches must have a certification date',
    path: ['certificationDate'],
  }
);
```

---

## Testing Validation

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { updateUserSchema } from '@/lib/validations/auth';

describe('updateUserSchema', () => {
  it('should validate correct data', () => {
    const data = {
      name: 'John Doe',
      phone: '+33612345678',
      sex: 'male',
    };

    const result = updateUserSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid phone', () => {
    const data = {
      name: 'John Doe',
      phone: '123456', // Missing +
    };

    const result = updateUserSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
```

---

## Adding New Validation Schemas

### Step 1: Define Schema

```typescript
// lib/validations/gym.ts
import { z } from 'zod';

export const createSessionSchema = z.object({
  coachId: z.string().uuid(),
  roomId: z.string().uuid(),
  type: z.enum(['ONE_TO_ONE', 'GROUP']),
  startTime: z.date(),
  endTime: z.date(),
  capacity: z.number().int().min(1).max(50),
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
```

### Step 2: Use in Server Action

```typescript
import { createSessionSchema } from '@/lib/validations/gym';
import { validateData } from '@/lib/validations';

export async function createSessionAction(data: CreateSessionInput) {
  const validationResult = validateData(createSessionSchema, data);

  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validationResult.errors,
    };
  }

  // Use validationResult.data
}
```

---

## Validation Checklist

Before deploying any new server action or API route:

- [ ] Input data validated with Zod schema
- [ ] UUIDs validated with `.uuid()`
- [ ] Enums validated with `z.enum([])`
- [ ] Strings have max length limits
- [ ] Numbers have min/max ranges
- [ ] Dates have format validation
- [ ] Cross-field validation if needed
- [ ] Error handling for `ZodError`
- [ ] User-friendly error messages
- [ ] TypeScript types inferred from schema

---

**Last Updated:** 2025-01-19
**Zod Version:** 3.x
