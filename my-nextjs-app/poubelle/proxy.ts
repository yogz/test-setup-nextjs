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
