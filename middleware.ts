import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { clientIp, rateLimit } from '@/lib/api/rate-limit';

const AUTH_ROUTES_PREFIX = '/api/auth';

// قمت بتعديل المسارات هنا لتطابق المسار الفعلي الذي تستخدمه في التنقل (بدون كلمة projects الزائدة)
const ADMIN_ONLY_PATHS = [
  '/project/Medical-Services/hospitals',
  '/project/education/school',
  '/project/food-water/food',
  '/project/food-water/water',
  '/project/camp/shelters',
  '/project/camp/Emergency',
  '/project/institution/institutions',
  '/project/admins'
];

// الصفحات العامة للمواطنين
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

  // 1. استثناء الصفحات العامة من أي قيود
  if (PUBLIC_PATHS.includes(pathname)) return res;

  // 2. حماية مسارات المشروع ولوحة التحكم
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/project')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      const signIn = new URL('/signin', request.url);
      signIn.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
      return NextResponse.redirect(signIn);
    }

    // التحقق من صلاحية الأدمن
    // نستخدم startsWith للتأكد من أن أي مسار فرعي (مثل /hospitals/123) يقع تحت الحماية
    const isAdminRoute = ADMIN_ONLY_PATHS.some(path => pathname.startsWith(path));
    
    // ملاحظة: تأكد أن الخاصية في التوكن هي 'role' وليس 'roleName' أو شيء آخر
    // (بناءً على الـ AuthOptions التي أرسلتها سابقاً، قد تحتاج لاستخدام token.roleSlug أو ما شابه)
    const userRole = (token as any).role || (token as any).roleName; 

    if (isAdminRoute && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url)); 
    }

    return res;
  }

  // 3. حماية الـ API
  if (pathname.startsWith('/api/project/')) {
    if (isPublicProjectApi(pathname, method)) return res;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return res;
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/project/:path*', '/api/project/:path*', '/api/auth/:path*'],
};