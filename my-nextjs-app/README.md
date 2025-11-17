# Next.js 16 Starter with Better Auth

Minimal Next.js 16 starter with TypeScript, Drizzle ORM, Tailwind CSS, PostgreSQL, and Better Auth pre-configured.

## 🚀 Quick Start

```bash
./start-dev.sh
```

Visit http://localhost:3000 to see "Hello World"

## 📋 Requirements

- **Node.js 20.9+** (LTS)
- **Docker** (for PostgreSQL)
- **npm** or **yarn**

## 📦 Tech Stack

- **Next.js 16** - React framework with Turbopack
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component setup
- **Drizzle ORM** - Database toolkit
- **PostgreSQL** - Database
- **Better Auth** - Authentication (configured, ready to use)
- **Docker** - Containerization

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Build for production

# Database
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio
npm run docker:up        # Start containers
npm run docker:down      # Stop containers

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format with Prettier

# Maintenance
./cleanup.sh             # Delete everything (start fresh)
./reset-db.sh            # Reset database only
```

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and update:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_TRUST_HOST="true"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Apple OAuth (optional)
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""
```

Generate a secure secret with:
```bash
openssl rand -base64 32
```

## 🛡️ Authentication Setup

Better Auth is fully configured and ready to use. When you're ready to add authentication:

1. **Create your auth pages** (login, register, etc.)
2. **Update proxy.ts** to add route protection (examples included in comments)
3. **Use the configured auth client**:

```tsx
// In a client component
import { authClient } from '@/lib/auth/client';

// Sign up
await authClient.signUp.email({
  email,
  password,
  name,
});

// Sign in
await authClient.signIn.email({
  email,
  password,
});

// Sign out
await authClient.signOut();
```

### Security Features (Pre-configured)

✅ **Password Hashing**: Uses scrypt (OWASP recommended)
✅ **Session Management**: 7-day sessions with automatic refresh
✅ **CSRF Protection**: Enabled by default
✅ **Secure Cookies**: HttpOnly, SameSite=lax
✅ **Next.js 16 Cookie Plugin**: Automatic cookie handling in Server Actions
✅ **Minimum Password Length**: 12 characters (configurable)
✅ **OAuth Ready**: Google & Apple (just add credentials)

### Password Requirements

- Minimum: 12 characters (production-grade)
- Maximum: 128 characters
- Change in `lib/auth/auth.ts` if needed

## 🗄️ Database Access

**pgAdmin**: http://localhost:5050
- Email: admin@admin.com
- Password: admin

**Drizzle Studio**:
```bash
npm run db:studio
```

## 📁 Project Structure

```
├── app/
│   ├── api/auth/[...all]/ # Better Auth API routes
│   └── page.tsx           # Hello World page
├── lib/
│   ├── auth/
│   │   ├── auth.ts       # Better Auth config (SERVER)
│   │   └── client.ts     # Auth client (CLIENT)
│   ├── db/
│   │   ├── index.ts      # Database connection
│   │   └── schema.ts     # Database schema
│   └── constants/
│       └── routes.ts     # Route constants
├── types/                # Type definitions
├── config/              # App configuration
├── proxy.ts             # Next.js 16 proxy (middleware replacement)
└── docker-compose.yml   # PostgreSQL & pgAdmin
```

## 🆕 What's New in Next.js 16

- **Turbopack**: Default bundler (5-10x faster)
- **proxy.ts**: Replaces middleware.ts
- **Async APIs**: All request APIs are now async
- **React 19.2**: Latest React features
- **ESLint Flat Config**: Modern ESLint configuration

## 🔒 Security Best Practices

✅ **Never commit `.env.local`** - Contains secrets
✅ **Rotate secrets in production** - Generate new `BETTER_AUTH_SECRET`
✅ **Enable email verification** - Set `requireEmailVerification: true` in production
✅ **Use HTTPS in production** - Automatically enabled in the config
✅ **Strong passwords** - 12+ characters enforced
✅ **CSRF protection** - Enabled by default
✅ **Secure cookies** - HttpOnly, Secure (production), SameSite

### Configuration Details (lib/auth/auth.ts)

The Better Auth configuration includes:

- ✅ **nextCookies plugin** - Required for Next.js Server Actions
- ✅ **drizzleAdapter** - Type-safe database operations
- ✅ **emailAndPassword** - Secure credential authentication
- ✅ **socialProviders** - OAuth ready (Google, Apple)
- ✅ **session management** - Auto-refresh, 7-day expiry
- ✅ **advanced security** - Secure cookies, CSRF protection
- ✅ **trustedOrigins** - Origin validation

## 🐛 Troubleshooting

### Port already in use
```bash
docker-compose down
lsof -ti:3000 | xargs kill -9
```

### Database connection failed
```bash
./reset-db.sh
```

### Module not found errors
```bash
./cleanup.sh
npm install
```

### NPM warnings
Warnings about deprecated packages like `@esbuild-kit/*` are safe to ignore - they're transitive dependencies.

## 📝 Next Steps

1. **Create your pages** - Add login, register, dashboard pages
2. **Customize styling** - Update Tailwind config and global styles
3. **Add features** - Build on the authenticated foundation
4. **Deploy** - Use Vercel, Railway, or your preferred platform

## 📚 Resources

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Better Auth Docs](https://www.better-auth.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [shadcn/ui](https://ui.shadcn.com)

## 📄 License

MIT

---

Built with Next.js 16 + Better Auth
