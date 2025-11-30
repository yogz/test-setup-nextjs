import { z } from 'zod';

export const createBookingSchema = z.object({
    sessionId: z.string().uuid(),
    memberId: z.string().uuid().optional(), // Optional if booking for self
});

export const createRecurringBookingSchema = z.object({
    sessionId: z.string().uuid(), // The recurring session to book
    numberOfOccurrences: z.number().min(1).max(52).optional(), // How many future occurrences to book
    memberId: z.string().uuid().optional(),
});

export const cancelBookingSchema = z.object({
    bookingId: z.string().uuid(),
    reason: z.string().optional(),
});

export const confirmSessionSchema = z.object({
    sessionId: z.string().uuid(),
    notes: z.string().optional(),
});

export const addSessionCommentSchema = z.object({
    sessionId: z.string().uuid(),
    content: z.string().min(1, 'Comment cannot be empty'),
});

export const updateAvailabilitySchema = z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    isRecurring: z.boolean().default(true),
});

export const createTrainingSessionSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    startTime: z.string().datetime(), // ISO string
    endTime: z.string().datetime(), // ISO string
    capacity: z.number().min(1).default(1),
    type: z.enum(['ONE_TO_ONE', 'GROUP']),
    roomId: z.string().uuid().optional(), // Optional for now
});

export const bookAvailableSlotSchema = z.object({
    coachId: z.string().uuid(),
    startTime: z.string().datetime(), // ISO string
    endTime: z.string().datetime(), // ISO string
    memberId: z.string().uuid().optional(), // Optional if booking for self
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateRecurringBookingInput = z.infer<typeof createRecurringBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type ConfirmSessionInput = z.infer<typeof confirmSessionSchema>;
export type AddSessionCommentInput = z.infer<typeof addSessionCommentSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type CreateTrainingSessionInput = z.infer<typeof createTrainingSessionSchema>;
export type BookAvailableSlotInput = z.infer<typeof bookAvailableSlotSchema>;
