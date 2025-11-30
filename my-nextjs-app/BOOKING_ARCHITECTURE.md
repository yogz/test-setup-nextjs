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

### Coach Availability Tables

#### 1. `weekly_availability` (Recurring Template)
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

**Example**:
```sql
-- Coach available every Monday 9am-12pm
INSERT INTO weekly_availability (coach_id, day_of_week, start_time, end_time, is_individual)
VALUES ('coach-123', 1, '09:00', '12:00', true);
```

#### 2. `blocked_slots` (Negative Exceptions)
```typescript
{
  id: string;
  coachId: string;
  startTime: Date; // Full timestamp
  endTime: Date;
  reason?: string; // "Vacation", "Conference"
}
```

**Usage**: Block specific dates/times when coach is unavailable.

**Example**:
```sql
-- Block Jan 15, 2025 10am-12pm
INSERT INTO blocked_slots (coach_id, start_time, end_time, reason)
VALUES ('coach-123', '2025-01-15 10:00:00', '2025-01-15 12:00:00', 'Doctor appointment');
```

#### 3. `availability_additions` (Positive Exceptions)
```typescript
{
  id: string;
  coachId: string;
  startTime: Date;
  endTime: Date;
  roomId?: string;
  reason?: string; // "Make-up session", "Special request"
}
```

**Usage**: Add one-time slots outside regular schedule.

**Example**:
```sql
-- Add exceptional slot on Saturday
INSERT INTO availability_additions (coach_id, start_time, end_time, reason)
VALUES ('coach-123', '2025-01-18 10:00:00', '2025-01-18 11:00:00', 'Make-up session');
```

---

### Member Booking Tables

#### 4. `recurring_bookings` (Recurring Reservations)
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
  status: 'ACTIVE' | 'CANCELLED';
}
```

**Usage**: Member's recurring reservation (e.g., "every Tuesday 10am").

**Example**:
```sql
-- Member books every Tuesday 10-11am, starting Jan 7
INSERT INTO recurring_bookings (member_id, coach_id, day_of_week, start_time, end_time, start_date)
VALUES ('member-456', 'coach-123', 2, '10:00', '11:00', '2025-01-07');
```

**Key Points**:
- Sessions are generated automatically by cron job
- Cancelling sets `status = 'CANCELLED'` and cancels future sessions
- No end_date = booking continues indefinitely

#### 5. `bookings` (One-Time Reservations)
```typescript
{
  id: string;
  sessionId: string; // Links to specific session
  memberId: string;
  status: 'CONFIRMED' | 'CANCELLED_BY_MEMBER' | 'CANCELLED_BY_COACH' | 'NO_SHOW';
}
```

**Usage**: Single session booking.

---

### Session Table

#### 6. `training_sessions` (Materialized Sessions)
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

**Key Points**:
- Generated automatically from `recurring_bookings`
- Created on-demand for `bookings`
- Stores **origin reference** for traceability
- Status updated automatically by cron job

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

// 3. Coach adds exceptional slot
// (Needs new action - similar to blockSlotAction)
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

### Flow 4: Member Cancels Recurring Booking

```typescript
// Cancel all future sessions
await cancelRecurringBookingAction({
  recurringBookingId: 'booking-id',
  futureOnly: true, // Don't cancel past/completed sessions
});

// ✅ Sets recurring_booking.status = 'CANCELLED'
// ✅ Cancels all future sessions with status='scheduled'
// ✅ Past sessions remain untouched
```

### Flow 5: Automatic Session Generation (Cron Job)

**Runs daily at 2:00 AM (Vercel Cron)**

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

**Endpoint**: `/api/cron/generate-sessions`

---

## API Reference

### Recurring Booking Actions

#### Create Recurring Booking
```typescript
createRecurringBookingAction(data: {
  coachId: string;
  dayOfWeek: number; // 0-6
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  startDate: string; // ISO date
  endDate?: string; // Optional
}): Promise<{ success: boolean; data?: RecurringBooking }>
```

#### Cancel Recurring Booking
```typescript
cancelRecurringBookingAction(data: {
  recurringBookingId: string;
  futureOnly?: boolean; // Default: true
}): Promise<{ success: boolean }>
```

#### Get My Recurring Bookings
```typescript
getMyRecurringBookingsAction(): Promise<{
  success: boolean;
  data?: RecurringBooking[];
}>
```

### Session Generation

#### Manual Trigger (Admin Only)
```bash
POST /api/admin/generate-sessions
Content-Type: application/json
Authorization: Bearer <session-token>

