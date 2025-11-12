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
npm audit fix --quiet 2>/dev/null || echo -e "${YELLOW}⚠️  Some vulnerabilities couldn't be auto-fixed (this is normal)${NC}"

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

mkdir -p app/\(auth\)/{login,register,forgot-password}
mkdir -p app/\(dashboard\)/{dashboard,settings,profile}
mkdir -p app/\(marketing\)/{about,pricing,blog}
mkdir -p app/api/auth/\[...all\]
mkdir -p components/{ui,forms,layout}
mkdir -p components/features/{dashboard,blog}
mkdir -p lib/{actions,api,auth,validations,constants}
mkdir -p lib/db/migrations
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
echo -e "${BLUE}🔒 Configuring Better Auth...${NC}"

cat > lib/auth/auth.ts << 'EOF'
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
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
    requireEmailVerification: false,
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
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    'https://appleid.apple.com', // Required for Apple Sign In
  ],
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

# Create proxy.ts (Next.js 16 replacement for middleware.ts)
echo -e "${BLUE}🛡️  Creating proxy.ts (Next.js 16)...${NC}"
cat > proxy.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/about', '/pricing', '/blog'];
  const isPublicRoute = publicRoutes.some(route => path === route);
  
  // Auth routes (login, register, etc.)
  const isAuthPage = path.startsWith('/login') || 
                     path.startsWith('/register') ||
                     path.startsWith('/forgot-password');
  
  // Protected routes
  const isProtectedRoute = path.startsWith('/dashboard') ||
                           path.startsWith('/settings') ||
                           path.startsWith('/profile');

  // Don't do anything for public routes or API routes
  if (isPublicRoute || path.startsWith('/api')) {
    return NextResponse.next();
  }

  // Get session cookie using Better Auth helper
  const { getSessionCookie } = await import('better-auth/cookies');
  const sessionCookie = getSessionCookie(request);

  // Redirect authenticated users away from auth pages
  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

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

echo -e "${GREEN}✅ proxy.ts created${NC}"

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

# Create home page
cat > app/page.tsx << 'EOF'
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Your Next.js 16 App
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Built with Next.js 16, TypeScript, Drizzle, Tailwind, and Better Auth
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
EOF

# Create marketing layout
cat > app/\(marketing\)/layout.tsx << 'EOF'
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">My App</h1>
        </div>
      </header>
      {children}
    </div>
  );
}
EOF

cat > app/\(marketing\)/about/page.tsx << 'EOF'
export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-4">About Us</h1>
      <p className="text-muted-foreground">
        This is the about page in the marketing route group.
      </p>
    </div>
  );
}
EOF

# Create auth layout
cat > app/\(auth\)/layout.tsx << 'EOF'
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
EOF

# Create login page
cat > app/\(auth\)/login/page.tsx << 'EOF'
'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });
      
      if (result.error) {
        setError(result.error.message || 'Invalid email or password');
        setLoading(false);
        return;
      }

      // Wait a moment for the session to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force a hard navigation to ensure session is loaded
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: '/dashboard',
      });
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
    }
  };

  return (
    <div className="bg-background p-8 rounded-lg shadow-lg border">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center mb-2">Sign In</h1>
        <p className="text-center text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      {/* Social Sign In Buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => handleSocialSignIn('google')}
          className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm font-medium">Continue with Google</span>
        </button>

        <button
          onClick={() => handleSocialSignIn('apple')}
          className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          <span className="text-sm font-medium">Continue with Apple</span>
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="you@example.com"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">Don't have an account? </span>
        <Link href="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
EOF

# Create register page
cat > app/\(auth\)/register/page.tsx << 'EOF'
'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to create account');
        setLoading(false);
        return;
      }

      // Wait a moment for the session to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force a hard navigation to ensure session is loaded
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: '/dashboard',
      });
    } catch (err: any) {
      setError(err.message || `Failed to sign up with ${provider}`);
    }
  };

  return (
    <div className="bg-background p-8 rounded-lg shadow-lg border">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-center text-sm text-muted-foreground">
          Sign up to get started
        </p>
      </div>

      {/* Social Sign Up Buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => handleSocialSignIn('google')}
          className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm font-medium">Continue with Google</span>
        </button>

        <button
          onClick={() => handleSocialSignIn('apple')}
          className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          <span className="text-sm font-medium">Continue with Apple</span>
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Full Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="John Doe"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="you@example.com"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
EOF

# Create dashboard layout with async headers (Next.js 16)
cat > app/\(dashboard\)/layout.tsx << 'EOF'
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/layout/dashboard-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-muted/10">
        <DashboardNav user={session.user} />
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
EOF

# Create dashboard navigation
mkdir -p components/layout
cat > components/layout/dashboard-nav.tsx << 'EOF'
'use client';

import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';

export function DashboardNav({ user }: { user: any }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
        <nav className="space-y-2">
          <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-muted transition-colors">
            Overview
          </Link>
          <Link href="/settings" className="block px-3 py-2 rounded hover:bg-muted transition-colors">
            Settings
          </Link>
          <Link href="/profile" className="block px-3 py-2 rounded hover:bg-muted transition-colors">
            Profile
          </Link>
        </nav>
      </div>
      <div className="absolute bottom-0 w-64 p-6 border-t">
        <p className="text-sm text-muted-foreground truncate mb-2">{user.email}</p>
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </>
  );
}
EOF

# Create dashboard page
cat > app/\(dashboard\)/dashboard/page.tsx << 'EOF'
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

export default async function DashboardPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="bg-card p-6 rounded-lg border">
        <p className="text-muted-foreground mb-4">
          Welcome back, {session.user.name || session.user.email}!
        </p>
        {session.user.name && (
          <p className="text-sm text-muted-foreground mb-2">
            Name: {session.user.name}
          </p>
        )}
        <p className="text-sm text-muted-foreground mb-2">
          Email: {session.user.email}
        </p>
        <p className="text-sm text-muted-foreground">
          Member since: {new Date(session.user.createdAt || Date.now()).toLocaleDateString()}
        </p>
      </div>
    </div>
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