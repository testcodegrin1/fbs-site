"use client";

import { getStoredToken } from "@/app/lib/auth/token";
import {
  buildApiUrl,
  getApiBaseUrl,
} from "@/app/lib/client/api-url";

export { getApiBaseUrl } from "@/app/lib/client/api-url";

export interface ProductTemplateImage {
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

export type ProductFieldType =
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

export interface ProductTemplateField {
  id?: number;
  templateId?: number;
  label: string;
  fieldLabel?: string;
  fieldType: ProductFieldType | string;
  placeholder?: string;
  options?: string[];
  isRequired: boolean;
  isEditable: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductTemplateModel {
  id: number;
  name: string;
  description?: string;
  widthPx: number;
  heightPx: number;
  dimensionsLabel?: string;
  orientation: "landscape" | "portrait";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  images: ProductTemplateImage[];
  fields?: ProductTemplateField[];
}

export interface CreateProductTemplatePayload {
  name: string;
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
  fields?: ProductTemplateField[];
}

/**
 * Resolves an image path to an absolute URL based on the environment backend URL.
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

  // 4. Filename in public root
  const filename = cleanPath.split("/").pop();
  if (filename && `/${filename}` !== cleanPath) {
    candidates.push(`/${filename}`);
  }

  return [...new Set(candidates)];
}

function normalizeTemplate(raw: any): ProductTemplateModel {
  if (!raw || typeof raw !== "object") {
    return {
      id: 0,
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
  const normalizedImages: ProductTemplateImage[] = rawImages.map(
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
      imageType: img.imageType || img.image_type || "product",
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

  return {
    id: Number(raw.id),
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
  const url = buildApiUrl(path);

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

export const productTemplateApi = {
  getApiBaseUrl,
  resolveImageUrl,
  getCandidateImageUrls,

  /**
   * Upload Product Image File
   * POST /api/uploadProductImage
   */
  async uploadProductImage(file: File): Promise<{
    imageUrl: string;
    filename: string;
    originalName: string;
    size: number;
  }> {
    const formData = new FormData();
    formData.append("image", file);

    return await request<{
      imageUrl: string;
      filename: string;
      originalName: string;
      size: number;
    }>("/api/uploadProductImage", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Fetches all product templates
   * GET /api/getProductTemplates
   */
  async getProductTemplates(
    includeInactive = true,
  ): Promise<ProductTemplateModel[]> {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.append("includeInactive", "true");
    }
    const queryString = params.toString();
    const url = queryString
      ? `/api/getProductTemplates?${queryString}`
      : "/api/getProductTemplates";

    const data = await request<any>(url, { method: "GET" });

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.templates)
        ? data.templates
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.productTemplates)
              ? data.productTemplates
              : [];

    return list.map(normalizeTemplate);
  },

  /**
   * Fetches single product template details
   * GET /api/getProductTemplate/:id
   */
  async getProductTemplate(id: number): Promise<ProductTemplateModel> {
    const data = await request<any>(`/api/getProductTemplate/${id}`, {
      method: "GET",
    });

    const raw = data?.template || data?.data || data;
    return normalizeTemplate(raw);
  },

