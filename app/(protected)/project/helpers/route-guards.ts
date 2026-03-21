'use client';

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getSession } from 'next-auth/react';

function normalizeRole(
  roleSlug: string | null | undefined,
): 'admin' | 'user' | null {
  if (!roleSlug) return null;

  const normalized = roleSlug.trim().toLowerCase();

  if (normalized === 'admin') return 'admin';
  if (normalized === 'citizen' || normalized === 'user') return 'user';

  return null;
}

async function getCurrentRole() {
  const session = await getSession();
  const roleSlug = (session?.user as any)?.roleSlug;

  return normalizeRole(roleSlug);
}

export async function requireAdmin(router: AppRouterInstance) {
  const role = await getCurrentRole();

  if (role !== 'admin') {
    router.push('/unauthorized');
  }
}

export async function requireCitizen(router: AppRouterInstance) {
  const role = await getCurrentRole();

  if (role !== 'user' && role !== 'admin') {
    router.push('/unauthorized');
  }
}