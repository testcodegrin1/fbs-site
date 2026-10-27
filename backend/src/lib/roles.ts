import type { AuthRole, Permission } from "./types.js";

export const ROLE_LABELS: Record<AuthRole, string> = {
  super_admin: "Super Admin",
  designer: "Designer",
  user: "User",
};

export const ROLE_LOGIN_PATHS: Record<AuthRole, string> = {
  super_admin: "/superadmin/login",
  designer: "/designer/login",
  user: "/user/login",
};

export const ROLE_DASHBOARD_PATHS: Record<AuthRole, string> = {
  super_admin: "/superadmin/dashboard",
  designer: "/designer/dashboard",
  user: "/user/dashboard",
};

export const ROLE_PERMISSIONS: Record<AuthRole, Permission[]> = {
  super_admin: [
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "roles:read",
    "roles:update",
    "designer:dashboard",
    "user:dashboard",
    "vendors:manage",
    "product_templates:manage",
  ],
  designer: ["designer:dashboard"],
  user: ["user:dashboard"],
};

export function isAuthRole(value: unknown): value is AuthRole {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(ROLE_LABELS, value)
  );
}
