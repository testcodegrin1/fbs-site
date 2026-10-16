
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

export type BannerFieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "textarea"
  | "date"
  | "dropdown"
  | "select"
  | "radio"
  | "checkbox"
  | "file";

export interface BannerTemplateField {
  id?: number;
  templateId?: number;
  label: string;
  fieldLabel?: string;
  fieldType: BannerFieldType | string;
  placeholder?: string;
  options?: string[];
  isRequired: boolean;
  isEditable: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
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
  dimensions_label?: string;
  dimensionsLabel?: string;
  is_active: boolean;
  isActive?: boolean;
  images: Array<{
    imageUrl: string;
    imageName?: string | null;
    sortOrder: number;
  }>;
  fields?: BannerTemplateField[];
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
      raw.dimensionsLabel ||
      raw.dimensions_label ||
      `${Number(raw.widthPx ?? raw.width_px ?? 1080)}x${Number(raw.heightPx ?? raw.height_px ?? 1080)}`,
    orientation:
      raw.orientation === "portrait" ? "portrait" : "landscape",
    isActive,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    images: normalizedImages,
    fields: Array.isArray(raw.fields)
      ? raw.fields.map((f: any, idx: number) => {
          let options: string[] = [];
          if (Array.isArray(f.options)) {
            options = f.options;
          } else if (typeof f.options === "string") {
            try {
              options = JSON.parse(f.options);
            } catch {
              options = [];
            }
          }
          const label = String(f.label || f.fieldLabel || f.name || `Field ${idx + 1}`);
          return {
            id: f.id ? Number(f.id) : undefined,
            templateId: f.templateId || f.template_id,
            label,
            fieldLabel: label,
            fieldType: String(f.fieldType || f.field_type || "text").toLowerCase(),
            placeholder: f.placeholder ? String(f.placeholder) : undefined,
            options,
            isRequired: Boolean(f.isRequired ?? f.is_required),
            isEditable:
              f.isEditable !== undefined
                ? Boolean(f.isEditable)
                : f.is_editable !== undefined
                  ? Boolean(f.is_editable)
                  : true,
            sortOrder:
              f.sortOrder !== undefined
                ? Number(f.sortOrder)
                : f.sort_order !== undefined
                  ? Number(f.sort_order)
                  : idx,
          };
        })
      : [],
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
  async getBannerTemplates(
    franchiseId?: number,
    includeInactive = true,
  ): Promise<BannerTemplateModel[]> {
    const params = new URLSearchParams();
    if (franchiseId !== undefined && franchiseId !== null && !isNaN(Number(franchiseId))) {
      params.append("franchiseId", String(franchiseId));
    }
    if (includeInactive) {
      params.append("includeInactive", "true");
    }
    const queryString = params.toString();
    const url = queryString
      ? `/api/getBannerTemplates?${queryString}`
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
      is_active: payload.is_active,
      isActive: payload.is_active,
      images: payload.images.map((img, idx) => ({
        imageUrl: img.imageUrl,
        sortOrder: img.sortOrder !== undefined ? img.sortOrder : idx,
      })),
      fields: payload.fields || [],
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

  /**
   * 7. GET /api/getBannerTemplateFields/:id
   */
  async getBannerTemplateFields(id: number): Promise<BannerTemplateField[]> {
    const data = await request<any>(`/api/getBannerTemplateFields/${id}`, {
      method: "GET",
    });
    return Array.isArray(data?.fields) ? data.fields : [];
  },

  /**
   * 8. POST /api/saveBannerCustomization
   */
  async saveBannerCustomization(
    templateIdOrOptions:
      | number
      | {
          templateId: number;
          values: Record<string, any>;
          files?: Record<string, File>;
          franchiseId?: number;
        },
    values?: Record<string, any>,
    files?: Record<string, File>,
    franchiseId?: number,
  ): Promise<any> {
    let tId: number;
    let vals: Record<string, any>;
    let fls: Record<string, File> | undefined;
    let fId: number | undefined;
    let qty: number | undefined;

    if (typeof templateIdOrOptions === "object" && templateIdOrOptions !== null) {
      tId = templateIdOrOptions.templateId;
      vals = templateIdOrOptions.values;
      fls = templateIdOrOptions.files;
      fId = templateIdOrOptions.franchiseId;
      qty = (templateIdOrOptions as any).quantity;
    } else {
      tId = templateIdOrOptions;
      vals = values || {};
      fls = files;
      fId = franchiseId;
    }

    const formData = new FormData();
    formData.append("templateId", String(tId));
    if (fId) {
      formData.append("franchiseId", String(fId));
    }
    if (qty) {
      formData.append("quantity", String(qty));
    }
    formData.append("customizationValues", JSON.stringify(vals));

    if (fls) {
      for (const [key, file] of Object.entries(fls)) {
        if (file instanceof File) {
          formData.append(key, file);
        }
      }
    }

    const data = await request<any>("/api/saveBannerCustomization", {
      method: "POST",
      body: formData,
    });
    return data;
  },

  /**
   * 9. GET /api/getBannerCustomization/:id
   */
  async getBannerCustomization(templateId: number): Promise<any> {
    const data = await request<any>(`/api/getBannerCustomization/${templateId}`, {
      method: "GET",
    });
    return data?.customization ?? null;
  },

  /**
   * 10. POST /api/submitBannerCustomization
   */
  async submitBannerCustomization(options: {
    templateId: number;
    values: Record<string, any>;
    files?: Record<string, File>;
    franchiseId?: number;
    quantity?: number;
  }): Promise<{ message: string; submissionId?: number; submission: any }> {
    const formData = new FormData();
    formData.append("templateId", String(options.templateId));
    if (options.franchiseId) {
      formData.append("franchiseId", String(options.franchiseId));
    }
    if (options.quantity) {
      formData.append("quantity", String(options.quantity));
    }
    formData.append("customizationValues", JSON.stringify(options.values));

    if (options.files) {
      for (const [key, file] of Object.entries(options.files)) {
        if (file instanceof File) {
          formData.append(key, file);
        }
      }
    }

    const data = await request<any>("/api/submitBannerCustomization", {
      method: "POST",
      body: formData,
    });
    return data;
  },

  /**
   * 11. GET /api/bannerSubmissions
   */
  async getBannerSubmissions(params?: {
    search?: string;
    status?: string;
    franchiseId?: number;
  }): Promise<{ submissions: BannerSubmissionListItem[]; total: number }> {
    const queryParts: string[] = [];
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params?.status && params.status !== "all") queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params?.franchiseId) queryParts.push(`franchiseId=${encodeURIComponent(params.franchiseId)}`);

