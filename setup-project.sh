#!/bin/bash

set -e

echo "🚀 Setting up your Next.js 16 development environment..."
echo "=========================================================="

PROJECT_NAME=${1:-my-nextjs-app}

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Node.js version
check_node_version() {
    echo -e "${BLUE}🔍 Checking Node.js version...${NC}"
    
    if ! command -v node >/dev/null 2>&1; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="20.9.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then 
        echo -e "${RED}❌ Node.js $REQUIRED_VERSION or higher is required${NC}"
        echo -e "${YELLOW}Current version: v$NODE_VERSION${NC}"
        echo -e "${YELLOW}Please upgrade Node.js to continue${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js v$NODE_VERSION${NC}"
}

# Check required tools
check_requirements() {
    echo -e "${BLUE}🔍 Checking required tools...${NC}"
    
    local missing=()
    command -v docker >/dev/null 2>&1 || missing+=("docker")
    command -v openssl >/dev/null 2>&1 || missing+=("openssl")
    
    if [ ${#missing[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required tools: ${missing[*]}${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements met${NC}"
}

check_node_version
check_requirements

# Detect if running in GitHub Codespaces
if [ -n "$CODESPACE_NAME" ]; then
    IS_CODESPACE=true
    CODESPACE_URL="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo -e "${YELLOW}📡 GitHub Codespace detected: $CODESPACE_NAME${NC}"
else
    IS_CODESPACE=false
    APP_URL="http://localhost:3000"
    echo -e "${BLUE}💻 Local environment detected${NC}"
fi

echo -e "${BLUE}📁 Creating project: $PROJECT_NAME${NC}"

# Create Next.js app with TypeScript
npx create-next-app@latest $PROJECT_NAME \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm

cd $PROJECT_NAME

echo -e "${GREEN}✅ Next.js 16 project created${NC}"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install \
  drizzle-orm@latest \
  postgres@latest \
  better-auth@latest \
  zod@latest \
  @hookform/resolvers@latest \
  react-hook-form@latest \
  lucide-react@latest \
  class-variance-authority@latest \
  clsx@latest \
  tailwind-merge@latest

# Install dev dependencies
echo -e "${BLUE}📦 Installing dev dependencies...${NC}"
npm install -D \
  drizzle-kit@latest \
  @types/node@latest \
  prettier@latest \
  prettier-plugin-tailwindcss@latest \
  eslint-config-prettier@latest \
  @eslint/eslintrc@latest \
  dotenv-cli@latest

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Fix security vulnerabilities
echo -e "${BLUE}🔒 Fixing security vulnerabilities...${NC}"
npm audit fix --quiet 2>/dev/null || echo -e "${YELLOW}⚠️  Some vulnerabilities couldn't be auto-fixed${NC}"

# Setup shadcn/ui with init
echo -e "${BLUE}🎨 Setting up shadcn/ui...${NC}"

npx shadcn@latest init -d -y 2>/dev/null || {
    echo -e "${YELLOW}⚠️  shadcn/ui CLI not available, creating manual configuration...${NC}"
    
    cat > components.json << 'EOF'
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
EOF
    
    mkdir -p lib
    cat > lib/utils.ts << 'EOF'
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
EOF

    cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
EOF
}

echo -e "${GREEN}✅ shadcn/ui configured${NC}"

# Create project structure
echo -e "${BLUE}📂 Creating project structure...${NC}"

# App directory with route groups (Next.js pattern)
# Route groups (folders in parentheses) organize routes without affecting URLs
mkdir -p app/\(auth\)              # For login, register pages (when you create them)
mkdir -p app/\(dashboard\)         # For protected dashboard pages
mkdir -p app/\(marketing\)         # For public pages (about, pricing, etc)
mkdir -p app/api/auth/\[...all\]   # Better Auth API routes

# Component directories (ready for your UI)
mkdir -p components/{ui,forms,layout}
mkdir -p components/features       # Feature-specific components

# Lib directories (backend logic)
mkdir -p lib/{actions,api,auth,validations,constants}
mkdir -p lib/db/migrations

# Supporting directories
mkdir -p hooks types config public/images

echo -e "${GREEN}✅ Directory structure created${NC}"

# Create Docker Compose file
echo -e "${BLUE}🐳 Creating Docker Compose configuration...${NC}"
cat > docker-compose.yml << 'EOF'
services:
  postgres:
    image: postgres:16-alpine
    container_name: nextjs-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d myapp"]
      interval: 5s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: nextjs-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
      PGADMIN_CONFIG_SERVER_MODE: 'False'
      PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED: 'False'
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
  pgadmin_data:
EOF

# Create .devcontainer
echo -e "${BLUE}📦 Creating devcontainer configuration...${NC}"
mkdir -p .devcontainer
cat > .devcontainer/devcontainer.json << 'EOF'
{
  "name": "Next.js 16 Development Environment",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "forwardPorts": [3000, 5432, 5050],
  "portsAttributes": {
    "5432": {"label": "PostgreSQL"},
    "5050": {"label": "pgAdmin"},
    "3000": {"label": "Next.js App", "onAutoForward": "openBrowser"}
  },
  "postCreateCommand": "npm install && docker-compose up -d",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss",
        "ms-azuretools.vscode-docker"
      ],
      "settings": {
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": "explicit"
        }
      }
    }
  }
}
EOF

