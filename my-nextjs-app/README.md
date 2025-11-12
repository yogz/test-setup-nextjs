# Next.js 16 Full-Stack Application

Modern Next.js 16 app with TypeScript, Drizzle ORM, Tailwind CSS, shadcn/ui, PostgreSQL, and Better Auth.

## 🚀 Quick Start

```bash
./start-dev.sh
```

Visit http://localhost:3000

## 📋 Requirements

- **Node.js 20.9+** (LTS)
- **Docker** (for PostgreSQL)
- **npm** or **yarn**

## 📦 Tech Stack

- **Next.js 16** - React framework with Turbopack
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Drizzle ORM** - Database toolkit
- **PostgreSQL** - Database
- **Better Auth** - Authentication
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
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Apple OAuth (optional)
APPLE_CLIENT_ID="your-apple-client-id"
APPLE_CLIENT_SECRET="your-apple-client-secret"
```

Generate secrets with:
```bash
openssl rand -base64 32
```

### Setting up OAuth Providers (Optional)

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing one
3. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
4. Set application type to "Web application"
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
6. Copy the Client ID and Client Secret to your `.env.local`

#### Apple OAuth Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
2. Create an App ID (if you don't have one)
3. Create a Service ID and configure "Sign In with Apple"
4. Set return URLs:
   - Development: `http://localhost:3000/api/auth/callback/apple`
   - Production: `https://yourdomain.com/api/auth/callback/apple`
5. Create a private key for Sign In with Apple
6. Generate the Client Secret JWT using the private key
7. Add credentials to your `.env.local`

**Note:** Social providers are optional. The app works with email/password authentication by default. Remove the OAuth environment variables if you don't want to use them.

## 🛡️ Authentication

- Server-side auth validation (Next.js 16 best practice)
- Email/password authentication with Better Auth
- **Google Sign In** (optional - configure in `.env.local`)
- **Apple Sign In** (optional - configure in `.env.local`)
- Session management
- Automatic redirects with `proxy.ts`

Visit `/login` to sign in or `/register` to create an account.

Social providers will only appear if you've configured the OAuth credentials in your environment variables.

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
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Protected dashboard pages
│   ├── (marketing)/     # Public marketing pages
│   └── api/             # API routes
├── components/
│   ├── layout/          # Layout components
│   ├── ui/              # shadcn/ui components
│   └── features/        # Feature-specific components
├── lib/
│   ├── auth/            # Better Auth configuration
│   ├── db/              # Database schema & connection
│   ├── actions/         # Server actions
│   └── validations/     # Zod schemas
├── proxy.ts             # Next.js 16 proxy (replaces middleware)
└── docker-compose.yml   # PostgreSQL & pgAdmin
```

## 🆕 What's New in Next.js 16

- **Turbopack**: Default bundler (5-10x faster)
- **proxy.ts**: Replaces middleware.ts
- **Async APIs**: All request APIs are now async
- **React 19.2**: Latest React features
- **ESLint Flat Config**: Modern ESLint configuration

## 🐛 Troubleshooting

### Infinite redirect loop on login
If you experience a redirect loop when clicking sign in:
1. Check that `/api` routes are properly excluded in `proxy.ts` matcher
2. Clear your browser cookies for `localhost:3000`
3. Restart the dev server: `npm run dev`

### Social OAuth not working
1. Verify redirect URIs in Google/Apple console match exactly:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/apple`
2. Check that credentials are in `.env.local` (not `.env`)
3. Restart dev server after adding OAuth credentials

### NPM warnings during installation
You may see warnings about deprecated packages like `@esbuild-kit/*`. These are safe to ignore - they come from transitive dependencies and don't affect functionality.

If you see moderate security vulnerabilities, the script automatically runs `npm audit fix`. Some vulnerabilities may require manual updates or are in dev dependencies only.

### Port already in use
```bash
# Stop all Docker containers
docker-compose down

# Or kill specific port
lsof -ti:3000 | xargs kill -9
```

### Database connection failed
```bash
# Reset database
./reset-db.sh
```

### Module not found errors
```bash
# Clean install
./cleanup.sh
npm install
```

## 📝 Common Tasks

### Add a new protected route
1. Create page in `app/(dashboard)/your-route/page.tsx`
2. It's automatically protected by the dashboard layout

### Add a new API endpoint
1. Create route in `app/api/your-endpoint/route.ts`
2. Use Better Auth's session validation if needed

### Add a new database table
1. Update `lib/db/schema.ts`
2. Run `npm run db:push`
3. Update types in `types/index.ts`

## 🔒 Security Notes

- Never commit `.env.local`
- Rotate `BETTER_AUTH_SECRET` in production
- Use strong passwords (min 8 characters)
- Enable email verification in production

## 📄 License

MIT

---

Built with ❤️ using Next.js 16