    const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    const data = await request<any>(`/api/bannerSubmissions${qs}`, {
      method: "GET",
    });
    return {
      submissions: Array.isArray(data?.submissions) ? data.submissions : [],
      total: data?.total ?? (data?.submissions?.length || 0),
    };
  },

  /**
   * 12. GET /api/bannerSubmissions/:id
   */
  async getBannerSubmissionById(id: number): Promise<BannerSubmissionDetail | null> {
    const data = await request<any>(`/api/bannerSubmissions/${id}`, {
      method: "GET",
    });
    return data?.submission ?? null;
  },

  /**
   * 13. PUT /api/bannerSubmissions/:id/status
   */
  async updateBannerSubmissionStatus(
    id: number,
    status: string,
  ): Promise<{ id: number; status: string; message: string }> {
    const data = await request<any>(`/api/bannerSubmissions/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return data;
  },

  /**
   * 14. GET /api/myBannerSubmissions
   */
  async getMyBannerSubmissions(): Promise<{ submissions: BannerSubmissionListItem[]; total: number }> {
    const data = await request<any>("/api/myBannerSubmissions", {
      method: "GET",
    });
    return {
      submissions: Array.isArray(data?.submissions) ? data.submissions : [],
      total: data?.total ?? (data?.submissions?.length || 0),
    };
  },

  /**
   * 15. GET /api/bannerSubmissions/:id/thread
   */
  async getBannerSubmissionThread(id: number): Promise<BannerSubmissionThread> {
    const data = await request<BannerSubmissionThread>(`/api/bannerSubmissions/${id}/thread`, {
      method: "GET",
    });
    return data;
  },

  /**
   * 16. POST /api/bannerSubmissions/:id/messages
   */
  async sendBannerSubmissionMessage(
    id: number,
    message: string,
    imageId?: number | null,
    statusAction?: "approved" | "changes_requested" | string,
  ): Promise<BannerSubmissionMessage> {
    const data = await request<any>(`/api/bannerSubmissions/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        imageId: imageId ?? null,
        statusAction: statusAction || undefined,
      }),
    });
    return data?.data || data;
  },

  /**
   * 17. POST /api/bannerSubmissions/:id/files
   */
  async addBannerSubmissionFile(
    id: number,
    file: File,
    fileName?: string,
  ): Promise<BannerSubmissionFile> {
    const formData = new FormData();
    formData.append("file", file);
    if (fileName) {
      formData.append("fileName", fileName);
    }
    const data = await request<any>(`/api/bannerSubmissions/${id}/files`, {
      method: "POST",
      body: formData,
    });
    return data?.file || data;
  },

  /**
   * 18. PUT /api/bannerSubmissions/:id/files/:fileId
   */
  async replaceBannerSubmissionFile(
    id: number,
    fileId: number,
    file: File,
    fileName?: string,
  ): Promise<BannerSubmissionFile> {
    const formData = new FormData();
    formData.append("file", file);
    if (fileName) {
      formData.append("fileName", fileName);
    }
    const data = await request<any>(`/api/bannerSubmissions/${id}/files/${fileId}`, {
      method: "PUT",
      body: formData,
    });
    return data?.file || data;
  },
};

