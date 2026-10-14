
"use client";

import { getStoredToken } from "@/app/lib/auth/token";

export interface BannerTemplateImage {
  id?: number;
  templateId?: number;
  imageUrl: string;
  imageName?: string | null;
  sortOrder: number;
  title?: string | null;
  imageType?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BannerTemplateField {
  id?: number;
  templateId?: number;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  positionX: number;
  positionY: number;
  fontSize: number;
  fontColor: string;
  fontFamily: string;
  textAlign: string;
  maxLength: number;
  isRequired: boolean;
  isEditable: boolean;
  defaultValue?: string;
  createdAt?: string;
}

export interface BannerTemplateModel {
  id: number;
  franchiseId: number;
  franchiseName?: string;
  name: string;
  description?: string;
  widthPx: number;
  heightPx: number;
  dimensionsLabel?: string;
  orientation: "landscape" | "portrait";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  images: BannerTemplateImage[];
  fields?: BannerTemplateField[];
}

export interface CreateBannerTemplatePayload {
  name: string;
  franchise_id: number;
  franchiseId?: number;
  description: string;
  orientation: "landscape" | "portrait";
  width_px: number;
  widthPx?: number;
  height_px: number;
  heightPx?: number;
  dimensions_label: string;
  dimensionsLabel?: string;
  is_active: boolean;
  isActive?: boolean;
  images: Array<{
    imageUrl: string;
    imageName?: string | null;
    sortOrder: number;
  }>;
}

export interface FranchiseOption {
  id: number;
  name: string;
  brandingLogoUrl?: string | null;
}

export function getApiBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  return url.replace(/\/+$/, "");
}

/**
 * Resolves an image path to an absolute URL based on the environment backend URL.
 * Handles:
 * - Already absolute URLs (http://, https://)
 * - Temporary client preview URLs (blob:, data:)
 * - Backend relative paths (/uploads/banners/...)
 */
export function resolveImageUrl(path?: string | null): string {
  if (!path || typeof path !== "string") return "";
  const trimmed = path.trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  const base = getApiBaseUrl();
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${cleanPath}`;
}

/**
 * Returns an ordered list of candidate URLs to load an image,
 * falling back gracefully if a remote devtunnel or static server misses the asset.
 */
export function getCandidateImageUrls(path?: string | null): string[] {
  if (!path || typeof path !== "string") return [];
  const trimmed = path.trim();
  if (!trimmed) return [];

  if (
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return [trimmed];
  }

  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const candidates: string[] = [];

  // 1. Configured base URL
  const base = getApiBaseUrl();
  candidates.push(`${base}${cleanPath}`);

  // 2. Fallback to localhost:4000 if base is a remote tunnel
  if (!base.includes("localhost:4000")) {
    candidates.push(`http://localhost:4000${cleanPath}`);
  }

  // 3. Frontend public root
  candidates.push(cleanPath);

  // 4. Filename in public root (e.g. /Dunkins.png if in frontend/public)
  const filename = cleanPath.split("/").pop();
  if (filename && `/${filename}` !== cleanPath) {
    candidates.push(`/${filename}`);
  }

  return [...new Set(candidates)];
}

