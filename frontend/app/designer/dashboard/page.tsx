"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/app/Components/auth/AuthGuard";
import { SidebarLayout, type SidebarNavItem } from "@/app/Components/auth/SidebarLayout";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  Input,
  Textarea,
  Select,
  StatusBadge,
} from "@/app/Components/ui";
import {
  canvasApi,
  type ClientModel,
  type ProjectModel,    
  type CanvasModel,
  type DiagramTemplateModel,
} from "@/app/lib/client/canvas-api";
import {
  Plus,
  Search,
  Share2,
  Upload,   
  UserPlus,
  FolderKanban,
  Trash2,
  Edit,
  AlertCircle,
  FileImage,
  Layers,
  Copy,
  Mail,
  MessageCircle,
  Smartphone,
  Eye,
  RefreshCw,
  X,
  Users,
  Check,
  Loader2,
  Maximize2,
  MessageSquare,
  List,
  LayoutGrid,
  Split,
} from "lucide-react";

export default function DesignerDashboardPage() {
  return (
    <AuthGuard requiredRole="designer">
      {(user) => <DesignerStudioContent designerUser={user} />}
    </AuthGuard>
  );
}

function DesignerStudioContent({ designerUser }: { designerUser: any }) {
  const [activeTab, setActiveTab] = useState("projects");

  // Clients State
  const [clients, setClients] = useState<ClientModel[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientModel | null>(null);
  const [clientForm, setClientForm] = useState({ name: "", email: "", phone: "", companyName: "" });
  const [savingClient, setSavingClient] = useState(false);

  // Projects State
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectListViewMode, setProjectListViewMode] = useState<"card" | "list">("card");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectModel | null>(null);
  const [projectForm, setProjectForm] = useState({ clientId: "", name: "", description: "" });
  const [selectedProject, setSelectedProject] = useState<ProjectModel | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [refreshingProjects, setRefreshingProjects] = useState(false);

  // Upload Canvas Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [canvasForm, setCanvasForm] = useState({
    name: "",
    canvasType: "individual" as "individual" | "collage" | "diagram",
    diagramTemplateId: "",
    watermarkEnabled: true,
    watermarkText: "CONFIDENTIAL REVIEW",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingCanvas, setUploadingCanvas] = useState(false);

  // Edit / Revision Modal State (Shows Client Feedback & Options)
  const [showEditCanvasModal, setShowEditCanvasModal] = useState(false);
  const [targetCanvas, setTargetCanvas] = useState<CanvasModel | null>(null);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [uploadingRevision, setUploadingRevision] = useState(false);

  // Share Link Modal State
  const [shareModalToken, setShareModalToken] = useState<string | null>(null);
  const [shareProject, setShareProject] = useState<ProjectModel | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Editable Canvas & Sub-Image Tile State
  const [editingCanvasName, setEditingCanvasName] = useState("");
  const [updatingSubImageId, setUpdatingSubImageId] = useState<number | null>(null);
  const [savingCanvasInfo, setSavingCanvasInfo] = useState(false);
  const [addingSubImage, setAddingSubImage] = useState(false);
  const [newSubImageFile, setNewSubImageFile] = useState<File | null>(null);
  const [newSubImageCaption, setNewSubImageCaption] = useState("");

  // Optional designer reply remarks (key: imageId, or 0 for whole-canvas)
  const [designerReplyDrafts, setDesignerReplyDrafts] = useState<Record<number, string>>({});
  const [submittingDesignerReplyKey, setSubmittingDesignerReplyKey] = useState<number | null>(null);

  // Fullscreen Lightbox Preview State
  const [fullscreenCanvas, setFullscreenCanvas] = useState<{
    url: string;
    name: string;
    version: number;
    projectName?: string;
    status?: string;
    canvasType?: string;
    date?: string;
  } | null>(null);

  // Diagrams State
  const [diagramTemplates, setDiagramTemplates] = useState<DiagramTemplateModel[]>([]);
  const [showDiagramModal, setShowDiagramModal] = useState(false);
  const [editingDiagram, setEditingDiagram] = useState<DiagramTemplateModel | null>(null);
  const [diagramForm, setDiagramForm] = useState({ name: "", description: "" });
  const [diagramImageFile, setDiagramImageFile] = useState<File | null>(null);
  const [savingDiagram, setSavingDiagram] = useState(false);
  const [deletingDiagramId, setDeletingDiagramId] = useState<number | null>(null);

  // Custom Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    id: number | null;
    deleting: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    id: null,
    deleting: false,
    onConfirm: async () => {},
  });

  const backendHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  // ESC Key Listener to close all popups
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowClientModal(false);
        setShowProjectModal(false);
        setShowUploadModal(false);
        setShowEditCanvasModal(false);
        setShowDiagramModal(false);
        setDeleteModal({ isOpen: false, title: "", description: "", id: null, deleting: false, onConfirm: async () => {} });
        setShareModalToken(null);
        setFullscreenCanvas(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleSaveDiagramBlueprint(e: React.FormEvent) {
    e.preventDefault();
    if (!diagramForm.name.trim()) return;
    setSavingDiagram(true);
    try {
      const formData = new FormData();
      formData.append("name", diagramForm.name.trim());
      if (diagramForm.description.trim()) {
        formData.append("description", diagramForm.description.trim());
      }
      if (diagramImageFile) {
        formData.append("image", diagramImageFile);
      }

      if (editingDiagram) {
        await canvasApi.updateDiagramTemplate(editingDiagram.id, formData);
      } else {
        await canvasApi.createDiagramTemplate(formData);
      }

      setShowDiagramModal(false);
      setEditingDiagram(null);
      setDiagramForm({ name: "", description: "" });
      setDiagramImageFile(null);

      const data = await canvasApi.listDiagramTemplates();
      setDiagramTemplates(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save diagram blueprint.");
    } finally {
      setSavingDiagram(false);
    }
  }

  function handleOpenEditDiagramBlueprint(d: DiagramTemplateModel) {
    setEditingDiagram(d);
    setDiagramForm({ name: d.name, description: d.description || "" });
    setDiagramImageFile(null);
    setShowDiagramModal(true);
  }

  function promptDeleteDiagramBlueprint(d: DiagramTemplateModel) {
    setDeleteModal({
      isOpen: true,
      title: "Delete Diagram Blueprint",
      description: `Are you sure you want to delete "${d.name}"? The diagram photo and structure will be permanently removed.`,
      id: d.id,
      deleting: false,
      onConfirm: async () => {
        setDeletingDiagramId(d.id);
        setDeleteModal((prev) => ({ ...prev, deleting: true }));
        try {
          await canvasApi.deleteDiagramTemplate(d.id);
          setDiagramTemplates((prev) => prev.filter((item) => item.id !== d.id));
          setDeleteModal({ isOpen: false, title: "", description: "", id: null, deleting: false, onConfirm: async () => {} });
        } catch (err) {
          alert(err instanceof Error ? err.message : "Failed to delete diagram blueprint.");
        } finally {
          setDeletingDiagramId(null);
          setDeleteModal((prev) => ({ ...prev, deleting: false }));
        }
      },
    });
  }

  const navItems: SidebarNavItem[] = [
    { id: "projects", label: "Client Projects", icon: FolderKanban, badge: projects.length },
    { id: "clients", label: "Clients Directory", icon: Users, badge: clients.length },
    { id: "diagrams", label: "Diagram Blueprints", icon: Layers, badge: diagramTemplates.length },
  ];

  async function loadClients() {
    try {
      const res = await canvasApi.listClients(clientSearch, clientPage, 10);
      setClients(res.clients);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadProjects(opts?: { refreshDetails?: boolean }) {
    try {
      const data = await canvasApi.listProjects(projectSearch);
      setProjects(data);
      if (selectedProject) {
        const updated = data.find((p) => p.id === selectedProject.id);
        if (updated) {
          // Keep list fields fresh without re-hitting slow detail API unless asked
          setSelectedProject((prev) =>
            prev && prev.id === updated.id
              ? {
                  ...prev,
                  name: updated.name,
                  status: updated.status,
                  clientName: updated.clientName,
                  clientEmail: updated.clientEmail,
                  shareToken: updated.shareToken,
                  updatedAt: updated.updatedAt,
                }
              : prev,
          );
          if (opts?.refreshDetails) {
            await loadProjectDetails(updated.id);
          }
        } else if (data.length > 0) {
          await loadProjectDetails(data[0].id);
        } else {
          setSelectedProject(null);
        }
      } else if (data.length > 0) {
        await loadProjectDetails(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadProjectDetails(projectId: number) {
    // Optimistic: paint list card instantly while detail API runs (~remote MySQL RTT)
    setSelectedProject((prev) => {
      if (prev?.id === projectId) return prev;
      const fromList = projects.find((p) => p.id === projectId);
      return fromList ?? prev;
    });

    try {
      const data = await canvasApi.getProject(projectId);
      setSelectedProject(data);
      if (targetCanvas) {
        const updatedCanvas = data.canvases?.find((c) => c.id === targetCanvas.id);
        if (updatedCanvas) {
          setTargetCanvas(updatedCanvas);
        } else if (targetCanvas.projectId === projectId) {
          setTargetCanvas(null);
          setShowEditCanvasModal(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadDiagrams() {
    try {
      const data = await canvasApi.listDiagramTemplates();
      setDiagramTemplates(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadClients();
  }, [clientSearch, clientPage]);

  useEffect(() => {
    loadProjects();
  }, [projectSearch]);

  useEffect(() => {
    loadDiagrams();
  }, []);

  useEffect(() => {
    if (activeTab === "clients") loadClients();
    if (activeTab === "projects") loadProjects();
    if (activeTab === "diagrams") loadDiagrams();
  }, [activeTab]);

  // CLIENT CRUD
  function handleOpenAddClient() {
    setEditingClient(null);
    setClientForm({ name: "", email: "", phone: "", companyName: "" });
    setShowClientModal(true);
  }

  function handleOpenEditClient(client: ClientModel) {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      companyName: client.companyName || "",
    });
    setShowClientModal(true);
  }

  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault();
    setSavingClient(true);
    try {
      if (editingClient) {
        await canvasApi.updateClient(editingClient.id, clientForm);
      } else {
        await canvasApi.createClient(clientForm);
      }
      setShowClientModal(false);
      loadClients();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving client");
    } finally {
      setSavingClient(false);
    }
  }

  function promptDeleteClient(c: ClientModel) {
    setDeleteModal({
      isOpen: true,
      title: "Delete Client Profile",
      description: `Are you sure you want to delete client "${c.name}"? This action will permanently remove their profile.`,
      id: c.id,
      deleting: false,
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, deleting: true }));
        try {
          await canvasApi.deleteClient(c.id);
          setDeleteModal({ isOpen: false, title: "", description: "", id: null, deleting: false, onConfirm: async () => {} });
          loadClients();
        } catch (err) {
          alert(err instanceof Error ? err.message : "Error deleting client");
        } finally {
          setDeleteModal((prev) => ({ ...prev, deleting: false }));
        }
      },
    });
  }

  // PROJECT CRUD
  function handleOpenAddProject() {
    setEditingProject(null);
    setProjectForm({ clientId: clients[0]?.id ? String(clients[0].id) : "", name: "", description: "" });
    setShowProjectModal(true);
  }

  function handleOpenEditProject(proj: ProjectModel) {
    setEditingProject(proj);
    setProjectForm({
      clientId: String(proj.clientId),
      name: proj.name,
      description: proj.description || "",
    });
    setShowProjectModal(true);
  }

  async function handleSaveProject(e: React.FormEvent) {
    e.preventDefault();
    setSavingProject(true);
    try {
      if (editingProject) {
        const updated = await canvasApi.updateProject(editingProject.id, {
          name: projectForm.name,
          description: projectForm.description,
        });
        setSelectedProject(updated);
      } else {
        const created = await canvasApi.createProject({
          clientId: Number(projectForm.clientId),
          name: projectForm.name,
          description: projectForm.description,
        });
        loadProjectDetails(created.id);
      }
      setShowProjectModal(false);
      loadProjects();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving project");
    } finally {
      setSavingProject(false);
    }
  }

  function promptDeleteProject(proj: ProjectModel) {
    setDeleteModal({
      isOpen: true,
      title: "Delete Client Project",
      description: `Are you sure you want to delete project "${proj.name}" and all its canvases? Physical uploaded image files will be purged from storage.`,
      id: proj.id,
      deleting: false,
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, deleting: true }));
        try {
          await canvasApi.deleteProject(proj.id);
          setProjects((prev) => prev.filter((p) => p.id !== proj.id));
          if (selectedProject?.id === proj.id) setSelectedProject(null);
          setDeleteModal({ isOpen: false, title: "", description: "", id: null, deleting: false, onConfirm: async () => {} });
        } catch (err) {
          alert(err instanceof Error ? err.message : "Error deleting project");
        } finally {
          setDeleteModal((prev) => ({ ...prev, deleting: false }));
        }
      },
    });
  }

  function promptDeleteCanvas(canvasId: number, canvasName: string) {
    if (!selectedProject) return;
    const projectId = selectedProject.id;
    setDeleteModal({
      isOpen: true,
      title: "Delete Canvas Entry",
      description: `Are you sure you want to delete canvas "${canvasName}"? All original, watermarked, and thumbnail image files will be purged from storage.`,
      id: canvasId,
      deleting: false,
      onConfirm: async () => {
        // Instant UI removal + close modal on confirm (don't wait for API)
        setDeleteModal({ isOpen: false, title: "", description: "", id: null, deleting: false, onConfirm: async () => {} });
        setSelectedProject((prev) =>
          prev ? { ...prev, canvases: prev.canvases?.filter((c) => c.id !== canvasId) } : prev
        );
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, canvases: p.canvases?.filter((c) => c.id !== canvasId) }
              : p
          )
        );
        if (targetCanvas?.id === canvasId) {
          setTargetCanvas(null);
          setShowEditCanvasModal(false);
        }

        try {
          await canvasApi.deleteCanvas(canvasId);
          // Refresh from server so list stays in sync
          await loadProjectDetails(projectId);
        } catch (err) {
          alert(err instanceof Error ? err.message : "Error deleting canvas");
          // Restore accurate state if delete failed
          await loadProjectDetails(projectId);
        }
      },
    });
  }

  // UPLOAD CANVAS HANDLER
  async function handleUploadCanvas(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject || (selectedFiles.length === 0 && !canvasForm.diagramTemplateId)) return;

    setUploadingCanvas(true);
    try {
      const formData = new FormData();
      formData.append("projectId", String(selectedProject.id));
      formData.append("name", canvasForm.name);
      formData.append("canvasType", canvasForm.canvasType);
      if (canvasForm.diagramTemplateId) {
        formData.append("diagramTemplateId", canvasForm.diagramTemplateId);
      }
      formData.append("watermarkEnabled", String(canvasForm.watermarkEnabled));
      formData.append("watermarkText", canvasForm.watermarkText);

      selectedFiles.forEach((file) => formData.append("files", file));

      await canvasApi.uploadCanvas(formData);
      setShowUploadModal(false);
      setSelectedFiles([]);
      setCanvasForm({
        name: "",
        canvasType: "individual",
        diagramTemplateId: "",
        watermarkEnabled: true,
        watermarkText: "CONFIDENTIAL REVIEW",
      });
      loadProjectDetails(selectedProject.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingCanvas(false);
    }
  }

  // UPLOAD REVISION HANDLER
  // async function handleUploadRevision(e: React.FormEvent) {
  //   e.preventDefault();
  //   if (!targetCanvas || !revisionFile || !selectedProject) return;

  //   setUploadingRevision(true);
  //   try {
  //     const formData = new FormData();
  //     formData.append("file", revisionFile);
  //     formData.append("watermarkEnabled", String(targetCanvas.watermarkEnabled));
  //     formData.append("watermarkText", targetCanvas.watermarkText || "");

  //     await canvasApi.uploadRevision(targetCanvas.id, formData);
  //     setShowEditCanvasModal(false);
  //     setTargetCanvas(null);
  //     setRevisionFile(null);
  //     loadProjectDetails(selectedProject.id);
  //   } catch (err) {
  //     alert(err instanceof Error ? err.message : "Revision upload failed");
  //   } finally {
  //     setUploadingRevision(false);
  //   }
  // }

  async function handleSaveCanvasInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!targetCanvas || !selectedProject) return;
    setSavingCanvasInfo(true);
    try {
      await canvasApi.updateCanvasInfo(targetCanvas.id, {
        name: editingCanvasName,
      });
      loadProjectDetails(selectedProject.id);
      alert("Canvas title updated!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update canvas.");
    } finally {
      setSavingCanvasInfo(false);
    }
  }

  async function handleReplaceSubImageFile(imageId: number, file: File, caption?: string) {
    if (!targetCanvas || !selectedProject) return;
    setUpdatingSubImageId(imageId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (caption) fd.append("caption", caption);
      fd.append("watermarkEnabled", String(targetCanvas.watermarkEnabled));
      if (targetCanvas.watermarkText) fd.append("watermarkText", targetCanvas.watermarkText);

      await canvasApi.updateSubImage(imageId, fd);
      await loadProjectDetails(selectedProject.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to replace image tile.");
    } finally {
      setUpdatingSubImageId(null);
    }
  }

  async function handleAddSubImageTile(file: File, caption?: string) {
    if (!targetCanvas || !selectedProject || !targetCanvas.latestVersion) return;
    setAddingSubImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("versionId", String(targetCanvas.latestVersion.id));
      if (caption) fd.append("caption", caption);
      fd.append("watermarkEnabled", String(targetCanvas.watermarkEnabled));
      if (targetCanvas.watermarkText) fd.append("watermarkText", targetCanvas.watermarkText);

      await canvasApi.addSubImage(targetCanvas.id, fd);
      await loadProjectDetails(selectedProject.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add new photo tile.");
    } finally {
      setAddingSubImage(false);
    }
  }

  function promptDeleteSubImageTile(imageId: number) {
    if (!targetCanvas || !selectedProject) return;
    setDeleteModal({
      isOpen: true,
      title: "Remove Photo Tile",
      description: "Are you sure you want to remove this photo tile from the collage presentation?",
      id: imageId,
      deleting: false,
      onConfirm: async () => {
        setUpdatingSubImageId(imageId);
        setDeleteModal((prev) => ({ ...prev, deleting: true }));
        try {
          await canvasApi.deleteSubImage(imageId);
          setTargetCanvas((prev) =>
            prev
              ? {
                  ...prev,
                  diagramImages: prev.diagramImages?.filter((img) => img.id !== imageId),
                }
              : prev
          );
          setSelectedProject((prev) =>
            prev
              ? {
                  ...prev,
                  canvases: prev.canvases?.map((c) =>
                    c.id === targetCanvas.id
                      ? {
                          ...c,
                          diagramImages: c.diagramImages?.filter((img) => img.id !== imageId),
                        }
                      : c
                  ),
                }
              : prev
          );
          setDeleteModal({ isOpen: false, title: "", description: "", id: null, deleting: false, onConfirm: async () => {} });
        } catch (err) {
          alert(err instanceof Error ? err.message : "Failed to delete photo tile.");
        } finally {
          setUpdatingSubImageId(null);
          setDeleteModal((prev) => ({ ...prev, deleting: false }));
        }
      },
    });
  }

  async function handleReplaceMainImage(file: File) {
    if (!targetCanvas || !selectedProject) return;
    setUploadingRevision(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("watermarkEnabled", String(targetCanvas.watermarkEnabled));
      formData.append("watermarkText", targetCanvas.watermarkText || "");

      await canvasApi.uploadRevision(targetCanvas.id, formData);
      await loadProjectDetails(selectedProject.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to replace canvas image.");
    } finally {
      setUploadingRevision(false);
    }
  }

  /** Optional designer reply - does not change approval status (statusAction: comment) */
  async function handleDesignerReply(imageId?: number | null) {
    if (!targetCanvas?.latestVersion || !selectedProject) return;
    const key = imageId ?? 0;
    const text = (designerReplyDrafts[key] || "").trim();
    if (!text) {
      alert("Enter a remark before sending (or leave it blank and skip).");
      return;
    }

    setSubmittingDesignerReplyKey(key);
    try {
      await canvasApi.addRemark(targetCanvas.id, {
        versionId: targetCanvas.latestVersion.id,
        imageId: imageId || undefined,
        userId: designerUser?.id,
        userName: designerUser?.name || "Designer",
        remark: text,
        statusAction: "comment",
      });
      setDesignerReplyDrafts((prev) => ({ ...prev, [key]: "" }));
      await loadProjectDetails(selectedProject.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add designer remark.");
    } finally {
      setSubmittingDesignerReplyKey(null);
    }
  }

  function renderRemarkThread(
    remarks: NonNullable<CanvasModel["remarks"]>,
    options?: { highlightChanges?: boolean },
  ) {
    const highlight = options?.highlightChanges;
    return (
      <div
        className={`text-[11px] p-2.5 rounded-xl border space-y-1.5 ${
          highlight
            ? "text-slate-700 bg-slate-50 border-slate-200"
            : "text-slate-600 bg-slate-50 border-slate-200"
        }`}
      >
        <span className="font-bold text-[10px] uppercase tracking-wide flex items-center gap-1 text-slate-500">
          <MessageSquare size={11} className="text-violet-500" />
          Conversation ({remarks.length})
        </span>
        {remarks.map((r) => {
          const isDesignerNote = r.statusAction === "comment";
          return (
            <div key={r.id} className="text-[11px] leading-snug">
              <strong className={isDesignerNote ? "text-violet-700" : "text-slate-800"}>
                {r.userName || (isDesignerNote ? "Designer" : "Client")}:
              </strong>{" "}
              &quot;{r.remark}&quot;
            </div>
          );
        })}
      </div>
    );
  }

  function renderOptionalDesignerReply(imageId?: number | null, compact = false) {
    const key = imageId ?? 0;
    const isSubmitting = submittingDesignerReplyKey === key;
    const draft = designerReplyDrafts[key] || "";

    return (
      <div className={`space-y-2 ${compact ? "mt-2" : "mt-2.5"}`}>
        <label className="text-[10px] font-bold uppercase tracking-wide text-violet-600 flex items-center gap-1">
          <MessageSquare size={11} />
          Designer reply{" "}
          <span className="font-medium text-slate-400 normal-case">(optional)</span>
        </label>
        <Textarea
          rows={compact ? 2 : 3}
          value={draft}
          onChange={(e) => setDesignerReplyDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
          placeholder="Optional note back to the client (e.g. revision notes, questions)..."
          className="w-full rounded-xl border border-slate-200 p-2.5 text-[11px] min-h-[56px] focus-visible:ring-violet-500/20 focus-visible:border-violet-400 bg-white"
        />
        <Button
          type="button"
          disabled={isSubmitting || !draft.trim()}
          onClick={() => handleDesignerReply(imageId)}
          className="w-full h-9 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-700 text-[11px] font-bold shadow-none border border-violet-200 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : null}
          {isSubmitting ? "Sending..." : "Send Reply"}
        </Button>
      </div>
    );
  }

  // const [unbundling, setUnbundling] = useState(false);

  // function promptUnbundleCollage() {
  //   if (!targetCanvas || !selectedProject) return;
  //   setDeleteModal({
  //     isOpen: true,
  //     title: "Unbundle Collage Photos",
  //     description: "Unbundle this collage into individual standalone canvases? Each photo in this collage will become its own separate editable canvas entry.",
  //     id: targetCanvas.id,
  //     deleting: false,
  //     onConfirm: async () => {
  //       setUnbundling(true);
  //       setDeleteModal((prev) => ({ ...prev, deleting: true }));
  //       try {
  //         await canvasApi.unbundleCollage(targetCanvas.id);
  //         setShowEditCanvasModal(false);
  //         setTargetCanvas(null);
  //         setDeleteModal({ isOpen: false, title: "", description: "", id: null, deleting: false, onConfirm: async () => {} });
  //         await loadProjectDetails(selectedProject.id);
  //       } catch (err) {
  //         alert(err instanceof Error ? err.message : "Failed to unbundle collage.");
  //       } finally {
  //         setUnbundling(false);
  //         setDeleteModal((prev) => ({ ...prev, deleting: false }));
  //       }
  //     },
  //   });
  // }

  // SHARE MODAL
  async function handleOpenShare(proj: ProjectModel) {
    try {
      const res = await canvasApi.getProjectShareToken(proj.id);
      setShareModalToken(res.shareToken);
      setShareProject(proj);
      setCopiedLink(false);
    } catch (err) {
      alert("Failed to generate share link.");
    }
  }

  return (
    <SidebarLayout
      title="Designer Review Studio"
      subtitle="Client management, project proofing, canvas uploads, watermark studio & secure token sharing"
      roleName="Designer"
      userEmail={designerUser.email}
      userName={designerUser.name}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* SECTION 1: CLIENT PROJECTS - matches project workspace layout */}
      {activeTab === "projects" && (
        <div className="space-y-5">
          {/* Full-width top toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search project or client..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="pl-9 h-10 bg-white shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <Button
                  variant={projectListViewMode === "card" ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => setProjectListViewMode("card")}
                  title="Card Grid View"
                  className={projectListViewMode === "card" ? "shadow-sm" : ""}
                >
                  <LayoutGrid size={14} />
                </Button>
                <Button
                  variant={projectListViewMode === "list" ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => setProjectListViewMode("list")}
                  title="Compact List View"
                  className={projectListViewMode === "list" ? "shadow-sm" : ""}
                >
                  <List size={14} />
                </Button>
              </div>

              <Button
                variant="outline"
                disabled={refreshingProjects}
                onClick={async () => {
                  setRefreshingProjects(true);
                  await loadProjects({ refreshDetails: true });
                  setRefreshingProjects(false);
                }}
                title="Refresh Projects & Proofs"
              >
                <RefreshCw size={14} className={refreshingProjects ? "animate-spin text-indigo-600" : ""} />
                {refreshingProjects ? "Refreshing..." : "Refresh"}
              </Button>

              <Button onClick={handleOpenAddProject}>
                <Plus size={15} /> New Project
              </Button>
            </div>
          </div>

          {/* Two-column workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: project list */}
            <div className="lg:col-span-4 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {projectListViewMode === "list" ? (
                projects.map((p) => {
                  const isSelected = selectedProject?.id === p.id;
                  return (
                    <Card
                      key={p.id}
                      onClick={() => loadProjectDetails(p.id)}
                      className={`p-3 cursor-pointer transition ${
                        isSelected
                          ? "border-indigo-500 ring-2 ring-indigo-500/15 shadow-md bg-indigo-50/30"
                          : "hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-xs truncate">{p.name}</h3>
                            <StatusBadge status={p.status} />
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            Client: <strong className="text-slate-700">{p.clientName}</strong> • Updated{" "}
                            {new Date(p.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditProject(p);
                            }}
                            title="Edit Project"
                          >
                            <Edit size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              promptDeleteProject(p);
                            }}
                            title="Delete Project"
                          >
                            <Trash2 size={13} />
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            className="px-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenShare(p);
                            }}
                            title="Share Link"
                          >
                            <Share2 size={12} /> Share
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                projects.map((p) => {
                  const isSelected = selectedProject?.id === p.id;
                  return (
                    <Card
                      key={p.id}
                      onClick={() => loadProjectDetails(p.id)}
                      className={`p-4 cursor-pointer transition ${
                        isSelected
                          ? "border-indigo-500 ring-2 ring-indigo-500/15 shadow-md bg-indigo-50/30"
                          : "hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-slate-900 text-sm truncate">{p.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Client: <strong className="text-slate-700">{p.clientName}</strong>
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2.5">
                        <span className="text-slate-400 text-[11px]">
                          Updated {new Date(p.updatedAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditProject(p);
                            }}
                            title="Edit Project"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              promptDeleteProject(p);
                            }}
                            title="Delete Project"
                          >
                            <Trash2 size={14} />
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            className="px-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenShare(p);
                            }}
                          >
                            <Share2 size={13} /> Share
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}

              {projects.length === 0 && (
                <Card className="p-8 text-center text-slate-400 space-y-2">
                  <FolderKanban size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">No client projects found.</p>
                </Card>
              )}
            </div>

            {/* Right: selected project workspace */}
            <div className="lg:col-span-8 space-y-4 min-h-[560px]">
              {selectedProject ? (
                <>
                  {/* Project header card */}
                  <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 p-5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                            {selectedProject.name}
                          </h2>
                          <StatusBadge status={selectedProject.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">
                          Client:{" "}
                          <strong className="text-slate-800">{selectedProject.clientName}</strong>
                          {selectedProject.clientEmail ? ` (${selectedProject.clientEmail})` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          onClick={() => handleOpenShare(selectedProject)}
                        >
                          <Share2 size={14} /> Share Token
                        </Button>
                        <Button onClick={() => setShowUploadModal(true)}>
                          <Upload size={14} /> Upload Canvas
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Project canvases card */}
                  <Card className="p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Project Canvases ({selectedProject.canvases?.length || 0})
                    </h3>

                    {(selectedProject.canvases?.length || 0) === 0 ? (
                      <div className="py-16 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-2xl">
                        <FileImage size={36} className="mx-auto text-slate-300" />
                        <p className="text-sm font-semibold text-slate-600">No canvases yet</p>
                        <p className="text-xs">Upload a proof canvas to get started.</p>
                        <Button className="mt-2" onClick={() => setShowUploadModal(true)}>
                          <Upload size={14} /> Upload Canvas
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedProject.canvases?.map((c) => {
                          const thumb = c.latestVersion?.thumbnailUrl
                            ? `${backendHost}${c.latestVersion.thumbnailUrl}`
                            : "/placeholder.png";
                          const fullImageUrl = c.latestVersion?.watermarkedImageUrl
                            ? `${backendHost}${c.latestVersion.watermarkedImageUrl}`
                            : thumb;
                          const isChangesReq = c.status === "changes_requested";
                          const latestRemark =
                            c.remarks && c.remarks.length > 0 ? c.remarks[0] : null;
                          const isCollageLike =
                            c.canvasType === "collage" || c.canvasType === "diagram";

                          return (
                            <Card
                              key={c.id}
                              onClick={() => {
                                setTargetCanvas(c);
                                setEditingCanvasName(c.name);
                                setDesignerReplyDrafts({});
                                setShowEditCanvasModal(true);
                              }}
                              className={`p-3.5 space-y-3 cursor-pointer transition hover:shadow-md ${
                                isChangesReq
                                  ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20"
                                  : "hover:border-slate-300"
                              }`}
                            >
                              {/* Preview */}
                              <div className="aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden relative group border border-slate-100">
                                <img
                                  src={thumb}
                                  alt={c.name}
                                  className={`w-full h-full ${
                                    isCollageLike ? "object-contain bg-white" : "object-cover"
                                  }`}
                                />
                                <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[1px]">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="bg-white/95 hover:bg-white shadow"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFullscreenCanvas({
                                        url: fullImageUrl,
                                        name: c.name,
                                        version: c.latestVersion?.versionNumber || 1,
                                        projectName: selectedProject?.name,
                                        status: c.status,
                                        canvasType: c.canvasType,
                                        date: new Date(c.updatedAt).toLocaleDateString(),
                                      });
                                    }}
                                    title="View Fullscreen Proof Sheet"
                                  >
                                    <Maximize2 size={15} /> Fullscreen
                                  </Button>
                                </div>
                                <span className="absolute top-2 right-2 bg-slate-900/85 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow">
                                  v{c.latestVersion?.versionNumber || 1}
                                </span>
                                {c.watermarkEnabled && (
                                  <Badge
                                    variant="purple"
                                    className="absolute bottom-2 left-2 text-[9px] px-1.5 py-0.5 shadow-sm"
                                  >
                                    Watermarked
                                  </Badge>
                                )}
                              </div>

                              {/* Meta */}
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <h4
                                    className="font-extrabold text-sm text-slate-900 truncate"
                                    title={c.name}
                                  >
                                    {c.name}
                                  </h4>
                                  <StatusBadge status={c.status} />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 font-medium capitalize">
                                  Type: {c.canvasType}
                                </p>

                                {(() => {
                                  const flaggedTiles =
                                    c.diagramImages?.filter(
                                      (img) => img.status === "changes_requested"
                                    ) || [];

                                  if (flaggedTiles.length > 0) {
                                    return (
                                      <div className="mt-2.5 p-2.5 rounded-xl bg-yellow-50 border border-yellow-300 text-yellow-950 text-xs space-y-1.5 shadow-sm">
                                        <div className="flex items-center justify-between">
                                          <span className="font-extrabold flex items-center gap-1 text-[11px] uppercase tracking-wide text-yellow-800">
                                            <AlertCircle size={13} className="text-yellow-600" />
                                            {flaggedTiles.length} Photo Tile(s) Flagged:
                                          </span>
                                          <span className="text-[10px] bg-yellow-200 text-yellow-900 font-bold px-1.5 py-0.5 rounded">
                                            Feedback
                                          </span>
                                        </div>
                                        <div className="space-y-1 max-h-24 overflow-y-auto pr-0.5">
                                          {flaggedTiles.map((tile) => {
                                            const tileIndex = (c.diagramImages || []).findIndex(
                                              (t) => t.id === tile.id
                                            );
                                            const lastRemark =
                                              tile.remarks && tile.remarks.length > 0
                                                ? tile.remarks[tile.remarks.length - 1]
                                                : null;
                                            return (
                                              <div
                                                key={tile.id}
                                                className="text-[11px] bg-white/90 p-1.5 rounded-lg border border-yellow-200 text-slate-800"
                                              >
                                                <strong className="text-yellow-800">
                                                  Photo #{tileIndex + 1} (
                                                  {tile.caption || `Tile ${tileIndex + 1}`}):
                                                </strong>{" "}
                                                {lastRemark
                                                  ? `"${lastRemark.remark}"`
                                                  : "Changes requested"}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  }
                                  if (isChangesReq && latestRemark) {
                                    return (
                                      <div className="mt-2.5 p-2.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 text-xs space-y-1">
                                        <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wide">
                                          <MessageSquare size={12} className="text-amber-700" />{" "}
                                          Client Requested Changes:
                                        </span>
                                        <p className="italic text-[11px] text-amber-950 line-clamp-2">
                                          &quot;{latestRemark.remark}&quot;
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                                <span className="text-indigo-600 font-bold flex items-center gap-1">
                                  <Edit size={13} />{" "}
                                  {isChangesReq
                                    ? "View Changes & Upload Revision"
                                    : "Edit Canvas / Revisions"}
                                </span>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-auto py-1 px-1.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    promptDeleteCanvas(c.id, c.name);
                                  }}
                                >
                                  <Trash2 size={14} /> Delete
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </>
              ) : (
                <Card className="min-h-[560px] flex flex-col items-center justify-center text-slate-400 py-24 text-center">
                  <FolderKanban size={48} className="mb-3 text-slate-300" />
                  <h3 className="font-bold text-slate-700">No Project Selected</h3>
                  <p className="text-xs mt-1">Select a project from the list or create a new one.</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CLIENTS DIRECTORY TAB */}
      {activeTab === "clients" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Clients Directory</h2>
            <Button
              onClick={handleOpenAddClient}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <UserPlus size={15} /> Add New Client
            </Button>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase">
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3 px-4 text-slate-600">{c.email}</td>
                  <td className="py-3 px-4 text-slate-600">{c.phone}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Button onClick={() => handleOpenEditClient(c)} className="text-indigo-600 font-bold hover:underline cursor-pointer">
                      Edit
                    </Button>
                    <Button onClick={() => promptDeleteClient(c)} className="text-rose-600 font-bold hover:underline cursor-pointer">
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DIAGRAMS TAB */}
      {activeTab === "diagrams" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Diagram Blueprints</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage technical blueprint templates and diagram layouts with photos.</p>
            </div>
            <Button
              onClick={() => {
                setDiagramForm({ name: "", description: "" });
                setDiagramImageFile(null);
                setShowDiagramModal(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Add Diagram Blueprint
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diagramTemplates.map((d) => {
              const photoUrl = d.previewUrl ? `${backendHost}${d.previewUrl}` : null;
              return (
                <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    {photoUrl ? (
                      <div
                        onClick={() => setFullscreenCanvas({ url: photoUrl, name: d.name, version: 1 })}
                        className="w-full aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden relative group border cursor-pointer"
                      >
                        <img src={photoUrl} alt={d.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[1px]">
                          <Eye size={16} /> View Fullscreen
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100">
                        <Layers size={36} />
                      </div>
                    )}

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{d.name}</h3>
                      {d.description && <p className="text-xs text-slate-500 mt-1">{d.description}</p>}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Button
                      onClick={() => handleOpenEditDiagramBlueprint(d)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Edit size={13} /> Edit Blueprint
                    </Button>
                    <Button
                      disabled={deletingDiagramId === d.id}
                      onClick={() => promptDeleteDiagramBlueprint(d)}
                      className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
                    >
                      {deletingDiagramId === d.id ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-rose-600" /> Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={13} /> Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: CLIENT MODAL WITH SCROLLING & INLINE BUTTON LOADER */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 flex-shrink-0">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingClient ? "Edit Client Profile" : "Add New Client"}
              </h3>
              <Button onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </Button>
            </div>
            <form onSubmit={handleSaveClient} className="overflow-y-auto flex-1 py-3 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Client Name</label>
                <Input
                  required
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <Input
                  required
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Phone Number</label>
                <Input
                  required
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Company Name (Optional)</label>
                <Input
                  value={clientForm.companyName}
                  onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="Acme Corp"
                />
              </div>
              <Button
                disabled={savingClient}
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
              >
                {savingClient ? <Loader2 size={16} className="animate-spin" /> : null}
                {savingClient ? "Saving Client..." : editingClient ? "Update Client" : "Create Client"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PROJECT MODAL WITH SCROLLING & INLINE BUTTON LOADER */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 flex-shrink-0">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingProject ? "Edit Project" : "Create Client Project"}
              </h3>
              <Button onClick={() => setShowProjectModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </Button>
            </div>
            <form onSubmit={handleSaveProject} className="overflow-y-auto flex-1 py-3 space-y-3">
              {!editingProject && (
                <div>
                  <label className="text-xs font-bold text-slate-700">Select Client</label>
                  <Select
                    required
                    value={projectForm.clientId}
                    onChange={(e) => setProjectForm({ ...projectForm, clientId: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-xs bg-white cursor-pointer"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-700">Project Name</label>
                <Input
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-xs"
                  placeholder="E.g. Summer Proof Catalog 2026"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Description (Optional)</label>
                <Textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-xs"
                  rows={3}
                />
              </div>
              <Button
                disabled={savingProject}
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
              >
                {savingProject ? <Loader2 size={16} className="animate-spin" /> : null}
                {savingProject ? "Saving Project..." : editingProject ? "Update Project" : "Create Project"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: UPLOAD CANVAS WIZARD MODAL WITH PROPER INNER SCROLLING & INLINE BUTTON LOADER */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 flex-shrink-0">
              <h3 className="font-extrabold text-lg text-slate-900">Upload Design Canvases</h3>
              <Button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </Button>
            </div>
            <form onSubmit={handleUploadCanvas} className="overflow-y-auto flex-1 py-3 space-y-4 pr-1">
              <div>
                <label className="text-xs font-bold text-slate-700">Canvas Name / Title</label>
                <Input
                  required
                  value={canvasForm.name}
                  onChange={(e) => setCanvasForm({ ...canvasForm, name: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-xs"
                  placeholder="E.g. Front Elevation Concept A"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Canvas Type</label>
                  <Select
                    value={canvasForm.canvasType}
                    onChange={(e) => setCanvasForm({ ...canvasForm, canvasType: e.target.value as any })}
                    className="w-full border rounded-xl p-2.5 text-xs bg-white cursor-pointer font-medium"
                  >
                    <option value="individual">Individual Canvases</option>
                    <option value="collage">Auto Collage Grid</option>
                    <option value="diagram">Diagram Blueprint</option>
                  </Select>
                </div>

                {canvasForm.canvasType === "diagram" && (
                  <div>
                    <label className="text-xs font-bold text-slate-700">Blueprint Layout</label>
                    <Select
                      value={canvasForm.diagramTemplateId}
                      onChange={(e) => setCanvasForm({ ...canvasForm, diagramTemplateId: e.target.value })}
                      className="w-full border rounded-xl p-2.5 text-xs bg-white cursor-pointer"
                    >
                      <option value="">Select Blueprint</option>
                      {diagramTemplates.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>

              {/* Mode Guidance Card */}
              {/* {canvasForm.canvasType === "collage" ? (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1">
                  <span className="font-extrabold text-indigo-900 flex items-center gap-1">
                    <LayoutGrid size={14} className="text-indigo-600" /> Auto Collage Grid Mode
                  </span>
                  <p className="text-[11px] text-indigo-800 leading-normal">
                    Combines all selected photos into 1 Collage presentation. The client can review and approve or request changes on <strong>each photo tile individually</strong>. You can edit, replace, add, or split photo tiles anytime!
                  </p>
                </div>
              ) : canvasForm.canvasType === "individual" ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1">
                    <FileImage size={14} className="text-slate-600" /> Individual Canvases Mode
                  </span>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Creates a separate standalone canvas for every uploaded image.
                  </p>
                </div>
              ) : null} */}

              <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                <div className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-700">Enable Watermark Overlay</span>
                  <Input
                    type="checkbox"
                    checked={canvasForm.watermarkEnabled}
                    onChange={(e) => setCanvasForm({ ...canvasForm, watermarkEnabled: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
                {canvasForm.watermarkEnabled && (
                  <Input
                    value={canvasForm.watermarkText}
                    onChange={(e) => setCanvasForm({ ...canvasForm, watermarkText: e.target.value })}
                    placeholder="Custom Watermark Text"
                    className="w-full border rounded-lg p-2 text-xs bg-white"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Select Image File(s)</label>
                <Input
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    if (newFiles.length > 0 && !canvasForm.name.trim()) {
                      const cleanName = newFiles[0].name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
                      setCanvasForm((prev) => ({ ...prev, name: cleanName }));
                    }
                    setSelectedFiles((prev) => [...prev, ...newFiles]);
                  }}
                  className="mt-1 cursor-pointer"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Selected Files ({selectedFiles.length})</span>
                    <Button
                      type="button"
                      onClick={() => setSelectedFiles([])}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                    {selectedFiles.map((file, idx) => {
                      const fileUrl = URL.createObjectURL(file);
                      return (
                        <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                          <div className="relative aspect-square w-full bg-slate-100 rounded-lg overflow-hidden group border border-slate-100">
                            <img src={fileUrl} alt={file.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 backdrop-blur-[1px]">
                              <Button
                                type="button"
                                onClick={() => setFullscreenCanvas({ url: fileUrl, name: file.name, version: 1 })}
                                className="p-1.5 bg-white/90 text-slate-800 rounded-lg hover:bg-white hover:text-indigo-600 transition shadow cursor-pointer"
                                title="View Fullscreen Preview"
                              >
                                <Eye size={14} />
                              </Button>
                              <Button
                                type="button"
                                onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                                className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition shadow cursor-pointer"
                                title="Remove File"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 px-0.5">
                            <p className="text-[11px] font-bold text-slate-800 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {(file.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                disabled={uploadingCanvas || selectedFiles.length === 0}
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {uploadingCanvas ? <Loader2 size={16} className="animate-spin" /> : null}
                {uploadingCanvas ? "Processing & Watermarking..." : "Upload Canvases"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT CANVAS - matches designer photo-tile edit UI */}
      {showEditCanvasModal && targetCanvas && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-[1.5rem] max-w-3xl w-full shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/80">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
              <div className="min-w-0">
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight truncate">
                  Edit Canvas: {targetCanvas.name}
                </h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>
                    Type:{" "}
                    <span className="capitalize font-semibold text-slate-700">
                      {targetCanvas.canvasType}
                    </span>
                  </span>
                  <span className="inline-flex items-center rounded-full bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 text-[10px] font-bold font-mono">
                    V{targetCanvas.latestVersion?.versionNumber || 1}
                  </span>
                  <StatusBadge status={targetCanvas.status} />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setShowEditCanvasModal(false);
                  setDesignerReplyDrafts({});
                }}
                className="text-slate-400 hover:text-slate-700 rounded-full flex-shrink-0"
              >
                <X size={18} />
              </Button>
            </div>

            <div
              onWheel={(e) => e.stopPropagation()}
              className="overflow-y-auto flex-1 min-h-0 px-5 sm:px-6 py-5 space-y-5 scroll-smooth overscroll-contain"
            >
              {/* Optional rename - compact */}
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={editingCanvasName}
                  onChange={(e) => setEditingCanvasName(e.target.value)}
                  placeholder="Canvas title..."
                  className="flex-1 h-9 bg-slate-50"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={savingCanvasInfo || !editingCanvasName.trim()}
                  onClick={handleSaveCanvasInfo}
                  className="h-9 rounded-full bg-violet-600 hover:bg-violet-700"
                >
                  {savingCanvasInfo ? <Loader2 size={14} className="animate-spin" /> : "Save Title"}
                </Button>
              </div>

              {/* PHOTO TILES */}
              {targetCanvas.diagramImages && targetCanvas.diagramImages.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-violet-600 flex items-center gap-1.5">
                      <LayoutGrid size={14} /> Photo Tiles ({targetCanvas.diagramImages.length})
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Replace photos requested for change individually below
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {targetCanvas.diagramImages.map((img, idx) => {
                      const tileUrl = `${backendHost}${img.watermarkedImageUrl}`;
                      const isUpdating = updatingSubImageId === img.id;
                      const statusLabel =
                        img.status === "approved"
                          ? "APPROVED"
                          : img.status === "changes_requested"
                            ? "CHANGES REQUESTED"
                            : "PENDING REVIEW";
                      const statusCls =
                        img.status === "approved"
                          ? "bg-emerald-500 text-white"
                          : img.status === "changes_requested"
                            ? "bg-amber-500 text-white"
                            : "bg-violet-600 text-white";

                      return (
                        <div
                          key={img.id}
                          className={`rounded-2xl bg-white border p-3 flex flex-col shadow-sm transition hover:shadow-md ${
                            img.status === "changes_requested"
                              ? "border-amber-300 ring-2 ring-amber-400/15"
                              : img.status === "approved"
                                ? "border-emerald-200"
                                : "border-slate-200"
                          }`}
                        >
                          {/* Image */}
                          <div className="relative aspect-[4/3] w-full bg-slate-100 rounded-xl overflow-hidden group border border-slate-100">
                            <img
                              src={tileUrl}
                              alt={img.caption || "Tile"}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 z-10">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide shadow ${statusCls}`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                            <div className="absolute inset-0 bg-slate-900/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 backdrop-blur-[1px]">
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="secondary"
                                className="bg-white/95 hover:bg-white shadow"
                                onClick={() =>
                                  setFullscreenCanvas({
                                    url: tileUrl,
                                    name: img.caption || `Photo #${idx + 1}`,
                                    version: targetCanvas.latestVersion?.versionNumber || 1,
                                  })
                                }
                                title="View Fullscreen Photo"
                              >
                                <Eye size={14} />
                              </Button>
                              <Button
                                type="button"
                                size="icon-sm"
                                disabled={isUpdating}
                                className="bg-rose-600 hover:bg-rose-700 text-white shadow"
                                onClick={() => promptDeleteSubImageTile(img.id)}
                                title="Remove Photo Tile"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>

                          {/* Meta + actions */}
                          <div className="mt-3 flex-1 flex flex-col gap-2">
                            <span
                              className="font-extrabold text-slate-900 text-[13px] block truncate"
                              title={img.caption || `Photo #${idx + 1}`}
                            >
                              Photo #{idx + 1}: {img.caption || `Image ${idx + 1}`}
                            </span>

                            {img.remarks && img.remarks.length > 0 && (
                              renderRemarkThread(img.remarks, {
                                highlightChanges: img.status === "changes_requested",
                              })
                            )}

                            {renderOptionalDesignerReply(img.id, true)}

                            <label
                              className={`mt-auto w-full h-9 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm ${
                                isUpdating ? "opacity-50 pointer-events-none" : ""
                              }`}
                              title="Replace this photo file"
                            >
                              {isUpdating ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <RefreshCw size={13} />
                              )}
                              {isUpdating ? "Updating..." : "Replace Photo"}
                              <Input
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleReplaceSubImageFile(
                                      img.id,
                                      file,
                                      img.caption || undefined,
                                    );
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add new photo */}
                  <div className="pt-1 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-violet-700 flex items-center gap-1.5">
                        <Plus size={14} /> Add New Photo to Collage
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Select file to append tile
                      </span>
                    </div>

                    {!newSubImageFile ? (
                      <label className="w-full min-h-[88px] px-4 bg-violet-50/40 border-2 border-dashed border-violet-200 hover:border-violet-400 rounded-2xl text-xs text-violet-700 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition">
                        <Upload size={18} className="text-violet-500" />
                        <span className="font-bold">+ Choose Photo File to Add...</span>
                        <Input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={(e) => setNewSubImageFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    ) : (
                      <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Eye size={14} className="text-violet-600" /> New Photo Preview
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setNewSubImageFile(null);
                              setNewSubImageCaption("");
                            }}
                            title="Cancel preview"
                          >
                            <X size={15} />
                          </Button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 relative group">
                            <img
                              src={URL.createObjectURL(newSubImageFile)}
                              alt="New upload preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {newSubImageFile.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {(newSubImageFile.size / 1024).toFixed(0)} KB
                            </p>
                            <Input
                              type="text"
                              value={newSubImageCaption}
                              onChange={(e) => setNewSubImageCaption(e.target.value)}
                              placeholder="Photo tile caption (optional)..."
                              className="h-8 bg-slate-50"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            disabled={addingSubImage}
                            onClick={() => {
                              if (newSubImageFile) {
                                handleAddSubImageTile(newSubImageFile, newSubImageCaption);
                                setNewSubImageFile(null);
                                setNewSubImageCaption("");
                              }
                            }}
                            className="flex-1 h-9 rounded-full bg-violet-600 hover:bg-violet-700"
                          >
                            {addingSubImage ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Plus size={14} />
                            )}
                            Upload Tile & Rebuild Collage
                          </Button>
                          <label className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold cursor-pointer transition inline-flex items-center">
                            Change File
                            <Input
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              className="hidden"
                              onChange={(e) => setNewSubImageFile(e.target.files?.[0] || null)}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* SINGLE CANVAS IMAGE */
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-violet-600 flex items-center gap-1.5">
                      <FileImage size={14} /> Canvas Image
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Upload an updated image for this canvas
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        {targetCanvas.latestVersion?.watermarkedImageUrl && (
                          <div
                            onClick={() =>
                              setFullscreenCanvas({
                                url: `${backendHost}${targetCanvas.latestVersion?.watermarkedImageUrl}`,
                                name: targetCanvas.name,
                                version: targetCanvas.latestVersion?.versionNumber || 1,
                              })
                            }
                            className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden relative flex-shrink-0 cursor-pointer group border border-slate-100"
                          >
                            <img
                              src={`${backendHost}${targetCanvas.latestVersion.watermarkedImageUrl}`}
                              alt={targetCanvas.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <Eye size={14} />
                            </div>
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-extrabold text-slate-900 text-sm block truncate">
                            {targetCanvas.name}
                          </span>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Version v{targetCanvas.latestVersion?.versionNumber || 1}
                          </p>
                        </div>
                      </div>

                      <label
                        className={`h-9 px-4 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm ${
                          uploadingRevision ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        {uploadingRevision ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <RefreshCw size={13} />
                        )}
                        Replace Photo
                        <Input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleReplaceMainImage(file);
                          }}
                        />
                      </label>
                    </div>

                    {(() => {
                      const canvasLevelRemarks = (targetCanvas.remarks || []).filter(
                        (r) => !r.imageId,
                      );
                      return canvasLevelRemarks.length > 0
                        ? renderRemarkThread(canvasLevelRemarks, {
                            highlightChanges: targetCanvas.status === "changes_requested",
                          })
                        : null;
                    })()}
                    {renderOptionalDesignerReply(null)}
                  </div>
                </div>
              )}

              {/* Overall notes for multi-tile canvases */}
              {targetCanvas.diagramImages && targetCanvas.diagramImages.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600 flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-violet-600" /> Overall Proof Notes
                  </span>
                  {(() => {
                    const canvasLevelRemarks = (targetCanvas.remarks || []).filter(
                      (r) => !r.imageId,
                    );
                    return canvasLevelRemarks.length > 0 ? (
                      renderRemarkThread(canvasLevelRemarks, {
                        highlightChanges: targetCanvas.status === "changes_requested",
                      })
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        No overall remarks yet. You can leave an optional note for the client.
                      </p>
                    );
                  })()}
                  {renderOptionalDesignerReply(null)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD / EDIT DIAGRAM BLUEPRINT MODAL */}
      {showDiagramModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 my-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingDiagram ? "Edit Diagram Blueprint" : "Add Diagram Blueprint"}
              </h3>
              <Button onClick={() => setShowDiagramModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </Button>
            </div>
            <form onSubmit={handleSaveDiagramBlueprint} className="py-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Blueprint Title</label>
                <Input
                  required
                  value={diagramForm.name}
                  onChange={(e) => setDiagramForm({ ...diagramForm, name: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="e.g. Architectural Elevation Blueprint"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Description (Optional)</label>
                <Textarea
                  rows={2}
                  value={diagramForm.description}
                  onChange={(e) => setDiagramForm({ ...diagramForm, description: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="Describe the diagram structure or specifications..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Diagram Photo</label>
                <Input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setDiagramImageFile(e.target.files?.[0] || null)}
                  className="mt-1 cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                disabled={savingDiagram || !diagramForm.name.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {savingDiagram ? <Loader2 size={16} className="animate-spin" /> : null}
                {savingDiagram ? "Saving Blueprint..." : editingDiagram ? "Update Diagram Blueprint" : "Create Diagram Blueprint"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION POPUP MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 my-auto border border-rose-100 space-y-4">
            <div className="flex items-center gap-3.5 border-b pb-4 border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-200">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{deleteModal.title}</h3>
                <p className="text-xs text-rose-600 font-semibold mt-0.5">Confirmation Required</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-medium">
                {deleteModal.description}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                disabled={deleteModal.deleting}
                onClick={() => setDeleteModal({ isOpen: false, title: "", description: "", id: null, deleting: false, onConfirm: async () => {} })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={deleteModal.deleting}
                onClick={() => deleteModal.onConfirm()}
                style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
                className="px-4.5 py-2 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-md shadow-red-600/30 border-0"
              >
                {deleteModal.deleting ? <Loader2 size={14} className="animate-spin text-white" /> : <Trash2 size={14} className="text-white" />}
                {deleteModal.deleting ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX PROOF SHEET MODAL */}
      {fullscreenCanvas && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setFullscreenCanvas(null);
          }}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-6 overflow-y-auto"
        >
          {/* Architectural Proof Sheet Container */}
          <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
            {/* Modal Top Bar Header */}
            <div className="bg-slate-900 text-white px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 border-b-2 border-slate-900 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider flex-shrink-0">
                  PROOF SHEET V{fullscreenCanvas.version}
                </span>
                <h3 className="font-bold text-xs sm:text-sm truncate text-slate-200 min-w-0">
                  {fullscreenCanvas.name}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFullscreenCanvas(null)}
                className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg h-8 px-2.5 text-xs flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <X size={16} /> <span className="hidden sm:inline">Close</span>
              </Button>
            </div>

            {/* High-Res Image Canvas Box */}
            <div className="relative bg-slate-100 p-2 sm:p-5 flex items-center justify-center min-h-[260px] sm:min-h-[420px] max-h-[58vh] sm:max-h-[72vh] overflow-hidden">
              <img
                src={fullscreenCanvas.url}
                alt={fullscreenCanvas.name}
                className="max-w-full max-h-[56vh] sm:max-h-[70vh] w-auto h-auto object-contain rounded shadow-md mx-auto"
              />
            </div>

            {/* Responsive Blueprint Title Block Footer */}
            <div className="border-t-2 sm:border-t-4 border-slate-900 bg-white w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full text-xs divide-y sm:divide-y-0 lg:divide-x-2 divide-slate-800 font-sans">
                {/* Block 1: Brand Info */}
                <div className="p-2.5 sm:p-3.5 bg-slate-50 flex flex-col justify-between border-b sm:border-b-0 border-r-0 sm:border-r border-slate-800 lg:border-r-0">
                  <div>
                    <div className="flex items-center gap-1.5 font-black text-slate-900 tracking-tight text-xs sm:text-sm">
                      <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
                        FBS
                      </span>
                      <span className="truncate">SIGNS &amp; PRINTING</span>
                    </div>
                    <p className="text-[9.5px] sm:text-[10px] font-bold text-slate-600 mt-1 leading-tight uppercase">
                      750 WARRENVILLE RD<br />LISLE, IL 60532
                    </p>
                  </div>
                  <p className="text-[9.5px] font-mono text-indigo-700 font-bold mt-1.5">
                    WWW.FBSSIGNS.COM
                  </p>
                </div>

                {/* Block 2: Project & Canvas Titles */}
                <div className="p-2.5 sm:p-3.5 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">
                      PROJECT NAME:
                    </span>
                    <span
                      className="font-black text-slate-900 text-xs sm:text-sm block truncate"
                      title={fullscreenCanvas.projectName}
                    >
                      {fullscreenCanvas.projectName || "PROJECT PROOF"}
                    </span>
                  </div>
                  <div className="mt-1.5 sm:mt-2">
                    <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">
                      CANVAS TITLE:
                    </span>
                    <span
                      className="font-bold text-indigo-900 text-xs block truncate"
                      title={fullscreenCanvas.name}
                    >
                      {fullscreenCanvas.name}
                    </span>
                  </div>
                </div>

                {/* Block 3: Status & Canvas Type */}
                <div className="p-2.5 sm:p-3.5 flex flex-col justify-between border-b sm:border-b-0 border-r-0 sm:border-r border-slate-800 lg:border-r-0">
                  <div>
                    <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">
                      CLIENT APPROVAL STATUS:
                    </span>
                    <div className="mt-1">
                      <StatusBadge
                        status={fullscreenCanvas.status || "pending"}
                        pendingLabel="pending"
                      />
                    </div>
                  </div>
                  <div className="mt-1.5 sm:mt-2 border-t border-slate-200 pt-1">
                    <span className="font-bold text-slate-500 text-[9.5px] sm:text-[10px] block uppercase">
                      TYPE: {fullscreenCanvas.canvasType || "INDIVIDUAL"}
                    </span>
                  </div>
                </div>

                {/* Block 4: Legal & Metadata */}
                <div className="p-2.5 sm:p-3.5 bg-slate-50 flex flex-col justify-between text-[9px] sm:text-[9.5px] leading-tight text-slate-600">
                  <p className="italic text-[9px] sm:text-[9.5px] leading-tight text-slate-500">
                    This design is original work of FBS SIGNS and may not be reproduced without express written permission.
                  </p>
                  <div className="pt-2 border-t border-slate-300 font-mono text-[9px] sm:text-[9.5px] font-bold text-slate-800 flex justify-between gap-1 flex-wrap">
                    <span>SCALE: N.T.S.</span>
                    <span>
                      DATE: {fullscreenCanvas.date || new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHARE PROJECT / REVIEW LINK MODAL */}
      {shareModalToken && shareProject && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShareModalToken(null);
              setShareProject(null);
              setCopiedLink(false);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onWheel={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 space-y-5 border border-slate-100"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <Share2 size={20} className="text-indigo-600" /> Share Review Link
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Project: <strong className="text-slate-800">{shareProject.name}</strong> • Client: <strong className="text-slate-800">{shareProject.clientName}</strong>
                </p>
              </div>
              <Button
                onClick={() => {
                  setShareModalToken(null);
                  setShareProject(null);
                  setCopiedLink(false);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Direct Copy Link Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Direct Review URL</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
                <Input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? `${window.location.origin}/review/${shareModalToken}` : `/review/${shareModalToken}`}
                  className="flex-1 bg-transparent text-xs text-slate-700 font-mono outline-none px-1 truncate"
                />
                <Button
                  onClick={() => {
                    const fullUrl = `${window.location.origin}/review/${shareModalToken}`;
                    navigator.clipboard.writeText(fullUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 3000);
                  }}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                    copiedLink
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  }`}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  {copiedLink ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>

            {/* Quick Share Action Grid */}
            <div className="space-y-2.5 pt-1">
              <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider block">
                Quick Share Options
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                {/* WhatsApp Share Button */}
                <Button
                  onClick={() => {
                    const fullUrl = `${window.location.origin}/review/${shareModalToken}`;
                    const text = `Hi ${shareProject.clientName}, please review your design proof sheet for "${shareProject.name}":\n${fullUrl}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-emerald-900 flex items-center gap-2 text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <MessageCircle size={18} className="text-emerald-600 flex-shrink-0" />
                  <span>WhatsApp Share</span>
                </Button>

                {/* iPhone iMessage / SMS Share Button */}
                <Button
                  onClick={() => {
                    const fullUrl = `${window.location.origin}/review/${shareModalToken}`;
                    const text = `Hi ${shareProject.clientName}, here is your design proof sheet link for review: ${fullUrl}`;
                    window.location.href = `sms:?&body=${encodeURIComponent(text)}`;
                  }}
                  className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl text-blue-900 flex items-center gap-2 text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <Smartphone size={18} className="text-blue-600 flex-shrink-0" />
                  <span>iMessage / SMS</span>
                </Button>

                {/* Native Device Share (iPhone / Mobile) */}
                <Button
                  onClick={() => {
                    const fullUrl = `${window.location.origin}/review/${shareModalToken}`;
                    if (typeof navigator !== "undefined" && navigator.share) {
                      navigator.share({
                        title: `Design Review: ${shareProject.name}`,
                        text: `Hi ${shareProject.clientName}, please review your design proof sheet:`,
                        url: fullUrl,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(fullUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 3000);
                    }
                  }}
                  className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-2xl text-indigo-900 flex items-center gap-2 text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <Share2 size={18} className="text-indigo-600 flex-shrink-0" />
                  <span>Device Share</span>
                </Button>

                {/* Email Share Button */}
                <a
                  href={`mailto:${shareProject.clientEmail || ""}?subject=${encodeURIComponent(`Design Proof Review: ${shareProject.name}`)}&body=${encodeURIComponent(`Hi ${shareProject.clientName},\n\nPlease review your design canvas proof sheet here:\n${typeof window !== "undefined" ? `${window.location.origin}/review/${shareModalToken}` : `/review/${shareModalToken}`}\n\nThank you!`)}`}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-800 flex items-center gap-2 text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <Mail size={18} className="text-slate-600 flex-shrink-0" />
                  <span>Email Link</span>
                </a>
              </div>
            </div>

            {/* Direct Open Link Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <a
                href={`/review/${shareModalToken}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Eye size={14} /> Open Review Portal
              </a>
              <Button
                onClick={() => {
                  setShareModalToken(null);
                  setShareProject(null);
                  setCopiedLink(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
