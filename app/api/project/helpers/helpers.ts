export type AppRole = "ADMIN" | "CITIZEN";

export type CurrentUser = {
  id: string;
  email: string;
  role: AppRole;
  beneficiary?: {
    id: string;
    name: string;
    phone?: string | null;
    numberOfFamily?: number | null;
    userId?: string | null;
  } | null;
};

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

export function getCurrentRole(): AppRole | null {
  const user = getCurrentUser();
  return user?.role ?? null;
}

export function getCurrentUserId(): string | null {
  const user = getCurrentUser();
  return user?.id ?? null;
}

export function isAdmin(): boolean {
  return getCurrentRole() === "ADMIN";
}

export function isCitizen(): boolean {
  return getCurrentRole() === "CITIZEN";
}

export function saveCurrentUser(user: CurrentUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearCurrentUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
}

export function logoutClient() {
  clearCurrentUser();
  document.cookie = "userRole=; path=/; max-age=0";
  document.cookie = "userId=; path=/; max-age=0";
  window.location.href = "/project/login";
}