  /**
   * Submits JSON payload to create a new product template
   * POST /api/createProductTemplate
   */
  async createProductTemplate(
    payload: CreateProductTemplatePayload,
  ): Promise<ProductTemplateModel> {
    const body = {
      name: payload.name,
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

    const data = await request<any>("/api/createProductTemplate", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const raw = data?.template || data?.data || data;
    return normalizeTemplate(raw);
  },

  /**
   * Update Product Template
   */
  async updateProductTemplate(
    id: number,
    payload: Partial<CreateProductTemplatePayload>,
  ): Promise<ProductTemplateModel> {
    const body = {
      ...payload,
      id,
    };

    const data = await request<any>(`/api/updateProductTemplate/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const raw = data?.template || data?.data || data;
    return normalizeTemplate(raw);
  },

  /**
   * Delete Product Template
   */
  async deleteProductTemplate(id: number): Promise<boolean> {
    await request<any>(`/api/deleteProductTemplate/${id}`, {
      method: "DELETE",
    });
    return true;
  },

  /**
   * GET fields for a template
   */
  async getProductTemplateFields(id: number): Promise<ProductTemplateField[]> {
    const data = await request<any>(`/api/getProductTemplateFields/${id}`, {
      method: "GET",
    });
    return Array.isArray(data?.fields) ? data.fields : [];
  },

  /**
   * Save Product Customization (draft / save)
   */
  async saveProductCustomization(
    templateIdOrOptions:
      | number
      | {
          templateId: number;
          values: Record<string, any>;
          files?: Record<string, File>;
          quantity?: number;
        },
    values?: Record<string, any>,
    files?: Record<string, File>,
  ): Promise<any> {
    let tId: number;
    let vals: Record<string, any>;
    let fls: Record<string, File> | undefined;
    let qty: number | undefined;

    if (typeof templateIdOrOptions === "object" && templateIdOrOptions !== null) {
      tId = templateIdOrOptions.templateId;
      vals = templateIdOrOptions.values;
      fls = templateIdOrOptions.files;
      qty = templateIdOrOptions.quantity;
    } else {
      tId = templateIdOrOptions;
      vals = values || {};
      fls = files;
    }

    const formData = new FormData();
    formData.append("templateId", String(tId));
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

    return await request<any>("/api/saveProductCustomization", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Get Product Customization
   */
  async getProductCustomization(templateId: number): Promise<any> {
    const data = await request<any>(`/api/getProductCustomization/${templateId}`, {
      method: "GET",
    });
    return data?.customization ?? null;
  },

  /**
   * Submit Product Customization
   */
  async submitProductCustomization(options: {
    templateId: number;
    values: Record<string, any>;
    files?: Record<string, File>;
    quantity?: number;
  }): Promise<{ message: string; submissionId?: number; submission: any }> {
    const formData = new FormData();
    formData.append("templateId", String(options.templateId));
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

    return await request<any>("/api/submitProductCustomization", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * GET Submissions for Super Admin & Staff
   */
  async getProductSubmissions(params?: {
    search?: string;
    status?: string;
  }): Promise<{ submissions: ProductSubmissionListItem[]; total: number }> {
    const queryParts: string[] = [];
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params?.status && params.status !== "all") queryParts.push(`status=${encodeURIComponent(params.status)}`);

    const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

    const data = await request<any>(`/api/productSubmissions${qs}`, {
      method: "GET",
    });

    return {
      submissions: Array.isArray(data?.submissions) ? data.submissions : [],
      total: data?.total ?? (data?.submissions?.length || 0),
    };
  },

  /**
   * GET single submission by ID
   */
  async getProductSubmissionById(id: number): Promise<ProductSubmissionDetail | null> {
    const data = await request<any>(`/api/productSubmissions/${id}`, {
      method: "GET",
    });
    return data?.submission ?? null;
  },

  /**
   * Update submission status
   */
  async updateProductSubmissionStatus(
    id: number,
    status: string,
  ): Promise<{ id: number; status: string; message: string }> {
    return await request<any>(`/api/productSubmissions/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  },

  /**
   * GET My Submissions
   */
  async getMyProductSubmissions(): Promise<{ submissions: ProductSubmissionListItem[]; total: number }> {
    const data = await request<any>("/api/myProductSubmissions", {
      method: "GET",
    });
    return {
      submissions: Array.isArray(data?.submissions) ? data.submissions : [],
      total: data?.total ?? (data?.submissions?.length || 0),
    };
  },

  /**
   * GET submission thread
   */
  async getProductSubmissionThread(id: number): Promise<ProductSubmissionThread> {
    return await request<ProductSubmissionThread>(`/api/productSubmissions/${id}/thread`, {
      method: "GET",
    });
  },

  /**
   * Send submission thread message
   */
  async sendProductSubmissionMessage(
    id: number,
    message: string,
    imageId?: number | null,
    statusAction?: "approved" | "changes_requested" | string,
  ): Promise<ProductSubmissionMessage> {
    const body = {
      message,
      imageId: imageId ?? null,
      statusAction: statusAction || undefined,
    };

    const data = await request<any>(`/api/productSubmissions/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return data?.data || data;
  },

  /**
   * Add photo file to submission
   */
  async addProductSubmissionFile(
    id: number,
    file: File,
    fileName?: string,
  ): Promise<ProductSubmissionFile> {
    const formData = new FormData();
    formData.append("file", file);
    if (fileName) {
      formData.append("fileName", fileName);
    }

    const data = await request<any>(`/api/productSubmissions/${id}/files`, {
      method: "POST",
      body: formData,
    });
    return data?.file || data;
  },

  /**
   * Replace photo file in submission
   */
  async replaceProductSubmissionFile(
    id: number,
    fileId: number,
    file: File,
    fileName?: string,
  ): Promise<ProductSubmissionFile> {
    const formData = new FormData();
    formData.append("file", file);
    if (fileName) {
      formData.append("fileName", fileName);
    }

    const data = await request<any>(`/api/productSubmissions/${id}/files/${fileId}`, {
      method: "PUT",
      body: formData,
    });
    return data?.file || data;
  },
};

export type ProductSubmissionStatus =
  | "Pending"
  | "In Review"
  | "Changes Requested"
  | "Approved"
  | "Rejected"
  | "Completed";

export interface ProductSubmissionFile {
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
  history?: ProductSubmissionFile[];
}

export interface ProductSubmissionMessage {
  id: number;
  submissionId: number;
  imageId?: number | null;
  senderUserId: number;
  senderRole: string;
  senderName?: string | null;
  message: string;
  createdAt: string;
}

export interface ProductSubmissionThread {
  submission: ProductSubmissionDetail;
  files: ProductSubmissionFile[];
  messages: ProductSubmissionMessage[];
}

export interface ProductSubmissionListItem {
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
  status: ProductSubmissionStatus | string;
  customizationValues: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSubmissionDetail {
  id: number;
  templateId: number;
  templateName: string;
  widthPx: number;
  heightPx: number;
  dimensionsLabel?: string;
  previewImageUrl?: string | null;
  images?: ProductTemplateImage[];
  quantity?: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: ProductSubmissionStatus | string;
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
