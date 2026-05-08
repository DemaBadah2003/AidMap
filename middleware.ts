import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { clientIp, rateLimit } from '@/lib/api/rate-limit';

const AUTH_ROUTES_PREFIX = '/api/auth';

/** Paths under /api/project that allow unauthenticated access (method-sensitive). */
function isPublicProjectApi(pathname: string, method: string): boolean {
  if (pathname === '/api/project/places' && method === 'GET') return true;
  if (pathname === '/api/project/users/myAid' && method === 'GET') return true;
  if (pathname === '/api/project/users/requestAid' && method === 'POST')
    return true;
  if (
    pathname === '/api/project/admins/adminBeneficiary' &&
    method === 'POST'
  )
    return true;
  if (pathname === '/api/geocode') return true;
  if (pathname.startsWith('/api/project/route')) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  const res = NextResponse.next();

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (pathname.startsWith(AUTH_ROUTES_PREFIX) && method !== 'GET') {
    const ip = clientIp(request);
    const rl = rateLimit(`auth:${ip}`, 30, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { data: null, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }
  }

  if (pathname === '/api/project/users/requestAid' && method === 'POST') {
    const ip = clientIp(request);
    const rl = rateLimit(`reqAid:${ip}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { data: null, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }
  }

  if (pathname === '/api/project/users/myAid' && method === 'GET') {
    const ip = clientIp(request);
    const rl = rateLimit(`myAid:${ip}`, 60, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { data: null, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }
  }

  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/project')
  ) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) {
      const signIn = new URL('/signin', request.url);
      signIn.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
      return NextResponse.redirect(signIn);
    }
    return res;
  }

  if (pathname.startsWith('/api/project/')) {
    if (isPublicProjectApi(pathname, method)) {
      return res;
    }
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'يجب تسجيل الدخول' } },
        { status: 401 },
      );
    }
    return res;
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/project/:path*',
    '/api/project/:path*',
    '/api/auth/:path*',
  ],
};
