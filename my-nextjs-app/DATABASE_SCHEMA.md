# Database Schema Documentation

This document describes the complete database schema for the Upgrade Coaching application.

## Overview

The database uses PostgreSQL with Drizzle ORM and is structured into two main domains:
1. **Authentication & User Management** - Better Auth tables for user authentication
2. **Gym Management** - Training sessions, bookings, memberships, and payments

---

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ sessions : "has many"
    users ||--o{ accounts : "has many"
    users ||--o{ coachMembers_as_coach : "coaches"
    users ||--o{ coachMembers_as_member : "member of"
    users ||--o{ trainingSessions : "coaches"
    users ||--o{ memberships : "has"
    users ||--o{ bookings : "books"
    users ||--o{ payments : "makes"
    users ||--o{ memberNotes_as_member : "receives notes"
    users ||--o{ memberNotes_as_coach : "writes notes"
    users ||--o{ coachAvailabilities : "has availability"

    locations ||--o{ rooms : "contains"
    locations ||--o{ coachAvailabilities : "for"

    rooms ||--o{ trainingSessions : "hosts"
    rooms ||--o{ coachAvailabilities : "in"

    trainingSessions ||--o{ bookings : "has"
    trainingSessions ||--o{ memberNotes : "about"

    memberships ||--o{ bookings : "used for"
    memberships ||--o{ payments : "paid by"

    users {
        text id PK "UUID"
        varchar email UK "max 255, required"
        boolean emailVerified "default false"
        varchar name "max 255"
        text image
        varchar dateOfBirth "YYYY-MM-DD"
        varchar sex "male/female/non-binary/prefer-not-to-say"
        varchar phone "international format"
        varchar role "member/coach/owner, default member"
        boolean hasCompletedOnboarding "default false"
        timestamp createdAt "default now()"
        timestamp updatedAt "default now()"
    }

    sessions {
        text id PK "UUID"
        text token UK "UUID"
        timestamp expiresAt "required"
        text ipAddress
        text userAgent
        text userId FK "CASCADE"
        timestamp createdAt "default now()"
        timestamp updatedAt "default now()"
    }

    accounts {
        text id PK "UUID"
        text accountId "required"
        text providerId "required"
        text userId FK "CASCADE"
        text accessToken
        text refreshToken
        text idToken
        timestamp accessTokenExpiresAt
        timestamp refreshTokenExpiresAt
        text scope
        text password
        timestamp createdAt "default now()"
        timestamp updatedAt "default now()"
    }

    verifications {
        text id PK "UUID"
        text identifier "required"
        text value "required"
        timestamp expiresAt "required"
        timestamp createdAt "default now()"
        timestamp updatedAt "default now()"
    }

    locations {
        text id PK "UUID"
        varchar name "max 255, required"
        text address
        varchar city "max 100"
        varchar country "max 100"
        timestamp createdAt "default now()"
    }

    rooms {
        text id PK "UUID"
        text locationId FK "required"
        varchar name "max 255, required"
        integer capacity
        boolean isActive "default true"
        timestamp createdAt "default now()"
    }

    coachMembers {
        text id PK "UUID"
        text coachId FK "required"
        text memberId FK "required"
        varchar status "ACTIVE/INACTIVE, default ACTIVE"
        timestamp createdAt "default now()"
    }

    trainingSessions {
        text id PK "UUID"
        text coachId FK "required"
        text roomId FK "required"
        enum type "ONE_TO_ONE/GROUP"
        varchar title "max 255"
        text description
        timestamp startTime "required"
        timestamp endTime "required"
        integer capacity "1 for 1:1, N for GROUP"
        enum status "PLANNED/CANCELLED/COMPLETED"
        timestamp createdAt "default now()"
    }

    memberships {
        text id PK "UUID"
        text memberId FK "required"
        enum type "PACK/SUBSCRIPTION/SINGLE"
        varchar name "max 255"
        integer sessionsTotal "null = unlimited"
        integer sessionsUsed "default 0"
        date startDate
        date endDate
        boolean isActive "default true"
        timestamp createdAt "default now()"
    }

    bookings {
        text id PK "UUID"
        text sessionId FK "required"
        text memberId FK "required"
        enum status "CONFIRMED/CANCELLED_BY_MEMBER/CANCELLED_BY_COACH/NO_SHOW/WAITLIST"
        timestamp createdAt "default now()"
        timestamp cancelledAt
        text membershipId FK
    }

    payments {
        text id PK "UUID"
        text memberId FK "required"
        text membershipId FK
        integer amountCents "required"
        varchar currency "max 3, default EUR"
        varchar method "max 50, stripe/sumup/cash"
        varchar externalRef "max 255"
        enum status "PENDING/PAID/FAILED/REFUNDED"
        timestamp createdAt "default now()"
    }

    memberNotes {
        text id PK "UUID"
        text memberId FK "required"
        text coachId FK "required"
        text sessionId FK
        text note "required"
        timestamp createdAt "default now()"
    }

    coachAvailabilities {
        text id PK "UUID"
        text coachId FK "required"
        text locationId FK
        text roomId FK
        timestamp startTime "required"
        timestamp endTime "required"
        timestamp createdAt "default now()"
    }
```

---

## Tables by Domain

### 🔐 Authentication & Identity

#### `users`
Core user table for all application users (members, coaches, owners).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID primary key |
| email | varchar(255) | UNIQUE, NOT NULL | User email address |
| emailVerified | boolean | NOT NULL, default false | Email verification status |
| name | varchar(255) | | User's full name |
| image | text | | Profile picture URL |
| dateOfBirth | varchar(10) | | YYYY-MM-DD format |
| sex | varchar(20) | | male/female/non-binary/prefer-not-to-say |
| phone | varchar(20) | | International format (e.g., +33 6 12 34 56 78) |
| role | varchar(20) | NOT NULL, default 'member' | member/coach/owner |
| hasCompletedOnboarding | boolean | NOT NULL, default false | Onboarding completion flag |
| createdAt | timestamp | NOT NULL, default now() | Account creation timestamp |
| updatedAt | timestamp | NOT NULL, default now() | Last update timestamp |

**Indexes:** email (unique)

---

#### `sessions`
Active user sessions managed by Better Auth.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID primary key |
| token | text | UNIQUE, NOT NULL | Session JWT token (UUID) |
| expiresAt | timestamp | NOT NULL | Session expiration time |
| ipAddress | text | | Client IP address |
| userAgent | text | | Browser user agent |
| userId | text | FK → users(id), NOT NULL | User owning this session |
| createdAt | timestamp | NOT NULL, default now() | Session start time |
| updatedAt | timestamp | NOT NULL, default now() | Last activity time |

**Foreign Keys:**
- userId → users(id) ON DELETE CASCADE

**Indexes:** token (unique)

---

#### `accounts`
OAuth providers and password authentication linked to users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID primary key |
| accountId | text | NOT NULL | External provider account ID |
| providerId | text | NOT NULL | Provider name (google/apple/email) |
| userId | text | FK → users(id), NOT NULL | Associated user |
| accessToken | text | | OAuth access token |
| refreshToken | text | | OAuth refresh token |
| idToken | text | | OAuth ID token |
| accessTokenExpiresAt | timestamp | | Access token expiration |
| refreshTokenExpiresAt | timestamp | | Refresh token expiration |
| scope | text | | OAuth scopes |
| password | text | | Hashed password for email auth |
| createdAt | timestamp | NOT NULL, default now() | Account link creation |
| updatedAt | timestamp | NOT NULL, default now() | Last update |

**Foreign Keys:**
- userId → users(id) ON DELETE CASCADE

---

#### `verifications`
Email verification codes and magic link tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID primary key |
| identifier | text | NOT NULL | Email or identifier |
| value | text | NOT NULL | Verification code/token |
| expiresAt | timestamp | NOT NULL | Expiration time |
| createdAt | timestamp | default now() | Creation time |
| updatedAt | timestamp | default now() | Update time |

**Note:** No foreign key to users (can verify before account creation)

---

### 🏋️ Gym Management Domain

#### `locations`
Physical gym locations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID primary key |
| name | varchar(255) | NOT NULL | Location name |
| address | text | | Full street address |
| city | varchar(100) | | City name |
| country | varchar(100) | | Country name |
| createdAt | timestamp | NOT NULL, default now() | Creation time |

---

#### `rooms`
Individual rooms/spaces within locations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID primary key |
| locationId | text | FK → locations(id), NOT NULL | Parent location |
| name | varchar(255) | NOT NULL | Room name |
| capacity | integer | | Maximum occupancy |
| isActive | boolean | NOT NULL, default true | Room availability |
| createdAt | timestamp | NOT NULL, default now() | Creation time |

**Foreign Keys:**
- locationId → locations(id)

---

#### `coachMembers`
Many-to-many relationship between coaches and their assigned members.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID primary key |
| coachId | text | FK → users(id), NOT NULL | Coach user |
| memberId | text | FK → users(id), NOT NULL | Member user |
| status | varchar(20) | NOT NULL, default 'ACTIVE' | ACTIVE/INACTIVE |
| createdAt | timestamp | NOT NULL, default now() | Assignment time |

**Foreign Keys:**
- coachId → users(id)
- memberId → users(id)

---

#### `trainingSessions`
Bookable training sessions/classes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID primary key |
| coachId | text | FK → users(id), NOT NULL | Coach leading session |
| roomId | text | FK → rooms(id), NOT NULL | Location/room |
| type | enum | NOT NULL | ONE_TO_ONE / GROUP |
| title | varchar(255) | | Session title |
| description | text | | Detailed description |
| startTime | timestamp | NOT NULL | Session start |
| endTime | timestamp | NOT NULL | Session end |
| capacity | integer | | 1 for 1:1, N for group |
| status | enum | NOT NULL, default 'PLANNED' | PLANNED/CANCELLED/COMPLETED |
| createdAt | timestamp | NOT NULL, default now() | Creation time |

**Foreign Keys:**
- coachId → users(id)
- roomId → rooms(id)

**Enums:**
- type: ONE_TO_ONE, GROUP
- status: PLANNED, CANCELLED, COMPLETED

---

#### `memberships`
Member subscription packages and session packs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID primary key |
| memberId | text | FK → users(id), NOT NULL | Member who owns this |
| type | enum | NOT NULL | PACK/SUBSCRIPTION/SINGLE |
| name | varchar(255) | | Package name |
| sessionsTotal | integer | | Total sessions (null = unlimited) |
| sessionsUsed | integer | NOT NULL, default 0 | Sessions consumed |
| startDate | date | | Validity start |
| endDate | date | | Validity end |
| isActive | boolean | NOT NULL, default true | Active status |
| createdAt | timestamp | NOT NULL, default now() | Purchase time |

**Foreign Keys:**
- memberId → users(id)

**Enums:**
- type: PACK, SUBSCRIPTION, SINGLE

**Business Logic:**
- PACK: Fixed number of sessions (sessionsTotal is set)
- SUBSCRIPTION: Unlimited sessions in time period (sessionsTotal is null)
- SINGLE: One-time session (sessionsTotal = 1)

---

#### `bookings`
Member reservations for training sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID primary key |
| sessionId | text | FK → trainingSessions(id), NOT NULL | Booked session |
| memberId | text | FK → users(id), NOT NULL | Member booking |
| status | enum | NOT NULL, default 'CONFIRMED' | Booking status |
| createdAt | timestamp | NOT NULL, default now() | Booking time |
| cancelledAt | timestamp | | Cancellation time |
| membershipId | text | FK → memberships(id) | Membership used |

**Foreign Keys:**
- sessionId → trainingSessions(id)
- memberId → users(id)
- membershipId → memberships(id)

**Enums:**
- status: CONFIRMED, CANCELLED_BY_MEMBER, CANCELLED_BY_COACH, NO_SHOW, WAITLIST

---

#### `payments`
Payment transaction records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID primary key |
| memberId | text | FK → users(id), NOT NULL | Member making payment |
| membershipId | text | FK → memberships(id) | Associated membership |
| amountCents | integer | NOT NULL | Amount in cents (e.g., 5000 = €50.00) |
| currency | varchar(3) | NOT NULL, default 'EUR' | ISO currency code |
| method | varchar(50) | | stripe/sumup/cash/etc |
| externalRef | varchar(255) | | External provider transaction ID |
| status | enum | NOT NULL, default 'PAID' | Payment status |
| createdAt | timestamp | NOT NULL, default now() | Payment time |

**Foreign Keys:**
- memberId → users(id)
- membershipId → memberships(id)

**Enums:**
- status: PENDING, PAID, FAILED, REFUNDED

**Note:** Amounts stored in cents to avoid floating-point precision issues

---

#### `memberNotes`
Coach notes about members and training sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID primary key |
| memberId | text | FK → users(id), NOT NULL | Member being noted |
| coachId | text | FK → users(id), NOT NULL | Coach writing note |
| sessionId | text | FK → trainingSessions(id) | Related session (optional) |
| note | text | NOT NULL | Note content |
| createdAt | timestamp | NOT NULL, default now() | Note creation time |

**Foreign Keys:**
- memberId → users(id)
- coachId → users(id)
- sessionId → trainingSessions(id)

---

#### `coachAvailabilities`
Coach availability schedule.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID primary key |
| coachId | text | FK → users(id), NOT NULL | Coach |
| locationId | text | FK → locations(id) | Preferred location |
| roomId | text | FK → rooms(id) | Preferred room |
| startTime | timestamp | NOT NULL | Availability start |
| endTime | timestamp | NOT NULL | Availability end |
| createdAt | timestamp | NOT NULL, default now() | Creation time |

**Foreign Keys:**
- coachId → users(id)
- locationId → locations(id)
- roomId → rooms(id)

---

## PostgreSQL Enums

### `session_type`
```sql
CREATE TYPE session_type AS ENUM ('ONE_TO_ONE', 'GROUP');
```
Training session types.

### `session_status`
```sql
CREATE TYPE session_status AS ENUM ('PLANNED', 'CANCELLED', 'COMPLETED');
```
Training session lifecycle status.

### `booking_status`
```sql
CREATE TYPE booking_status AS ENUM (
  'CONFIRMED',
  'CANCELLED_BY_MEMBER',
  'CANCELLED_BY_COACH',
  'NO_SHOW',
  'WAITLIST'
);
```
Booking reservation status.

### `membership_type`
```sql
CREATE TYPE membership_type AS ENUM ('PACK', 'SUBSCRIPTION', 'SINGLE');
```
Membership package types.

### `payment_status`
```sql
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
```
Payment transaction status.

---

## RBAC (Role-Based Access Control)

### User Roles

The system implements a 3-tier role hierarchy:

| Role | Level | Description |
|------|-------|-------------|
| member | 1 | Basic user - can manage own profile and bookings |
| coach | 2 | Can view all users, manage sessions, view analytics |
| owner | 3 | Full admin - can manage all users, roles, and system settings |

### Role Permissions Matrix

| Permission | Member | Coach | Owner |
|------------|--------|-------|-------|
| View own profile | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |
| View all users | ❌ | ✅ | ✅ |
| Update any user | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ✅ |
| Create training sessions | ❌ | ✅ | ✅ |
| Manage bookings | ✅ (own) | ✅ (all) | ✅ (all) |
| View analytics | ✅ (own) | ✅ (all) | ✅ (all) |

---

## Key Business Rules

### Booking Logic
1. **Capacity Check**: Bookings cannot exceed session capacity
2. **Membership Validation**: Members must have valid membership with available sessions
3. **Time Conflicts**: Members cannot book overlapping sessions
4. **Cancellation Policy**: Different rules for member vs coach cancellations

### Membership Logic
1. **Session Deduction**: `sessionsUsed` increments on confirmed booking
2. **Expiration**: `endDate` determines membership validity
3. **Unlimited**: `sessionsTotal = null` for unlimited subscriptions

### Payment Logic
1. **Cents Storage**: All amounts stored in cents (integer) to avoid precision issues
2. **External Tracking**: `externalRef` links to payment provider's transaction ID
3. **Refund Support**: Status can transition to REFUNDED with negative payment records

---

## Migrations

The schema is managed using Drizzle ORM migrations located in `lib/db/migrations/`.

### Current Migrations
- `0000_*` - Initial auth tables (users, sessions, accounts, verifications)
- `0001_*` - [Previous migration]
- `0002_*` - [Previous migration]
- `0003_previous_deathstrike.sql` - Gym domain tables (locations, rooms, sessions, bookings, etc.)

### Running Migrations

```bash
# Generate new migration from schema changes
npm run db:generate

# Push migration to database
npm run db:push

# Open Drizzle Studio to view data
npm run db:studio
```

---

## Database Indexes

### Recommended Additional Indexes

For optimal query performance, consider adding these indexes:

```sql
-- Frequently queried by email
CREATE INDEX idx_users_email ON users(email);

-- Session lookups by user
CREATE INDEX idx_sessions_user_id ON sessions(userId);

-- Bookings by session and member
CREATE INDEX idx_bookings_session_id ON bookings(sessionId);
CREATE INDEX idx_bookings_member_id ON bookings(memberId);

-- Training sessions by coach and time
CREATE INDEX idx_training_sessions_coach_id ON training_sessions(coachId);
CREATE INDEX idx_training_sessions_start_time ON training_sessions(startTime);

-- Memberships by member
CREATE INDEX idx_memberships_member_id ON memberships(memberId);
CREATE INDEX idx_memberships_active ON memberships(isActive) WHERE isActive = true;
```

---

## Security Considerations

1. **Password Storage**: Passwords stored in `accounts.password` are hashed using Better Auth
2. **Cascade Deletes**: Sessions and accounts cascade delete when user is deleted
3. **UUID Primary Keys**: All tables use UUIDs to prevent enumeration attacks
4. **Token Expiration**: Session and verification tokens have expiration timestamps
5. **RBAC Enforcement**: All mutations protected by role-based guards in `lib/rbac/guards.ts`

---

## Future Schema Enhancements

Potential additions for future versions:

1. **Attendance Tracking**: Record actual attendance vs bookings
2. **Session Recurrence**: Templates for recurring sessions
3. **Waitlist Management**: Auto-promotion when spots open
4. **Member Progress**: Track fitness goals and achievements
5. **Equipment Management**: Track equipment usage and maintenance
6. **Class Templates**: Reusable session configurations
7. **Notifications**: Booking confirmations, reminders, cancellations
8. **Reviews/Ratings**: Member feedback on sessions

---

## Database Connection

Connection managed via Drizzle ORM with PostgreSQL adapter.

**Configuration:** `lib/db/index.ts`

**Environment Variables Required:**
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

---

## Useful Queries

### Get member's active memberships
```sql
SELECT * FROM memberships
WHERE member_id = $1
  AND is_active = true
  AND (end_date IS NULL OR end_date >= CURRENT_DATE);
```

### Get upcoming sessions for a coach
```sql
SELECT * FROM training_sessions
WHERE coach_id = $1
  AND start_time >= NOW()
  AND status = 'PLANNED'
ORDER BY start_time ASC;
```

### Get member's booking history
```sql
SELECT b.*, ts.title, ts.start_time, ts.end_time, u.name as coach_name
FROM bookings b
JOIN training_sessions ts ON b.session_id = ts.id
JOIN users u ON ts.coach_id = u.id
WHERE b.member_id = $1
ORDER BY ts.start_time DESC;
```

---

**Last Updated:** 2025-01-19
**Schema Version:** 0003
**Drizzle ORM Version:** Latest
