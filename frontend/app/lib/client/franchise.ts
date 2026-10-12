"use client";

import { getStoredToken } from "@/app/lib/auth/token";

export type FranchiseModel = {
  id: number;
  name: string;
  slug: string;
  brandingLogoUrl?: string | null;
  description?: string | null;
  isActive?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function getApiBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  return url.replace(/\/+$/, "");
}

export function resolveImageUrl(path?: string | null): string {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

function normalizeFranchise(raw: any): FranchiseModel {
  if (!raw || typeof raw !== "object") {
    return {
      id: 0,
      name: "",
      slug: "",
    };
  }

  const isActive =
    raw.isActive !== undefined
      ? Boolean(raw.isActive)
      : raw.is_active !== undefined
        ? Boolean(raw.is_active)
        : true;

  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    slug: String(raw.slug ?? ""),
    brandingLogoUrl:
      raw.brandingLogoUrl ??
      raw.branding_logo_url ??
      raw.logoUrl ??
      raw.logo ??
      null,
    description: raw.description ?? "",
    isActive,
    status: raw.status ?? (isActive ? "active" : "inactive"),
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };

  // Important: Do not set Content-Type for FormData
  if (!(init?.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
    });
  } catch {
    throw new Error(
      `Network error connecting to backend at ${base}. Please verify that the API server is reachable.`,
    );
  }

  const data = await res.json().catch(() => ({} as Record<string, unknown>));

  if (!res.ok) {
    const rawMessage =
      (data as { message?: unknown })?.message ||
      (data as { error?: unknown })?.error;
    const message =
      typeof rawMessage === "string"
        ? rawMessage
        : rawMessage && typeof rawMessage === "object"
          ? JSON.stringify(rawMessage)
          : `API request failed with status ${res.status}`;
    const err: any = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const franchiseApi = {
  async getFranchises(): Promise<FranchiseModel[]> {
    const data = await request<any>("/api/getFranchises", {
      method: "GET",
    });

    const rawList = Array.isArray(data)
      ? data
      : Array.isArray(data?.franchises)
        ? data.franchises
        : Array.isArray(data?.data)
          ? data.data
          : [];

    return rawList.map(normalizeFranchise);
  },

  async getFranchiseById(id: number): Promise<FranchiseModel> {
    const data = await request<any>(`/api/getFranchises/${id}`, {
      method: "GET",
    });

    const raw = data?.franchise || data?.data || data;
    return normalizeFranchise(raw);
  },

  async createFranchise(formData: FormData): Promise<FranchiseModel> {
    const data = await request<any>("/api/createFranchise", {
      method: "POST",
      body: formData,
    });

    const raw = data?.franchise || data?.data || data;
    return normalizeFranchise(raw);
  },

  async updateFranchise(
    id: number,
    formData: FormData,
  ): Promise<FranchiseModel> {
    try {
      const data = await request<any>(`/api/updateFranchise/${id}`, {
        method: "PUT",
        body: formData,
      });
      const raw = data?.franchise || data?.data || data;
      return normalizeFranchise(raw);
    } catch (err: any) {
      if (err?.status === 404 || err?.status === 405) {
        const data = await request<any>(`/api/updateFranchise/${id}`, {
          method: "POST",
          body: formData,
        });
        const raw = data?.franchise || data?.data || data;
        return normalizeFranchise(raw);
      }
      throw err;
    }
  },

  async deleteFranchise(id: number): Promise<{ success: boolean }> {
    const data = await request<any>(`/api/deleteFranchise/${id}`, {
      method: "DELETE",
    });
    return { success: true, ...data };
  },
};
