import { NextRequest, NextResponse } from 'next/server';

export default async function proxy(request: NextRequest) {
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
