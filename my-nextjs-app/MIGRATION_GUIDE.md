# Migration Guide: New Booking Architecture

This guide will help you migrate your database to the new booking architecture that supports recurring bookings and better session management.

## Overview of Changes

### New Tables
1. **`recurring_bookings`** - Stores recurring booking patterns (e.g., "every Tuesday at 10am")
2. **`availability_additions`** - Exceptional availability slots added by coaches

### Modified Tables
1. **`training_sessions`** - Added new fields:
   - `recurringBookingId` - Links to parent recurring booking
   - `oneTimeBookingId` - Links to one-time booking
   - `memberId` - Direct reference to member for quick queries

### Updated Enums
- `session_status` enum values changed:
  - `PLANNED` → `scheduled`
  - `COMPLETED` → `completed`
  - `CANCELLED` → `cancelled`
  - Added: `no_show`

## Migration Steps

### Step 1: Backup Your Database

**IMPORTANT**: Always backup your database before running migrations!

```bash
# For Neon/Postgres
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Step 2: Generate Migration Files

We're using Drizzle ORM. Generate the migration:

```bash
npm run db:generate
```

This will create migration files in `drizzle/` directory based on schema changes.

### Step 3: Review Migration Files

**IMPORTANT**: Before applying, review the generated migration files to ensure they:
- Create new tables correctly
- Add new columns with appropriate defaults
- Update enum values properly

### Step 4: Apply Migration

```bash
npm run db:push
# or
npm run db:migrate
```

### Step 5: Update Existing Data (if needed)

If you have existing data with old status values, run this SQL:

```sql
-- Update training_sessions status values
UPDATE training_sessions
SET status = CASE
  WHEN status = 'PLANNED' THEN 'scheduled'
  WHEN status = 'COMPLETED' THEN 'completed'
  WHEN status = 'CANCELLED' THEN 'cancelled'
  ELSE status
END;
```

### Step 6: Set Environment Variables

Add to your `.env.local`:

```bash
# Cron Job Secret (generate a random string)
CRON_SECRET=your-super-secret-cron-key-change-me
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 7: Test Cron Job Locally

```bash
# Test the manual endpoint (requires owner role)
curl -X POST http://localhost:3000/api/admin/generate-sessions \
  -H "Content-Type: application/json" \
  -d '{"weeksAhead": 6}'
```

### Step 8: Deploy to Vercel

1. **Add Environment Variable** in Vercel Dashboard:
   - Variable: `CRON_SECRET`
   - Value: Your generated secret

2. **Deploy**:
   ```bash
   git add .
   git commit -m "feat: Implement recurring bookings architecture"
   git push
   ```

3. **Verify Cron Job** in Vercel Dashboard:
   - Go to Project Settings → Cron Jobs
   - Should see: `generate-sessions` running daily at 2:00 AM

## New Features Available

### 1. Recurring Bookings (for Members)

```typescript
import { createRecurringBookingAction } from '@/app/actions/recurring-booking-actions';

// Create a recurring booking
await createRecurringBookingAction({
  coachId: 'coach-id',
  dayOfWeek: 2, // Tuesday
  startTime: '10:00',
  endTime: '11:00',
  startDate: '2025-01-01',
  endDate: '2025-06-30', // Optional, null = indefinite
});
```

### 2. Cancel Recurring Booking

```typescript
import { cancelRecurringBookingAction } from '@/app/actions/recurring-booking-actions';

// Cancel all future occurrences
await cancelRecurringBookingAction({
  recurringBookingId: 'booking-id',
  futureOnly: true,
});
```

### 3. Get Member's Recurring Bookings

```typescript
import { getMyRecurringBookingsAction } from '@/app/actions/recurring-booking-actions';

const result = await getMyRecurringBookingsAction();
// Returns all recurring bookings with next 10 upcoming sessions
```

### 4. Manual Session Generation (Admin)

```bash
# Trigger via API
POST /api/admin/generate-sessions
Authorization: Bearer your-session-token

{
  "weeksAhead": 8
}
```

## Architecture Benefits

### Before (Old Architecture)
- ❌ Manual session generation required
- ❌ Each booking was independent (no recurring concept)
- ❌ Hard to manage "cancel all future sessions"
- ❌ Coach had to manually mark sessions as completed

### After (New Architecture)
- ✅ Automatic daily session generation (cron job)
- ✅ Recurring bookings with parent-child relationship
- ✅ Easy cancellation of recurring bookings
- ✅ Automatic completion marking for past sessions
- ✅ Clear separation: availability rules → bookings → sessions

## Rollback Plan

If you need to rollback:

1. **Restore database backup**:
   ```bash
   psql $DATABASE_URL < backup_YYYYMMDD.sql
   ```

2. **Revert code changes**:
   ```bash
   git revert HEAD
   git push
   ```

## Troubleshooting

### Issue: Migration fails with "enum already exists"

**Solution**: Drop the old enum first (CAUTION: This will delete data):
```sql
DROP TYPE IF EXISTS session_status CASCADE;
```

### Issue: Cron job not triggering

**Checks**:
1. Verify `vercel.json` is committed and deployed
2. Check Vercel Dashboard → Cron Jobs
3. Verify `CRON_SECRET` environment variable is set
4. Check logs: Vercel Dashboard → Logs

### Issue: Sessions not generating

**Debug**:
```bash
# Check cron endpoint manually
curl https://your-app.vercel.app/api/cron/generate-sessions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Old status values updated
- [ ] Create recurring booking works
- [ ] Cancel recurring booking works
- [ ] Cron job generates sessions
- [ ] Manual generation endpoint works
- [ ] Past sessions marked as completed
- [ ] No blocking conflicts detected

## Support

For issues or questions:
1. Check Vercel logs
2. Check database query logs
3. Review this migration guide
4. Check the `/api/admin/generate-sessions` endpoint status

---

**Last Updated**: January 2025
**Compatible With**: Drizzle ORM + PostgreSQL (Neon/Vercel)
