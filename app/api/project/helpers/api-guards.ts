import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

function normalizeRole(role: string | null | undefined): 'admin' | 'user' | null {
  if (!role) return null;

  const normalized = role.trim().toLowerCase();

  if (normalized === 'admin') return 'admin';
  if (normalized === 'citizen' || normalized === 'user') return 'user';

  return null;
}

export async function getRoleFromRequest(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const tokenRole =
    normalizeRole((token as any)?.roleSlug) ??
    normalizeRole((token as any)?.roleName) ??
    normalizeRole((token as any)?.role);

  if (tokenRole) return tokenRole;

  const rawRole = req.cookies.get('userRole')?.value ?? null;
  return normalizeRole(rawRole);
}

export function getUserIdFromRequest(req: NextRequest) {
  return req.cookies.get('userId')?.value ?? null;
}

export async function requireAdminApi(req: NextRequest) {
  const role = await getRoleFromRequest(req);

  if (role !== 'admin') {
    return NextResponse.json(
      { message: 'ليس لديك صلاحية للوصول إلى هذا المورد' },
      { status: 403 }
    );
  }

  return null;
}

export async function requireCitizenApi(req: NextRequest) {
  const role = await getRoleFromRequest(req);

  if (role !== 'user' && role !== 'admin') {
    return NextResponse.json(
      { message: 'ليس لديك صلاحية للوصول إلى هذا المورد' },
      { status: 403 }
    );
  }

  return null;
}