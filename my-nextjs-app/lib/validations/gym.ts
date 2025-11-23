import { z } from 'zod';

export const createBookingSchema = z.object({
    sessionId: z.string().uuid().optional(), // Optional now, as we might book via availabilityId
    availabilityId: z.string().uuid().optional(),
    date: z.string().optional(), // ISO Date string YYYY-MM-DD
    memberId: z.string().uuid().optional(), // Optional if booking for self
}).refine(data => data.sessionId || (data.availabilityId && data.date), {
    message: "Either sessionId OR (availabilityId AND date) must be provided"
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
    dayOfWeek: z.array(z.number().min(0).max(6)).min(1, 'Select at least one day'),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    isRecurring: z.boolean().optional(),
    // Class Details
    title: z.string().optional(),
    description: z.string().optional(),
    capacity: z.number().min(1).optional(),
    type: z.enum(['ONE_TO_ONE', 'GROUP']).optional(),
    durationMinutes: z.number().min(1).optional(),
    slotDuration: z.number().min(15).default(60).optional(), // For splitting 1:1 blocks
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

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type ConfirmSessionInput = z.infer<typeof confirmSessionSchema>;
export type AddSessionCommentInput = z.infer<typeof addSessionCommentSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type CreateTrainingSessionInput = z.infer<typeof createTrainingSessionSchema>;
