import { NextRequest, NextResponse } from 'next/server';

export function getRoleFromRequest(req: NextRequest) {
  return req.cookies.get('userRole')?.value ?? null;
}

export function getUserIdFromRequest(req: NextRequest) {
  return req.cookies.get('userId')?.value ?? null;
}

export function requireAdminApi(req: NextRequest) {
  const role = getRoleFromRequest(req);

  if (role !== 'ADMIN') {
    return NextResponse.json(
      { message: 'ليس لديك صلاحية للوصول إلى هذا المورد' },
      { status: 403 }
    );
  }

  return null;
}

export function requireCitizenApi(req: NextRequest) {
  const role = getRoleFromRequest(req);

  if (role !== 'CITIZEN') {
    return NextResponse.json(
      { message: 'ليس لديك صلاحية للوصول إلى هذا المورد' },
      { status: 403 }
    );
  }

  return null;
}