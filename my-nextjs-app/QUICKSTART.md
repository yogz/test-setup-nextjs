# Quick Start: Recurring Bookings Implementation

## 🚀 What's New

You now have a complete recurring bookings system with:
- ✅ Recurring member reservations (e.g., "every Tuesday 10am")
- ✅ Automatic session generation via cron job
- ✅ Coach availability exceptions (blocked slots + additions)
- ✅ Clear session lifecycle tracking

## 📋 Implementation Checklist

### 1. Generate Migration Files

```bash
# If using Drizzle Kit
npx drizzle-kit generate:pg

# This creates migration files in drizzle/ folder
```

### 2. Review Generated Migrations

Check the generated SQL files to ensure:
- New tables created: `recurring_bookings`, `availability_additions`
- New columns added to `training_sessions`
- Enum values updated for `session_status`

### 3. Apply Database Migration

**Option A: Using Drizzle Push (for dev)**
```bash
npx drizzle-kit push:pg
```

**Option B: Using Drizzle Migrate (for prod)**
```bash
npx drizzle-kit migrate
```

### 4. Update Existing Data

If you have existing sessions with old status values:

```sql
-- Connect to your database and run:
UPDATE training_sessions
SET status = CASE
  WHEN status = 'PLANNED' THEN 'scheduled'
  WHEN status = 'COMPLETED' THEN 'completed'
  WHEN status = 'CANCELLED' THEN 'cancelled'
  ELSE status
END;
```

### 5. Set Environment Variable

Add to `.env.local`:

```bash
# Generate a secure secret
CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "CRON_SECRET=$CRON_SECRET" >> .env.local
```

### 6. Test Locally

**Test Manual Session Generation:**

```bash
# Start your dev server
npm run dev

# In another terminal, test the admin endpoint
curl -X POST http://localhost:3000/api/admin/generate-sessions \
  -H "Content-Type: application/json" \
  # Note: Requires authenticated owner session
```

**Test Creating Recurring Booking:**

Create a simple test page or use your existing UI to call:

```typescript
import { createRecurringBookingAction } from '@/app/actions/recurring-booking-actions';

// Example usage
const result = await createRecurringBookingAction({
  coachId: 'your-coach-id',
  dayOfWeek: 2, // Tuesday
  startTime: '10:00',
  endTime: '11:00',
  startDate: new Date().toISOString().split('T')[0],
  endDate: null, // Indefinite
});

console.log(result);
```

### 7. Deploy to Vercel

```bash
# Commit all changes
git add .
git commit -m "feat: Implement recurring bookings architecture"

# Push to deploy
git push origin main
```

### 8. Configure Vercel Environment

In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add `CRON_SECRET` with the value from Step 5
3. Redeploy if needed

### 9. Verify Cron Job

In Vercel Dashboard:
1. Go to your project → Cron Jobs
2. You should see: `/api/cron/generate-sessions` scheduled daily at 02:00 UTC
3. Wait for first execution or trigger manually from dashboard

## 🧪 Testing Your Implementation

### Test 1: Create Recurring Booking

```typescript
// As a member, create a recurring booking
const booking = await createRecurringBookingAction({
  coachId: 'coach-abc',
  dayOfWeek: 1, // Monday
  startTime: '09:00',
  endTime: '10:00',
  startDate: '2025-02-03', // Next Monday
});

// Should return: { success: true, data: { id: '...', ... } }
```

### Test 2: Verify Sessions Generated

```sql
-- Check that sessions were created
SELECT * FROM training_sessions
WHERE recurring_booking_id = '<booking-id-from-above>'
ORDER BY start_time;

-- Should show ~6 weeks of Monday 9am sessions
```

### Test 3: Cancel Recurring Booking

```typescript
const result = await cancelRecurringBookingAction({
  recurringBookingId: '<booking-id>',
  futureOnly: true,
});

// Should return: { success: true }
```

### Test 4: Verify Cancellation

```sql
-- All future sessions should be cancelled
SELECT status, start_time FROM training_sessions
WHERE recurring_booking_id = '<booking-id>'
AND start_time > NOW()
ORDER BY start_time;

-- All should show status = 'cancelled'
```

### Test 5: Manual Cron Trigger

```bash
# Trigger cron endpoint with secret
curl -X GET https://your-app.vercel.app/api/cron/generate-sessions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Should return:
# {
#   "success": true,
#   "data": {
#     "totalGenerated": 10,
#     "fromRecurringBookings": 10,
#     "markedCompleted": 5
#   }
# }
```

## 🐛 Common Issues

### Issue: `relation "recurring_bookings" does not exist`

**Solution**: Migration not applied yet.
```bash
npx drizzle-kit push:pg
```

### Issue: `enum value "scheduled" does not exist`

**Solution**: Enum not updated. Either:
1. Drop old enum: `DROP TYPE IF EXISTS session_status CASCADE;`
2. Re-run migration

### Issue: Cron job not running

**Checklist**:
- [ ] `vercel.json` committed and deployed
- [ ] `CRON_SECRET` environment variable set in Vercel
- [ ] Check Vercel → Cron Jobs section shows the job
- [ ] Check Vercel → Logs for errors

### Issue: `Coach has no default room configured`

**Solution**: Set default room for coach:
```sql
INSERT INTO coach_settings (coach_id, default_room_id, default_duration)
VALUES ('coach-id', 'room-id', 60);
```

## 📊 Monitoring

### Key Metrics to Watch

1. **Cron Job Success Rate**
   - Check Vercel logs daily
   - Should show successful runs at 02:00 UTC

2. **Session Generation Count**
   - Monitor how many sessions generated per run
   - Should be proportional to active recurring bookings

3. **Completed Sessions**
   - Verify past sessions auto-marked as completed
   - Query: `SELECT COUNT(*) FROM training_sessions WHERE status='completed'`

### Useful Queries

```sql
-- Active recurring bookings
SELECT COUNT(*) FROM recurring_bookings WHERE status = 'ACTIVE';

-- Sessions by status
SELECT status, COUNT(*) FROM training_sessions GROUP BY status;

-- Upcoming sessions (next 7 days)
SELECT COUNT(*) FROM training_sessions
WHERE start_time BETWEEN NOW() AND NOW() + INTERVAL '7 days'
AND status = 'scheduled';

-- Coach utilization
SELECT coach_id, COUNT(*) as booked_slots
FROM training_sessions
WHERE start_time > NOW() AND status = 'scheduled'
GROUP BY coach_id;
```

## 🎯 Next Steps

1. **Build Member UI**
   - Create booking form for recurring bookings
   - Show member's active recurring bookings
   - Allow cancellation

2. **Build Coach UI**
   - Add availability_additions management
   - Show recurring bookings for their slots
   - View upcoming sessions

3. **Add Notifications**
   - Email confirmations for new recurring bookings
   - Reminders before sessions
   - Cancellation notifications

4. **Implement Pricing**
   - Add `price_cents` to recurring_bookings
   - Calculate billing based on completed sessions

## 📚 Further Reading

- [BOOKING_ARCHITECTURE.md](./BOOKING_ARCHITECTURE.md) - Complete architecture docs
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Detailed migration steps
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

## 🆘 Need Help?

If something doesn't work:

1. **Check logs**: Vercel Dashboard → Your Project → Logs
2. **Review schema**: Compare your `schema.ts` with expected structure
3. **Test SQL queries**: Connect to DB and run test queries
4. **Check cron secret**: Ensure it's set correctly in Vercel

---

**Happy Coding! 🚀**
