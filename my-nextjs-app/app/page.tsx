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
