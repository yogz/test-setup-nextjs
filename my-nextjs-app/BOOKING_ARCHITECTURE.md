# Booking & Availability Architecture

This document describes the complete architecture for managing coach availability, member bookings, and session generation in your gym/coaching application.

## Table of Contents

- [Overview](#overview)
- [Database Schema](#database-schema)
- [User Flows](#user-flows)
- [API Reference](#api-reference)
- [Session Generation](#session-generation)
- [Best Practices](#best-practices)

---

## Overview

### Design Goals

1. **Coach UX**: Define weekly availability once, add exceptions as needed
2. **Member UX**: Book recurring or one-time sessions easily
3. **Billing**: Track actual sessions for accurate invoicing
4. **Automation**: Daily session generation and completion marking

### Key Concepts

```
Coach Availability (Rules)
  ├─ Weekly Template (recurring, e.g., "every Monday 9-12")
  ├─ Blocked Slots (exceptions, e.g., "vacation Jan 15")
  └─ Additions (one-time, e.g., "extra slot Saturday 10am")

Member Bookings
  ├─ Recurring Bookings (e.g., "every Tuesday 10am")
  └─ One-Time Bookings (e.g., "just this Thursday 2pm")

Sessions (Materialized)
  ├─ Generated automatically from recurring bookings
  ├─ Created on-demand for one-time bookings
  └─ Linked to origin (recurring_booking_id OR one_time_booking_id)
```

---

## Database Schema

### Coach Availability & Settings

#### 1. `coach_settings` (Preferences)
```typescript
{
  id: string;
  coachId: string;
  defaultRoomId?: string;
  defaultDuration: number; // e.g. 60 minutes
}
```
**Usage**: Stores coach defaults to speed up availability creation.

#### 2. `weekly_availability` (Recurring Template)
```typescript
{
  id: string;
  coachId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  isIndividual: boolean;
  isGroup: boolean;
  roomId?: string;
}
```
**Usage**: Coach's regular weekly schedule.

#### 3. `blocked_slots` (Negative Exceptions)
```typescript
{
  id: string;
  coachId: string;
  startTime: Date; // Full timestamp
  endTime: Date;
  reason?: string;
}
```
**Usage**: Block specific dates/times when coach is unavailable.

#### 4. `availability_additions` (Positive Exceptions)
```typescript
{
  id: string;
  coachId: string;
  startTime: Date;
  endTime: Date;
  roomId?: string;
  reason?: string;
}
```
**Usage**: Add one-time slots outside regular schedule.

---

### Member Booking Tables

#### 5. `recurring_bookings` (Recurring Reservations)
```typescript
{
  id: string;
  memberId: string;
  coachId: string;
  dayOfWeek: number;
  startTime: string; // "HH:MM"
  endTime: string;
  startDate: Date; // When recurring starts
  endDate?: Date; // null = indefinite
  frequency: number; // 1=weekly, 2=bi-weekly
  status: 'ACTIVE' | 'CANCELLED';
}
```
**Usage**: Member's recurring reservation (e.g., "every Tuesday 10am").

#### 6. `bookings` (One-Time Reservations)
```typescript
{
  id: string;
  sessionId: string; // Links to specific session
  memberId: string;
  status: 'CONFIRMED' | 'CANCELLED_BY_MEMBER' | 'CANCELLED_BY_COACH' | 'NO_SHOW';
  membershipId?: string;
}
```
**Usage**: Single session booking record.

---

### Session Table

#### 7. `training_sessions` (Materialized Sessions)
```typescript
{
  id: string;
  coachId: string;
  memberId?: string; // Direct member reference
  roomId: string;
  startTime: Date;
  endTime: Date;
  type: 'ONE_TO_ONE' | 'GROUP';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';

  // Origin tracking
  recurringBookingId?: string; // If from recurring booking
  oneTimeBookingId?: string; // If from one-time booking

  title: string;
  capacity: number;
  notes?: string;
}
```
**Usage**: Each concrete session occurrence.

---

## User Flows

### Flow 1: Coach Sets Up Availability

```typescript
// 1. Coach defines weekly availability
await updateWeeklyAvailabilityAction(1, [ // Monday
  { startTime: '09:00', endTime: '12:00', roomId: 'room-1' },
  { startTime: '14:00', endTime: '17:00', roomId: 'room-1' },
]);

// 2. Coach blocks vacation
await blockSlotAction(
  new Date('2025-01-15 00:00:00'),
  new Date('2025-01-20 23:59:59'),
  'Vacation'
);
```

### Flow 2: Member Books Recurring Session

```typescript
// Member wants Tuesday 10-11am every week
const result = await createRecurringBookingAction({
  coachId: 'coach-123',
  dayOfWeek: 2, // Tuesday
  startTime: '10:00',
  endTime: '11:00',
  startDate: '2025-01-07',
  endDate: null, // Indefinite
});

// ✅ Creates recurring_booking record
// ✅ Immediately generates next 6 weeks of sessions
// ✅ Cron job will keep generating sessions going forward
```

### Flow 3: Member Books One-Time Session

```typescript
// Member books just one specific slot
const result = await bookAvailableSlotAction({
  coachId: 'coach-123',
  startTime: new Date('2025-01-15 14:00:00'),
  endTime: new Date('2025-01-15 15:00:00'),
});

// ✅ Creates training_session immediately
// ✅ Creates booking linked to that session
// ✅ Sets oneTimeBookingId reference
```

### Flow 4: Automatic Session Generation (Cron Job)

**Runs daily at 2:00 AM**

```typescript
// What happens:
1. Fetch all recurring_bookings where status='ACTIVE'
2. For each booking:
   - Generate sessions for next 6 weeks
   - Skip dates in blocked_slots
   - Skip if session already exists
   - Link via recurringBookingId
3. Mark past sessions as 'completed'
```

---

## Best Practices

### For Coaches
1. **Set weekly availability early** - This allows members to book
2. **Block known absences in advance** - Prevents double-booking
3. **Use availability_additions sparingly** - For exceptional cases only

### For Developers
1. **Always use transactions** when creating session + booking
2. **Check blocked_slots** before session creation
3. **Revalidate paths** after booking changes for cache updates
4. **Monitor cron job logs**

---

## Troubleshooting

### Sessions not generating?
**Check**:
1. `recurring_bookings.status = 'ACTIVE'`
2. Cron job ran successfully
3. Coach has `coachSettings.defaultRoomId` set (if room required)
4. No blocking conflicts in date range

### Member can't book?
**Check**:
1. Coach has `weekly_availability` for that day
2. Time slot not in `blocked_slots`
3. No overlapping `recurring_bookings`
4. Session hasn't started yet

