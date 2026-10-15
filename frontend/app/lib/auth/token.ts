import type { AuthRole, AuthUser } from "./types";
import { ROLE_DASHBOARD_PATHS } from "./roles";

const LEGACY_TOKEN_KEY = "fbs_token";
const LEGACY_USER_KEY = "fbs_user";
const ACTIVE_ROLE_KEY = "fbs_auth_active_role";

const AUTH_STORAGE_KEYS: Record<
  AuthRole,
  { token: string; user: string }
> = {
  super_admin: {
    token: "fbs_auth_super_admin_token",
    user: "fbs_auth_super_admin_profile",
  },
  designer: {
    token: "fbs_auth_designer_token",
    user: "fbs_auth_designer_profile",
  },
  user: {
    token: "fbs_auth_user_token",
    user: "fbs_auth_user_profile",
  },
};

function getSessionAuthStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function clearLegacyLocalAuthStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_USER_KEY);
  window.sessionStorage.removeItem(LEGACY_TOKEN_KEY);
  window.sessionStorage.removeItem(LEGACY_USER_KEY);
}

function getRoleFromPathname(): AuthRole | null {
  if (typeof window === "undefined") return null;
  const pathname = window.location.pathname;
  if (pathname.startsWith("/superadmin")) return "super_admin";
  if (pathname.startsWith("/designer")) return "designer";
  if (pathname.startsWith("/user")) return "user";
  return null;
}

function getActiveRole(role?: AuthRole): AuthRole | null {
  if (role) return role;

  const pathRole = getRoleFromPathname();
  if (pathRole) return pathRole;

  const storedRole = getSessionAuthStorage()?.getItem(ACTIVE_ROLE_KEY);
  if (storedRole && storedRole in AUTH_STORAGE_KEYS) {
    return storedRole as AuthRole;
  }

  return null;
}

export function getStoredToken(role?: AuthRole): string | null {
  if (typeof window === "undefined") return null;
  clearLegacyLocalAuthStorage();
  const activeRole = getActiveRole(role);
  if (!activeRole) return null;
  return getSessionAuthStorage()?.getItem(AUTH_STORAGE_KEYS[activeRole].token) ?? null;
}

export function setStoredToken(token: string, role: AuthRole) {
  clearLegacyLocalAuthStorage();
  const storage = getSessionAuthStorage();
  storage?.setItem(AUTH_STORAGE_KEYS[role].token, token);
  storage?.setItem(ACTIVE_ROLE_KEY, role);
}

export function removeStoredToken(role?: AuthRole) {
  if (typeof window !== "undefined") {
    clearLegacyLocalAuthStorage();
    const activeRole = getActiveRole(role);
    if (!activeRole) return;

    window.sessionStorage.removeItem(AUTH_STORAGE_KEYS[activeRole].token);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEYS[activeRole].user);
    if (window.sessionStorage.getItem(ACTIVE_ROLE_KEY) === activeRole) {
      window.sessionStorage.removeItem(ACTIVE_ROLE_KEY);
    }
  }
}

export function getStoredUser(role?: AuthRole): AuthUser | null {
  if (typeof window === "undefined") return null;
  clearLegacyLocalAuthStorage();
  const activeRole = getActiveRole(role);
  if (!activeRole) return null;
  const data = getSessionAuthStorage()?.getItem(AUTH_STORAGE_KEYS[activeRole].user);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser, role: AuthRole) {
  clearLegacyLocalAuthStorage();
  const storage = getSessionAuthStorage();
  storage?.setItem(AUTH_STORAGE_KEYS[role].user, JSON.stringify(user));
  storage?.setItem(ACTIVE_ROLE_KEY, role);
}

export function decodeJwtPayload(
  token: string,
): { sub?: number; roles?: AuthRole[]; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function getRoleFromToken(token?: string | null): AuthRole | null {
  const t = token ?? getStoredToken();
  if (!t) return null;
  const payload = decodeJwtPayload(t);
  if (payload && Array.isArray(payload.roles) && payload.roles.length > 0) {
    return payload.roles[0] as AuthRole;
  }
  return null;
}

export function getDashboardPathFromRole(role?: AuthRole | null): string {
  if (!role) return "/";
  return ROLE_DASHBOARD_PATHS[role] ?? "/";
}

export function getDashboardPathFromToken(token?: string | null): string {
  const role = getRoleFromToken(token);
  return getDashboardPathFromRole(role);
}
