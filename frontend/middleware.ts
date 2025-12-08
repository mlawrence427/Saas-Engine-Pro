// ============================================================
// frontend/middleware.ts - SaaS Engine Pro
// Route Protection Middleware
// ============================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================
// ROUTE CONFIGURATION
// ============================================================

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/account',
  '/account/billing',
];

// Routes that require admin role (ADMIN or FOUNDER)
const ADMIN_ROUTES = [
  '/admin',
];

// Routes that are always public
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/logout',
  '/modules',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
  '/docs',
];

// Static file patterns to skip
const STATIC_PATTERNS = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/icon',
  '/apple-touch-icon',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
];

// ============================================================
// TYPES
// ============================================================

interface JWTPayload {
  userId: string;
  role?: string;
  plan?: string;
  iat?: number;
  exp?: number;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if path matches any pattern in the list
 */
function matchesPath(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern || path.startsWith(pattern + '/');
  });
}

/**
 * Check if path is a static asset
 */
function isStaticAsset(path: string): boolean {
  return STATIC_PATTERNS.some((pattern) => path.startsWith(pattern));
}

/**
 * Decode JWT without verification (verification happens on backend)
 * This is safe for middleware because we just need basic routing decisions
 * The actual auth validation happens on the backend API calls
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }
    
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if user has admin privileges
 */
function isAdmin(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'FOUNDER';
}

// ============================================================
// MIDDLEWARE
// ============================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and API routes
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (matchesPath(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get('token')?.value;

  // Decode token (lightweight check - full verification on backend)
  const payload = token ? decodeJWT(token) : null;
  const isAuthenticated = payload !== null;
  const userRole = payload?.role;

  // Check admin routes first
  if (matchesPath(pathname, ADMIN_ROUTES)) {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdmin(userRole)) {
      // Redirect to dashboard with error (user is logged in but not admin)
      const dashboardUrl = new URL('/dashboard', request.url);
      dashboardUrl.searchParams.set('error', 'admin_required');
      return NextResponse.redirect(dashboardUrl);
    }

    // Admin access granted
    return NextResponse.next();
  }

  // Check protected routes
  if (matchesPath(pathname, PROTECTED_ROUTES)) {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated access granted
    return NextResponse.next();
  }

  // Default: allow access
  return NextResponse.next();
}

// ============================================================
// MIDDLEWARE CONFIG
// ============================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};