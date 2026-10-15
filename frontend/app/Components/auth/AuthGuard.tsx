"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/app/lib/client/auth-api";
import type { AuthRole, AuthUser } from "@/app/lib/auth/types";
import {
  getDashboardPathFromRole,
  getRoleFromToken,
  getStoredToken,
  removeStoredToken,
} from "@/app/lib/auth/token";
import { ROLE_LOGIN_PATHS } from "@/app/lib/auth/roles";

type AuthGuardProps = {
  requiredRole: AuthRole;
  children: (user: AuthUser) => ReactNode;
};

export function AuthGuard({ requiredRole, children }: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const token = getStoredToken(requiredRole);
      if (!token) {
        if (isMounted) {
          router.push(ROLE_LOGIN_PATHS[requiredRole]);
        }
        return;
      }

      // Check role directly from stored JWT token payload
      const tokenRole = getRoleFromToken(token);
      if (tokenRole && tokenRole !== requiredRole && tokenRole !== "super_admin") {
        if (isMounted) {
          router.push(getDashboardPathFromRole(tokenRole));
        }
        return;
      }

      try {
        // Validate token with backend using Authorization: Bearer header
        const res = await authApi.me(requiredRole);
        if (!res.user) {
          throw new Error("Unauthenticated");
        }

        if (!res.user.roles.includes(requiredRole) && !res.user.roles.includes("super_admin")) {
          const userRole = res.user.roles[0];
          if (isMounted) {
            router.push(getDashboardPathFromRole(userRole));
          }
          return;
        }

        if (isMounted) {
          setUser(res.user);
          setLoading(false);
        }
      } catch {
        removeStoredToken(requiredRole);
        if (isMounted) {
          router.push(ROLE_LOGIN_PATHS[requiredRole]);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [requiredRole, router]);

  if (loading || !user) {
    return (
      <div className="min-h-dvh bg-[#f7f8fb] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          <p className="mt-3 text-sm text-primary-dark/60">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
}
