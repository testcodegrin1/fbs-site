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
import { buildApiUrl } from "@/app/lib/client/api-url";

type RoleResponse = {
  roles: {
    slug: AuthRole;
    name: string;
    description: string | null;
    permissions: string[];
  }[];
  permissions: Permission[];
};

type RegisterResponse = Partial<LoginResponse> & {
  message?: string;
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
  return buildApiUrl(path);
}

async function request<T>(
  url: string,
  init?: RequestInit,
  role?: AuthRole,
): Promise<T> {
  const token = getStoredToken(role);
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
  ) {
    const res = await request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ role, email, password }),
    });

    if (res.token) {
      setStoredToken(res.token, role);
    }
    if (res.user) {
      setStoredUser(res.user, role);
    }

    return res;
  },

  async register(
    name: string,
    email: string,
    password: string,
  ) {
    const res = await request<RegisterResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    if (res.token) {
      setStoredToken(res.token, "user");
    }
    if (res.user) {
      setStoredUser(res.user, "user");
    }

    return res;
  },

  async logout(role?: AuthRole) {
    try {
      return await request<{ ok: boolean }>(
        "/api/auth/logout",
        { method: "POST" },
        role,
      );
    } finally {
      removeStoredToken(role);
    }
  },

  me(role?: AuthRole) {
    return request<{ user: AuthUser }>("/api/auth/me", undefined, role);
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
