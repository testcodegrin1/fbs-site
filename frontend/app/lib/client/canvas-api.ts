"use client";

import { getStoredToken } from "@/app/lib/auth/token";
import { buildApiUrl } from "@/app/lib/client/api-url";

function apiUrl(path: string) {
  return buildApiUrl(path);
}

export type ClientModel = {
  id: number;
  designerId: number | null;
  name: string;
  email: string;
  phone: string;
  companyName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectModel = {
  id: number;
  clientId: number;
  clientName: string;
  clientEmail: string;
  designerId: number;
  designerName?: string;
  name: string;
  description?: string | null;
  status: "pending" | "in_review" | "changes_requested" | "approved";
  shareToken?: string;
  /** Latest canvas thumbnail for list/card previews */
  previewThumbnailUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  canvases?: CanvasModel[];
};

export type CanvasVersionModel = {
  id: number;
  canvasId: number;
  versionNumber: number;
  originalImageUrl: string;
  watermarkedImageUrl: string;
  thumbnailUrl: string;
  metadata?: Record<string, unknown> | null;
  uploadedBy: number;
  createdAt: string;
};

export type CanvasRemarkModel = {
  id: number;
  canvasId: number;
  versionId: number;
  imageId?: number | null;
  userId?: number | null;
  userName?: string | null;
  remark: string;
  statusAction: "approved" | "changes_requested" | "comment";
  createdAt: string;
};

export type DiagramImageModel = {
  id: number;
  canvasId: number;
  versionId: number;
  originalImageUrl: string;
  watermarkedImageUrl: string;
  thumbnailUrl: string;
  caption?: string | null;
  status: "pending_review" | "approved" | "changes_requested";
  sortOrder: number;
  createdAt: string;
  remarks?: CanvasRemarkModel[];
};

export type CanvasStatusHistoryModel = {
  id: number;
  canvasId: number;
  actorUserId?: number | null;
  actorName?: string | null;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
  createdAt: string;
};

export type CanvasModel = {
  id: number;
  projectId: number;
  name: string;
  canvasType: "individual" | "collage" | "diagram";
  diagramTemplateId?: number | null;
  watermarkEnabled: boolean;
  watermarkText?: string | null;
  status: "pending_review" | "reviewed" | "changes_requested" | "approved";
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  latestVersion?: CanvasVersionModel;
  versions?: CanvasVersionModel[];
  remarks?: CanvasRemarkModel[];
  history?: CanvasStatusHistoryModel[];
  diagramImages?: DiagramImageModel[];
};

export type DiagramTemplateModel = {
  id: number;
  name: string;
  description?: string | null;
  previewUrl?: string | null;
  templateStructure?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };

  if (!(init?.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl(url), {
    ...init,
    headers,
  });

  const data = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) {
    const raw = (data as { message?: unknown })?.message;
    const message =
      typeof raw === "string"
        ? raw
        : raw && typeof raw === "object"
          ? JSON.stringify(raw)
          : "API request failed";
    throw new Error(message);
  }
  return data as T;
}

export const canvasApi = {
  // Public review token lookup
  async getPublicReview(token: string): Promise<{ project: ProjectModel; canvases: CanvasModel[] }> {
    return req<{ project: ProjectModel; canvases: CanvasModel[] }>(`/api/review/${token}`);
  },

  // Clients
  async listClients(search?: string, page = 1, limit = 10): Promise<{ clients: ClientModel[]; total: number; page: number; totalPages: number }> {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    q.set("page", String(page));
    q.set("limit", String(limit));
    return req<{ clients: ClientModel[]; total: number; page: number; totalPages: number }>(`/api/clients?${q.toString()}`);
  },

  async createClient(data: { name: string; email: string; phone: string; companyName?: string }): Promise<ClientModel> {
    return req<ClientModel>("/api/clients", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateClient(id: number, data: Partial<ClientModel>): Promise<ClientModel> {
    return req<ClientModel>(`/api/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteClient(id: number): Promise<void> {
    return req<void>(`/api/clients/${id}`, { method: "DELETE" });
  },

  // Projects
  async listProjects(search?: string, status?: string): Promise<ProjectModel[]> {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (status) q.set("status", status);
    return req<ProjectModel[]>(`/api/projects?${q.toString()}`);
  },

  async getProject(id: number): Promise<ProjectModel> {
    return req<ProjectModel>(`/api/projects/${id}`);
  },

  async createProject(data: { clientId: number; name: string; description?: string }): Promise<ProjectModel> {
    return req<ProjectModel>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateProject(id: number, data: Partial<ProjectModel>): Promise<ProjectModel> {
    return req<ProjectModel>(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteProject(id: number): Promise<void> {
    return req<void>(`/api/projects/${id}`, { method: "DELETE" });
  },

  async getProjectShareToken(projectId: number): Promise<{ shareToken: string }> {
    return req<{ shareToken: string }>(`/api/projects/${projectId}/share`);
  },

  // Canvases
  async uploadCanvas(formData: FormData): Promise<CanvasModel[]> {
    return req<CanvasModel[]>("/api/canvases/upload", {
      method: "POST",
      body: formData,
    });
  },

  async uploadRevision(canvasId: number, formData: FormData): Promise<CanvasModel> {
    return req<CanvasModel>(`/api/canvases/${canvasId}/revisions`, {
      method: "POST",
      body: formData,
    });
  },

  async addRemark(
    canvasId: number,
    data: {
      versionId: number;
      imageId?: number;
      userId?: number;
      userName?: string;
      remark: string;
      statusAction: "approved" | "changes_requested" | "comment";
    },
  ): Promise<CanvasModel> {
    return req<CanvasModel>(`/api/canvases/${canvasId}/remarks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteCanvas(id: number): Promise<void> {
    return req<void>(`/api/canvases/${id}`, { method: "DELETE" });
  },

  async updateCanvasInfo(
    id: number,
    data: { name?: string; watermarkEnabled?: boolean; watermarkText?: string },
  ): Promise<void> {
    return req<void>(`/api/canvases/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async updateSubImage(imageId: number, formData: FormData): Promise<void> {
    return req<void>(`/api/canvases/sub-images/${imageId}`, {
      method: "PUT",
      body: formData,
    });
  },

  async addSubImage(canvasId: number, formData: FormData): Promise<{ id: number }> {
    return req<{ id: number }>(`/api/canvases/${canvasId}/sub-images`, {
      method: "POST",
      body: formData,
    });
  },

  async deleteSubImage(imageId: number): Promise<void> {
    return req<void>(`/api/canvases/sub-images/${imageId}`, { method: "DELETE" });
  },

  async unbundleCollage(id: number): Promise<CanvasModel[]> {
    return req<CanvasModel[]>(`/api/canvases/${id}/unbundle`, { method: "POST" });
  },

  // Diagram Templates
  async listDiagramTemplates(): Promise<DiagramTemplateModel[]> {
    return req<DiagramTemplateModel[]>("/api/diagram-templates");
  },

  async createDiagramTemplate(data: FormData | { name: string; description?: string; previewUrl?: string }): Promise<DiagramTemplateModel> {
    return req<DiagramTemplateModel>("/api/diagram-templates", {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },

  async updateDiagramTemplate(id: number, data: FormData | { name?: string; description?: string; previewUrl?: string }): Promise<DiagramTemplateModel> {
    return req<DiagramTemplateModel>(`/api/diagram-templates/${id}`, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },

  async deleteDiagramTemplate(id: number): Promise<void> {
    return req<void>(`/api/diagram-templates/${id}`, { method: "DELETE" });
  },
};
