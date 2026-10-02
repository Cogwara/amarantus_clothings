import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose/jwt/verify';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'clothshop-manager-super-secure-production-secret-key-2026'
);

const SESSION_COOKIE_NAME = 'clothshop_session';

const PROTECTED_PAGE_PREFIXES = [
  '/dashboard',
  '/sales',
  '/inventory',
  '/thursday-plan',
  '/purchases',
  '/reports',
  '/expenses',
  '/customers',
  '/clearance',
  '/social-selling',
  '/staff',
  '/settings',
  '/hero-slides',
];

async function verifyToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return Boolean(payload?.id && payload?.email);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = token ? await verifyToken(token) : false;

  // 1. If accessing login page while already authenticated, redirect to /dashboard
  if (pathname === '/login') {
    if (isAuthenticated) {
      const redirectUrl = request.nextUrl.searchParams.get('redirect');
      const target = redirectUrl && redirectUrl.startsWith('/') ? redirectUrl : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // 2. Check protected backend pages
  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedPage) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Check protected backend API routes
  if (pathname.startsWith('/api/')) {
    // Whitelist public APIs
    if (
      pathname.startsWith('/api/public/') ||
      pathname === '/api/auth/login' ||
      pathname === '/api/auth/logout'
    ) {
      return NextResponse.next();
    }

    // All other backend management APIs require authentication
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to access this resource.' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (public image uploads)
     */
    '/((?!_next/static|_next/image|favicon.ico|uploads/).*)',
  ],
};