{
  "weeksAhead": 6
}
```

#### Cron Endpoint
```bash
GET /api/cron/generate-sessions
Authorization: Bearer <CRON_SECRET>
```

---

## Session Generation

### Generation Logic

```typescript
function generateSessionsForRecurringBooking(booking) {
  const horizon = today + 6 weeks;
  const sessions = [];

  for (date = today; date <= horizon; date++) {
    if (date.dayOfWeek === booking.dayOfWeek) {
      // Check if session already exists
      if (sessionExists(booking.id, date)) continue;

      // Check if slot is blocked
      if (isBlocked(booking.coachId, date)) continue;

      // Check date range
      if (date < booking.startDate || date > booking.endDate) continue;

      // Create session
      sessions.push({
        recurringBookingId: booking.id,
        coachId: booking.coachId,
        memberId: booking.memberId,
        startTime: combine(date, booking.startTime),
        endTime: combine(date, booking.endTime),
        status: 'scheduled',
      });
    }
  }

  db.insert(sessions);
}
```

### Completion Marking

```typescript
function markPastSessionsCompleted() {
  db.update(trainingSessions)
    .set({ status: 'completed' })
    .where(
      status = 'scheduled' AND
      endTime < NOW()
    );
}
```

---

## Best Practices

### For Coaches

1. **Set weekly availability early** - This allows members to book
2. **Block known absences in advance** - Prevents double-booking
3. **Use availability_additions sparingly** - For exceptional cases only

### For Members

1. **Recurring bookings for regular schedule** - Set and forget
2. **One-time bookings for trials** - No commitment
3. **Cancel with notice** - Respect coach's time

### For Developers

1. **Always use transactions** when creating session + booking
2. **Check blocked_slots** before session creation
3. **Revalidate paths** after booking changes for cache updates
4. **Monitor cron job logs** in Vercel dashboard

### Performance Tips

1. **Index frequently queried fields**:
   ```sql
   CREATE INDEX idx_sessions_coach_start ON training_sessions(coach_id, start_time);
   CREATE INDEX idx_recurring_status ON recurring_bookings(status);
   CREATE INDEX idx_blocked_coach_time ON blocked_slots(coach_id, start_time, end_time);
   ```

2. **Limit query ranges**:
   ```typescript
   // ✅ Good - bounded query
   WHERE start_time >= NOW() AND start_time <= NOW() + INTERVAL '6 weeks'

   // ❌ Bad - unbounded
   WHERE start_time >= NOW()
   ```

3. **Batch inserts** when generating multiple sessions

---

## Future Enhancements

### Potential Features

- [ ] **Pricing tiers** - Different prices per session
- [ ] **Waitlists** - Auto-fill cancelled slots
- [ ] **Member notifications** - Email/SMS reminders
- [ ] **Recurring booking editing** - Change time without cancelling
- [ ] **Coach availability forecasting** - Show utilization %
- [ ] **Multi-week patterns** - "Every other week"
- [ ] **Season passes** - Pre-paid bundles

### Technical Improvements

- [ ] **Event sourcing** - Full audit trail
- [ ] **Optimistic locking** - Prevent double-booking races
- [ ] **Background jobs** - Move to dedicated queue (BullMQ)
- [ ] **Caching layer** - Redis for availability queries
- [ ] **GraphQL subscriptions** - Real-time slot updates

---

## Troubleshooting

### Sessions not generating?

**Check**:
1. `recurring_bookings.status = 'ACTIVE'`
2. Cron job ran successfully (Vercel logs)
3. Coach has `coachSettings.defaultRoomId` set
4. No blocking conflicts in date range

### Member can't book?

**Check**:
1. Coach has `weekly_availability` for that day
2. Time slot not in `blocked_slots`
3. No overlapping `recurring_bookings`
4. Session hasn't started yet (can't book past)

### Cron job failing?

**Check**:
1. `CRON_SECRET` environment variable set
2. `vercel.json` deployed correctly
3. Database connection healthy
4. Check error logs in Vercel dashboard

---

**Version**: 1.0
**Last Updated**: January 2025
**Maintainer**: [Your Team]
