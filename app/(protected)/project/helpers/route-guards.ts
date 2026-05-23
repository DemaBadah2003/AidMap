import { getSession } from 'next-auth/react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

function normalizeRole(roleSlug: string | null | undefined): 'admin' | 'user' | null {
  if (!roleSlug) return null;
  const normalized = roleSlug.trim().toLowerCase();
  if (normalized === 'admin') return 'admin';
  if (normalized === 'citizen' || normalized === 'user') return 'user';
  return null;
}

async function getCurrentRole() {
  // حاول أكثر من مرة عشان الـ session تتحمل
  for (let i = 0; i < 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));

    const session = await getSession();

    console.log(`=== SESSION ATTEMPT ${i + 1}/3 ===`, JSON.stringify(session?.user, null, 2));

    if (session?.user) {
      const user = session.user as any;
      const roleValue = user.roleSlug ?? user.role ?? user.userRole ?? user.type ?? null;
      console.log('=== ROLE VALUE ===', roleValue);
      return normalizeRole(roleValue);
    }

    console.log(`=== NO SESSION, retry ${i + 1}/3 ===`);
  }

  console.log('=== FAILED TO GET SESSION AFTER 3 ATTEMPTS ===');
  return null;
}

export async function requireAdmin(router?: AppRouterInstance): Promise<boolean> {
  const role = await getCurrentRole();
  console.log('=== FINAL ROLE ===', role);

  const isAdmin = role === 'admin';

  if (!isAdmin && router) {
    router.replace('/');
  }

  return isAdmin;
}

export async function requireCitizen(router?: AppRouterInstance): Promise<boolean> {
  const role = await getCurrentRole();

  const isAllowed = role === 'user' || role === 'admin';

  if (!isAllowed && router) {
    router.replace('/');
  }

  return isAllowed;
}