# Create Prettier config
echo -e "${BLUE}💅 Configuring Prettier...${NC}"
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-tailwindcss"]
}
EOF

cat > .prettierignore << 'EOF'
node_modules
.next
out
dist
build
*.config.js
*.config.mjs
.drizzle
EOF

# Create ESLint flat config (Next.js 16)
echo -e "${BLUE}🔍 Configuring ESLint (Flat Config)...${NC}"
cat > eslint.config.mjs << 'EOF'
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "prettier"),
  {
    rules: {
      "prefer-const": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ]
    }
  }
];

export default eslintConfig;
EOF

# Create environment files
echo -e "${BLUE}🔐 Creating environment files...${NC}"

if [ "$IS_CODESPACE" = true ]; then
    cat > .env.local << EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
BETTER_AUTH_URL="${CODESPACE_URL}"
BETTER_AUTH_TRUST_HOST="true"
NEXT_PUBLIC_APP_URL="${CODESPACE_URL}"
NODE_ENV="development"

# Google OAuth (optional - remove if not using)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Apple OAuth (optional - remove if not using)
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""
EOF
else
    cat > .env.local << EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_TRUST_HOST="true"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Google OAuth (optional - remove if not using)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Apple OAuth (optional - remove if not using)
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""
EOF
fi

cat > .env.example << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"
BETTER_AUTH_SECRET="your-secret-key-change-in-production"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_TRUST_HOST="true"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Google OAuth (optional - remove if not using)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Apple OAuth (optional - remove if not using)
APPLE_CLIENT_ID="your-apple-client-id"
APPLE_CLIENT_SECRET="your-apple-client-secret"
EOF

echo -e "${GREEN}✅ Environment files created${NC}"

# Create Drizzle config
echo -e "${BLUE}🗄️  Configuring Drizzle ORM...${NC}"
cat > drizzle.config.ts << 'EOF'
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
EOF

# Create database schema with proper Better Auth IDs
cat > lib/db/schema.ts << 'EOF'
import { pgTable, text, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique().$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
EOF

# Create database connection
cat > lib/db/index.ts << 'EOF'
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
EOF

# Create Better Auth configuration
echo -e "${BLUE}🔒 Configuring Better Auth with security best practices...${NC}"

cat > lib/auth/auth.ts << 'EOF'
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { db } from '@/lib/db';
import { users, sessions, accounts, verifications } from '@/lib/db/schema';

// Helper to check if OAuth provider is configured
const isProviderConfigured = (clientId?: string, clientSecret?: string) => {
  return !!(clientId && clientSecret);
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production with email service
    minPasswordLength: 12, // Stronger password requirement
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  socialProviders: {
    // Google OAuth - only enabled if credentials are provided
    ...(isProviderConfigured(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    ) && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    }),
    // Apple OAuth - only enabled if credentials are provided
    ...(isProviderConfigured(
      process.env.APPLE_CLIENT_ID,
      process.env.APPLE_CLIENT_SECRET
    ) && {
      apple: {
        clientId: process.env.APPLE_CLIENT_ID as string,
        clientSecret: process.env.APPLE_CLIENT_SECRET as string,
      },
    }),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (refresh session if used after 1 day)
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    'https://appleid.apple.com', // Required for Apple Sign In
  ],
  advanced: {
    // Enhanced security settings
    useSecureCookies: process.env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // CSRF protection
      path: '/',
    },
    disableCSRFCheck: false, // Keep CSRF protection enabled
  },
  // IMPORTANT: nextCookies must be the LAST plugin
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session.session;
export type AuthUser = typeof auth.$Infer.Session.user;
EOF

