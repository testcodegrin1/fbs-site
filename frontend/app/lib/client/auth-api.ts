"use client";

import type {
  AuthRole,
  AuthUser,
  LoginResponse,
  Permission,
  UserPayload,
} from "@/app/lib/auth/types";
import {
  getStoredToken,
  removeStoredToken,
  setStoredToken,
  setStoredUser,
} from "@/app/lib/auth/token";

type RoleResponse = {
  roles: {
    slug: AuthRole;
    name: string;
    description: string | null;
    permissions: string[];
  }[];
  permissions: Permission[];
};

class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

function apiUrl(path: string) {
  const base =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    "http://localhost:4000";
  return `${base}${path}`;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(apiUrl(url), {
    ...init,
    credentials: "include",
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiClientError(
      typeof data.message === "string" ? data.message : "Request failed.",
      response.status,
    );
  }

  return data as T;
}

export const authApi = {
  async login(
    role: AuthRole,
    email: string,
    password: string,
    franchiseId?: number,
  ) {
    const res = await request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ role, email, password, franchiseId }),
    });

    if (res.token) {
      setStoredToken(res.token);
    }
    if (res.user) {
      setStoredUser(res.user);
    }

    return res;
  },

  listFranchises() {
    return request<{
      franchises: Array<{
        id: number;
        name: string;
        slug: string;
        brandingLogoUrl: string | null;
        description: string | null;
        isActive: boolean;
      }>;
    }>("/api/auth/franchises");
  },

  async register(name: string, email: string, password: string) {
    const res = await request<LoginResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    if (res.token) {
      setStoredToken(res.token);
    }
    if (res.user) {
      setStoredUser(res.user);
    }

    return res;
  },

  async logout() {
    removeStoredToken();
    return request<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
  },

  me() {
    return request<{ user: AuthUser }>("/api/auth/me");
  },

  listUsers() {
    return request<{ users: AuthUser[] }>("/api/users");
  },

  createUser(payload: UserPayload) {
    return request<{ user: AuthUser }>("/api/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateUser(id: number, payload: Partial<UserPayload>) {
    return request<{ user: AuthUser }>(`/api/users/${id}`, {
      method: "put",
      body: JSON.stringify(payload),
    });
  },

  deleteUser(id: number) {
    return request<{ ok: boolean }>(`/api/users/${id}`, { method: "DELETE" });
  },

  listRoles() {
    return request<RoleResponse>("/api/roles");
  },

  updateRolePermissions(role: AuthRole, permissions: Permission[]) {
    return request<Pick<RoleResponse, "roles">>(
      `/api/roles/${role}/permissions`,
      {
        method: "put",
        body: JSON.stringify({ permissions }),
      },
    );
  },
};