function normalizeTemplate(raw: any): BannerTemplateModel {
  if (!raw || typeof raw !== "object") {
    return {
      id: 0,
      franchiseId: 0,
      name: "",
      widthPx: 1080,
      heightPx: 1080,
      orientation: "landscape",
      isActive: true,
      images: [],
    };
  }

  const isActive =
    raw.isActive !== undefined
      ? Boolean(raw.isActive)
      : raw.is_active !== undefined
        ? Boolean(raw.is_active)
        : true;

  const rawImages = Array.isArray(raw.images) ? raw.images : [];
  const normalizedImages: BannerTemplateImage[] = rawImages.map(
    (img: any, idx: number) => ({
      id: img.id ? Number(img.id) : undefined,
      templateId: img.templateId || img.template_id,
      imageUrl: String(
        img.imageUrl ||
          img.image_url ||
          img.url ||
          img.src ||
          "",
      ),
      imageName:
        typeof img.imageName === "string"
          ? img.imageName
          : typeof img.image_name === "string"
            ? img.image_name
            : img.title ?? null,
      sortOrder:
        img.sortOrder !== undefined
          ? Number(img.sortOrder)
          : img.sort_order !== undefined
            ? Number(img.sort_order)
            : idx,
      title: img.title ?? img.imageName ?? img.image_name ?? null,
      imageType: img.imageType || img.image_type || "banner",
      isActive:
        img.isActive !== undefined
          ? Boolean(img.isActive)
          : img.is_active !== undefined
            ? Boolean(img.is_active)
            : true,
      createdAt: img.createdAt || img.created_at,
      updatedAt: img.updatedAt || img.updated_at,
    }),
  );

  // Safely extract masterImageUrl across both camelCase and snake_case backend responses
  const masterUrl =
    (typeof raw.masterImageUrl === "string" && raw.masterImageUrl.trim()) ||
    (typeof raw.master_image_url === "string" && raw.master_image_url.trim()) ||
    (typeof raw.masterUrl === "string" && raw.masterUrl.trim()) ||
    (typeof raw.master_url === "string" && raw.master_url.trim()) ||
    (typeof raw.masterImage === "string" && raw.masterImage.trim()) ||
    (typeof raw.master_image === "string" && raw.master_image.trim()) ||
    undefined;

  // Safely extract previewImageUrl across both camelCase and snake_case backend responses
  const previewUrl =
    (typeof raw.previewImageUrl === "string" && raw.previewImageUrl.trim()) ||
    (typeof raw.preview_image_url === "string" && raw.preview_image_url.trim()) ||
    (typeof raw.previewUrl === "string" && raw.previewUrl.trim()) ||
    (typeof raw.preview_url === "string" && raw.preview_url.trim()) ||
    (typeof raw.previewImage === "string" && raw.previewImage.trim()) ||
    (typeof raw.preview_image === "string" && raw.preview_image.trim()) ||
    masterUrl ||
    undefined;

  return {
    id: Number(raw.id),
    franchiseId: Number(raw.franchiseId ?? raw.franchise_id ?? 0),
    franchiseName: raw.franchiseName || raw.franchise_name || undefined,
    name: String(raw.name ?? ""),
    description: raw.description ?? "",
    widthPx: Number(raw.widthPx ?? raw.width_px ?? 1080),
    heightPx: Number(raw.heightPx ?? raw.height_px ?? 1080),
    dimensionsLabel:
      raw.dimensionsLabel ?? raw.dimensions_label ?? undefined,
    orientation:
      raw.orientation === "portrait" ? "portrait" : "landscape",
    isActive,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    images: normalizedImages,
    fields: Array.isArray(raw.fields) ? raw.fields : undefined,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };

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

  if (!res.ok) {
    let errorMsg = `Server error (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson && typeof errJson === "object") {
        errorMsg =
          errJson.message ||
          errJson.error ||
          errJson.msg ||
          JSON.stringify(errJson);
      }
    } catch {
      try {
        const text = await res.text();
        if (text && text.length < 300) {
          errorMsg = text;
        }
      } catch {
        // ignore
      }
    }
    const error = new Error(errorMsg) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

export const bannerTemplateApi = {
  getApiBaseUrl,
  resolveImageUrl,
  getCandidateImageUrls,

  /**
   * Upload Banner Image File
   * POST /api/uploadBannerImage
   */
  async uploadBannerImage(file: File): Promise<{
    imageUrl: string;
    filename: string;
    originalName: string;
    size: number;
  }> {
    const formData = new FormData();
    formData.append("image", file);

    return request<{
      imageUrl: string;
      filename: string;
      originalName: string;
      size: number;
    }>("/api/uploadBannerImage", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * 1. GET /api/getBannerTemplates
   * Fetches all banner templates or filtered by franchiseId
   */
  async getBannerTemplates(franchiseId?: number): Promise<BannerTemplateModel[]> {
    const url = franchiseId
      ? `/api/getBannerTemplates?franchiseId=${encodeURIComponent(franchiseId)}`
      : "/api/getBannerTemplates";
    const data = await request<any>(url, {
      method: "GET",
    });

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.templates)
        ? data.templates
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.bannerTemplates)
            ? data.bannerTemplates
            : [];

    return list.map(normalizeTemplate);
  },

  /**
   * 2. GET /api/getBannerTemplate/:id
   * Fetches single banner template details
   */
  async getBannerTemplate(id: number): Promise<BannerTemplateModel> {
    const data = await request<any>(`/api/getBannerTemplate/${id}`, {
      method: "GET",
    });

    const raw = data?.template || data?.data || data;
    return normalizeTemplate(raw);
  },

  /**
   * 3. GET /api/getFranchises
   * Populates franchise dropdown with actual database franchises
   */
  async getFranchises(): Promise<FranchiseOption[]> {
    const data = await request<any>("/api/getFranchises", {
      method: "GET",
    });

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.franchises)
        ? data.franchises
        : Array.isArray(data?.data)
          ? data.data
          : [];

    return list.map((f: any) => ({
      id: Number(f.id),
      name: String(f.name ?? ""),
      slug: String(f.slug ?? ""),
      brandingLogoUrl: f.brandingLogoUrl || f.branding_logo_url || null,
    }));
  },

  /**
   * 4. POST /api/createBannerTemplate
   * Submits JSON payload to create a new banner template
   */
  async createBannerTemplate(
    payload: CreateBannerTemplatePayload,
  ): Promise<BannerTemplateModel> {
    const body = {
      name: payload.name,
      franchise_id: payload.franchise_id,
      franchiseId: payload.franchise_id,
      description: payload.description,
      orientation: payload.orientation,
      width_px: payload.width_px,
      widthPx: payload.width_px,
      height_px: payload.height_px,
      heightPx: payload.height_px,
      dimensions_label: payload.dimensions_label,
      dimensionsLabel: payload.dimensions_label,
      is_active: payload.is_active,
      isActive: payload.is_active,
      images: payload.images.map((img, idx) => ({
        imageUrl: img.imageUrl,
        sortOrder: img.sortOrder !== undefined ? img.sortOrder : idx,
      })),
    };

    const data = await request<any>("/api/createBannerTemplate", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const raw = data?.template || data?.data || data;
    return normalizeTemplate(raw);
  },

  /**
   * 5. Update Banner Template
   * Attempts PUT /api/updateBannerTemplate/:id or POST /api/updateBannerTemplate/:id
   */
  async updateBannerTemplate(
    id: number,
    payload: Partial<CreateBannerTemplatePayload>,
  ): Promise<BannerTemplateModel> {
    const body = {
      ...payload,
      id,
    };

    try {
      const data = await request<any>(`/api/updateBannerTemplate/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const raw = data?.template || data?.data || data;
      return normalizeTemplate(raw);
    } catch (err: any) {
      if (err?.status === 404 || err?.status === 405) {
        // Try POST fallback
        try {
          const data = await request<any>(`/api/updateBannerTemplate/${id}`, {
            method: "POST",
            body: JSON.stringify(body),
          });
          const raw = data?.template || data?.data || data;
          return normalizeTemplate(raw);
        } catch (postErr: any) {
          throw new Error(
            `Backend update endpoint (/api/updateBannerTemplate/${id}) is not provided by the server (${postErr.message || "404 Not Found"}).`,
          );
        }
      }
      throw err;
    }
  },

  /**
   * 6. Delete Banner Template
   * Attempts DELETE /api/deleteBannerTemplate/:id
   */
  async deleteBannerTemplate(id: number): Promise<boolean> {
    try {
      await request<any>(`/api/deleteBannerTemplate/${id}`, {
        method: "DELETE",
      });
      return true;
    } catch (err: any) {
      if (err?.status === 404 || err?.status === 405) {
        // Try fallback POST /api/deleteBannerTemplate/:id
        try {
          await request<any>(`/api/deleteBannerTemplate/${id}`, {
            method: "POST",
          });
          return true;
        } catch (postErr: any) {
          throw new Error(
            `Backend delete endpoint (/api/deleteBannerTemplate/${id}) is not provided by the server (${postErr.message || "404 Not Found"}).`,
          );
        }
      }
      throw err;
    }
  },
};
