/**
 * Zod Validation Examples
 *
 * This file contains practical examples of how to use the validation schemas
 * in your application. These are reference examples - not meant to be imported.
 */

import { z } from 'zod';
import {
  signUpSchema,
  signInSchema,
  updateProfileSchema,
  validateData,
  validate,
  safeParse,
  formatZodError,
  getFirstError,
} from './index';

// ============================================================================
// Example 1: Basic validation with try/catch
// ============================================================================

function example1_BasicValidation() {
  const formData = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123',
    confirmPassword: 'SecurePass123',
  };

  try {
    const validatedData = signUpSchema.parse(formData);
    console.log('Valid data:', validatedData);
    // Use validatedData for signup
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.issues);
    }
  }
}

// ============================================================================
// Example 2: Using validateData helper (recommended)
// ============================================================================

function example2_ValidateDataHelper() {
  const formData = {
    email: 'invalid-email',
    password: 'short',
  };

  const result = validateData(signInSchema, formData);

  if (result.success) {
    // TypeScript knows result.data exists and is typed
    console.log('Logged in as:', result.data.email);
  } else {
    // TypeScript knows result.errors exists
    result.errors?.forEach((err) => {
      console.error(`${err.path}: ${err.message}`);
    });
  }
}

// ============================================================================
// Example 3: Client-side form validation (React)
// ============================================================================

function example3_ReactFormValidation() {
  // In a React component:
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      name: 'John Doe',
      dateOfBirth: '1990-01-15',
      sex: 'male' as const,
      phone: '+33612345678',
    };

    try {
      const validated = updateProfileSchema.parse(formData);

      // Send to API
      fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Show errors to user
        const errorMessage = formatZodError(error);
        alert(errorMessage);
      }
    }
  };
}

// ============================================================================
// Example 4: Server-side API route validation
// ============================================================================

async function example4_APIRouteValidation(request: Request) {
  try {
    const body = await request.json();

    // Validate and get typed data
    const validatedData = updateProfileSchema.parse(body);

    // Now validatedData is fully typed and safe to use
    // Save to database...

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
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

    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

// ============================================================================
// Example 5: Using safeParse for optional validation
// ============================================================================

function example5_SafeParse() {
  const userInput = 'maybe-valid@email.com';

  // Returns undefined if invalid, no throwing
  const validEmail = safeParse(
    z.string().email(),
    userInput
  );

  if (validEmail) {
    console.log('Valid email:', validEmail);
  } else {
    console.log('Invalid email, using default');
  }
}

// ============================================================================
// Example 6: Custom validation with refine
// ============================================================================

function example6_CustomValidation() {
  const customSchema = z.object({
    password: z.string().min(12),
    confirmPassword: z.string(),
  }).refine(
    (data) => data.password === data.confirmPassword,
    {
      message: 'Passwords must match',
      path: ['confirmPassword'],
    }
  );

  const result = validateData(customSchema, {
    password: 'SecurePass123',
    confirmPassword: 'DifferentPass123',
  });

  if (!result.success) {
    console.log(result.errors); // [{ path: 'confirmPassword', message: 'Passwords must match' }]
  }
}

// ============================================================================
// Example 7: Partial validation (updating only some fields)
// ============================================================================

function example7_PartialValidation() {
  // Create a partial schema that makes all fields optional
  const partialUpdateSchema = updateProfileSchema.partial();

  // Now you can update just one field
  const result = validateData(partialUpdateSchema, {
    phone: '+33612345678',
    // Other fields are optional
  });

  if (result.success) {
    console.log('Updating only phone:', result.data.phone);
  }
}

// ============================================================================
// Example 8: Array validation
// ============================================================================

function example8_ArrayValidation() {
  const usersArraySchema = z.array(
    z.object({
      email: z.string().email(),
      name: z.string(),
    })
  );

  const users = [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
  ];

  const validated = usersArraySchema.parse(users);
  console.log('Validated users:', validated);
}

// ============================================================================
// Example 9: Conditional validation
// ============================================================================

function example9_ConditionalValidation() {
  const schema = z.object({
    accountType: z.enum(['personal', 'business']),
    companyName: z.string().optional(),
  }).refine(
    (data) => {
      // If business account, company name is required
      if (data.accountType === 'business') {
        return data.companyName && data.companyName.length > 0;
      }
      return true;
    },
    {
      message: 'Company name is required for business accounts',
      path: ['companyName'],
    }
  );

  // This will fail validation
  const result = validateData(schema, {
    accountType: 'business',
    companyName: '',
  });
}

// ============================================================================
// Example 10: Transform data during validation
// ============================================================================

function example10_TransformData() {
  const schema = z.object({
    email: z.string().email().transform((email) => email.toLowerCase()),
    name: z.string().transform((name) => name.trim()),
    age: z.string().transform((age) => parseInt(age, 10)),
  });

  const validated = schema.parse({
    email: 'USER@EXAMPLE.COM',
    name: '  John Doe  ',
    age: '25',
  });

  console.log(validated);
  // { email: 'user@example.com', name: 'John Doe', age: 25 }
}

// ============================================================================
// Example 11: Getting specific error messages
// ============================================================================

function example11_ErrorMessages() {
  try {
    signInSchema.parse({
      email: 'invalid',
      password: '',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Get first error only
      const firstError = getFirstError(error);
      console.log('First error:', firstError);

      // Get all errors formatted
      const allErrors = formatZodError(error);
      console.log('All errors:', allErrors);

      // Get errors by field
      const emailErrors = error.issues.filter((issue) =>
        issue.path.includes('email')
      );
      console.log('Email errors:', emailErrors);
    }
  }
}

// ============================================================================
// Example 12: Using with React Hook Form
// ============================================================================

function example12_ReactHookForm() {
  // If you're using react-hook-form with zodResolver:

  // import { useForm } from 'react-hook-form';
  // import { zodResolver } from '@hookform/resolvers/zod';
  // import { signUpSchema } from '@/lib/validations';

  // const {
  //   register,
  //   handleSubmit,
  //   formState: { errors },
  // } = useForm({
  //   resolver: zodResolver(signUpSchema),
  // });

  // const onSubmit = (data) => {
  //   // data is already validated and typed!
  //   console.log(data);
  // };
}

export {
  example1_BasicValidation,
  example2_ValidateDataHelper,
  example3_ReactFormValidation,
  example4_APIRouteValidation,
  example5_SafeParse,
  example6_CustomValidation,
  example7_PartialValidation,
  example8_ArrayValidation,
  example9_ConditionalValidation,
  example10_TransformData,
  example11_ErrorMessages,
  example12_ReactHookForm,
};