cat > lib/auth/client.ts << 'EOF'
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signOut, signUp, useSession } = authClient;
EOF

# Create auth API route
cat > app/api/auth/\[...all\]/route.ts << 'EOF'
import { auth } from '@/lib/auth/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
EOF

# Create minimal proxy.ts (Next.js 16 - ready for future auth routes)
echo -e "${BLUE}🛡️  Creating proxy.ts (Next.js 16)...${NC}"
cat > proxy.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js 16 Proxy Handler
 *
 * This is a minimal configuration. When you add authentication pages,
 * uncomment and customize the route protection logic below.
 */
export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow all API routes
  if (path.startsWith('/api')) {
    return NextResponse.next();
  }

  // Add your route protection logic here when needed
  // Example:
  // const { getSessionCookie } = await import('better-auth/cookies');
  // const sessionCookie = getSessionCookie(request);
  //
  // if (path.startsWith('/dashboard') && !sessionCookie) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
EOF

echo -e "${GREEN}✅ proxy.ts created (minimal configuration)${NC}"

# Create types
cat > types/index.ts << 'EOF'
import { users, sessions, accounts } from '@/lib/db/schema';

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
EOF

# Create config files
cat > config/site.ts << 'EOF'
export const siteConfig = {
  name: 'My App',
  description: 'Built with Next.js 16, TypeScript, and Tailwind CSS',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};
EOF

cat > lib/constants/routes.ts << 'EOF'
export const PUBLIC_ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  PRICING: '/pricing',
  BLOG: '/blog',
} as const;

export const AUTH_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
} as const;

export const DASHBOARD_ROUTES = {
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;
EOF

# Create simple Hello World home page
cat > app/page.tsx << 'EOF'
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl text-center">
        <h1 className="text-6xl font-bold mb-4">
          Hello World
        </h1>
        <p className="text-xl text-muted-foreground">
          Next.js 16 + TypeScript + Better Auth + Drizzle ORM
        </p>
      </div>
    </main>
  );
}
EOF

# Add scripts to package.json
echo -e "${BLUE}📝 Updating package.json scripts...${NC}"
npm pkg set scripts.db:generate="dotenv -e .env.local -- drizzle-kit generate"
npm pkg set scripts.db:migrate="dotenv -e .env.local -- drizzle-kit migrate"
npm pkg set scripts.db:push="dotenv -e .env.local -- drizzle-kit push"
npm pkg set scripts.db:studio="dotenv -e .env.local -- drizzle-kit studio"
npm pkg set scripts.docker:up="docker-compose up -d"
npm pkg set scripts.docker:down="docker-compose down"
npm pkg set scripts.format="prettier --write ."
npm pkg set scripts.lint="eslint"
npm pkg set scripts.lint:fix="eslint --fix"

# Create start-dev script
cat > start-dev.sh << 'EOF'
#!/bin/bash

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting development environment...${NC}"