export type BannerSubmissionStatus =
  | "Pending"
  | "In Review"
  | "Changes Requested"
  | "Approved"
  | "Rejected"
  | "Completed";

export interface BannerSubmissionFile {
  id: number;
  submissionId: number;
  version: number;
  fileUrl: string;
  fileName?: string | null;
  uploadedBy: number;
  uploadedByName?: string | null;
  sortOrder: number;
  replacedFileId?: number | null;
  createdAt: string;
  isReplaced?: boolean;
  history?: BannerSubmissionFile[];
}

export interface BannerSubmissionMessage {
  id: number;
  submissionId: number;
  imageId?: number | null;
  senderUserId: number;
  senderRole: string;
  senderName?: string | null;
  message: string;
  createdAt: string;
}

export interface BannerSubmissionThread {
  submission: BannerSubmissionDetail;
  files: BannerSubmissionFile[];
  messages: BannerSubmissionMessage[];
}

export interface BannerSubmissionListItem {
  id: number;
  templateId: number;
  templateName: string;
  widthPx: number;
  heightPx: number;
  orientation: "landscape" | "portrait";
  previewImageUrl?: string | null;
  quantity?: number;
  userId: number;
  userName: string;
  userEmail: string;
  franchiseId?: number | null;
  franchiseName?: string | null;
  status: BannerSubmissionStatus | string;
  customizationValues: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BannerSubmissionDetail {
  id: number;
  templateId: number;
  templateName: string;
  widthPx: number;
  heightPx: number;
  dimensionsLabel?: string;
  previewImageUrl?: string | null;
  images?: BannerTemplateImage[];
  quantity?: number;
  userId: number;
  userName: string;
  userEmail: string;
  franchiseId?: number | null;
  franchiseName?: string | null;
  status: BannerSubmissionStatus | string;
  customizationValues: Record<string, any>;
  submittedFields: Array<{
    id: number | string;
    label: string;
    fieldType: string;
    value: any;
  }>;
  createdAt: string;
  updatedAt: string;
}

