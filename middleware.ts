import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { clientIp, rateLimit } from '@/lib/api/rate-limit';

const AUTH_ROUTES_PREFIX = '/api/auth';

// قائمة المسارات الخاصة بالأدمن فقط
const ADMIN_ONLY_PATHS = [
  '/project/projects/Medical-Services/hospitals',
  '/project/projects/education/school',
  '/project/projects/food-water/food',
  '/project/projects/food-water/water',
  '/project/projects/camp/shelters',
  '/project/projects/camp/Emergency',
  '/project/projects/institution/institutions',
  '/project/admins'
];

// قائمة المسارات العامة (التي لا نريد حمايتها من المواطن)
const PUBLIC_PATHS = [
  '/project/projects/education/school/query',
  '/project/projects/Medical-Services/home'
];

function isPublicProjectApi(pathname: string, method: string): boolean {
  if (pathname === '/api/project/places' && method === 'GET') return true;
  if (pathname === '/api/project/users/myAid' && method === 'GET') return true;
  if (pathname === '/api/project/users/requestAid' && method === 'POST') return true;
  if (pathname === '/api/project/admins/adminBeneficiary' && method === 'POST') return true;
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

  // استثناء المسارات العامة من أي حماية أدمن
  const isPublicRoute = PUBLIC_PATHS.some(path => pathname === path);

  const checkRateLimit = async (key: string, limit: number, window: number) => {
    const ip = clientIp(request);
    const rl = rateLimit(`${key}:${ip}`, limit, window);
    if (!rl.ok) {
      const retryAfter = (rl as any).retryAfterSec || 60;
      return NextResponse.json(
        { data: null, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }
    return null;
  };

  if (pathname.startsWith(AUTH_ROUTES_PREFIX) && method !== 'GET') {
    const rlRes = await checkRateLimit('auth', 30, 60_000);
    if (rlRes) return rlRes;
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/project')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      const signIn = new URL('/signin', request.url);
      signIn.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
      return NextResponse.redirect(signIn);
    }

    // إذا كانت الصفحة عامة، نمرر المستخدم فوراً
    if (isPublicRoute) return res;

    // التحقق من صلاحية الأدمن للمسارات المحمية فقط
    const isAdminRoute = ADMIN_ONLY_PATHS.some(path => pathname.startsWith(path));
    
    if (isAdminRoute && (token as any).role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url)); 
    }

    return res;
  }

  if (pathname.startsWith('/api/project/')) {
    if (isPublicProjectApi(pathname, method)) return res;
    
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'يجب تسجيل الدخول' } },
        { status: 401 }
      );
    }
    return res;
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/project/:path*', '/api/project/:path*', '/api/auth/:path*'],
};