if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local not found!${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Starting PostgreSQL...${NC}"
docker compose up -d

echo -e "${BLUE}⏳ Waiting for database...${NC}"
ATTEMPTS=0
MAX_ATTEMPTS=30
until docker compose exec -T postgres pg_isready -U postgres -d myapp >/dev/null 2>&1; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Database failed to start${NC}"
        docker compose logs postgres
        exit 1
    fi
    echo -n "."
    sleep 1
done
echo ""
echo -e "${GREEN}✅ Database ready${NC}"

echo -e "${BLUE}🗄️  Setting up database schema...${NC}"
npm run db:push

echo -e "${GREEN}✨ Starting Next.js 16...${NC}"
npm run dev
EOF

chmod +x start-dev.sh

# Create cleanup script
cat > cleanup.sh << 'EOF'
#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}🧹 CLEANUP - Complete Reset${NC}"
echo "============================================="
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will delete:${NC}"
echo "  - Docker containers & volumes (all database data)"
echo "  - node_modules"
echo "  - package-lock.json"
echo "  - .next (build)"
echo "  - Database migrations"
echo ""
echo -e "${YELLOW}Your source code will be preserved.${NC}"
echo ""

read -p "Continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo -e "${BLUE}Starting cleanup...${NC}"
echo ""

echo -e "${BLUE}🐳 Stopping Docker containers...${NC}"
if [ -f "docker-compose.yml" ]; then
    docker-compose down -v --remove-orphans 2>/dev/null || echo "No containers to stop"
    echo -e "${GREEN}✅ Docker cleaned${NC}"
fi

echo -e "${BLUE}📦 Removing node_modules...${NC}"
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo -e "${GREEN}✅ node_modules removed${NC}"
fi

echo -e "${BLUE}🔒 Removing package-lock.json...${NC}"
if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    echo -e "${GREEN}✅ package-lock.json removed${NC}"
fi

echo -e "${BLUE}🏗️  Removing .next...${NC}"
if [ -d ".next" ]; then
    rm -rf .next
    echo -e "${GREEN}✅ .next removed${NC}"
fi

if [ -d ".next/dev" ]; then
    rm -rf .next/dev
    echo -e "${GREEN}✅ .next/dev removed${NC}"
fi

echo -e "${BLUE}🗄️  Removing migrations...${NC}"
if [ -d "lib/db/migrations" ]; then
    rm -rf lib/db/migrations/*
    echo -e "${GREEN}✅ Migrations removed${NC}"
fi

if [ -d ".drizzle" ]; then
    rm -rf .drizzle
    echo -e "${GREEN}✅ Drizzle cache removed${NC}"
fi

echo ""
read -p "Remove .env.local? (yes/no): " -r
echo
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    if [ -f ".env.local" ]; then
        rm -f .env.local
        echo -e "${GREEN}✅ .env.local removed${NC}"
    fi
fi

echo ""
echo -e "${BLUE}🔍 Checking Docker volumes...${NC}"
VOLUMES=$(docker volume ls -q 2>/dev/null | grep -E "postgres|pgadmin" || true)
if [ ! -z "$VOLUMES" ]; then
    echo "Volumes found:"
    echo "$VOLUMES"
    read -p "Remove them? (yes/no): " -r
    echo
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "$VOLUMES" | xargs docker volume rm 2>/dev/null || true
        echo -e "${GREEN}✅ Volumes removed${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✨ Cleanup complete!${NC}"
echo ""
echo "To start fresh:"
echo "  1. npm install"
echo "  2. cp .env.example .env.local"
echo "  3. Edit .env.local"
echo "  4. ./start-dev.sh"
echo ""
EOF

chmod +x cleanup.sh

# Create reset-db script
cat > reset-db.sh << 'EOF'
#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}🗄️  Database Reset${NC}"
echo "============================================="
echo ""
echo -e "${YELLOW}⚠️  This will:${NC}"
echo "  - Stop the database"
echo "  - Delete all data"
echo "  - Recreate the database"
echo "  - Reapply the schema"
echo ""

read -p "Continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo -e "${BLUE}📦 Stopping PostgreSQL...${NC}"
docker-compose down

echo -e "${BLUE}🗑️  Removing volumes...${NC}"
docker volume rm $(docker volume ls -q | grep postgres) 2>/dev/null || echo "Volumes already removed"

echo -e "${BLUE}🚀 Restarting PostgreSQL...${NC}"
docker-compose up -d

echo -e "${BLUE}⏳ Waiting for database...${NC}"
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database ready${NC}"
        break
    fi
    sleep 1
done

echo -e "${BLUE}🗄️  Applying schema...${NC}"
npm run db:push

echo ""
echo -e "${GREEN}✨ Database reset complete!${NC}"
echo ""
echo "You can now:"
echo "  - Create a new account at /register"
echo "  - View the DB with: npm run db:studio"
echo ""
EOF

chmod +x reset-db.sh

# Update .gitignore
cat >> .gitignore << 'EOF'

# Environment
.env.local
.env*.local

# Database
.drizzle

# IDE
.vscode
.idea
*.swp
*.swo

# Development
.next/dev
EOF

# Create comprehensive README
cat > README.md << 'EOF'
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
EOF

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo -e "${BLUE}📁 Project: ./$PROJECT_NAME${NC}"
echo ""
echo -e "${YELLOW}🚀 To start developing:${NC}"
echo "   cd $PROJECT_NAME"
echo "   ./start-dev.sh"
echo ""
if [ "$IS_CODESPACE" = true ]; then
    echo -e "${BLUE}🌐 App URL: ${CODESPACE_URL}${NC}"
else
    echo -e "${BLUE}🌐 App URL: http://localhost:3000${NC}"
fi
echo ""
echo -e "${GREEN}Happy coding with Next.js 16! 🎉${NC}"