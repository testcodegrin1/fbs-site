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
import { UserManagement } from "@/app/super-admin/dashboard/UserManagement";
import { RolePermissionManagement } from "@/app/super-admin/dashboard/RolePermissionManagement";
import {
  canvasApi,
  type ProjectModel,
  type CanvasModel,
  type DiagramTemplateModel,
} from "@/app/lib/client/canvas-api";
import {
  FolderKanban,
  ShieldCheck,
  SlidersHorizontal,
  Layers,
  Plus,
  Trash2,
  Share2,
  Search,
  X,
  AlertCircle,
  Upload,
  Eye,
  RefreshCw,
  Loader2,
  Maximize2,
  MessageSquare,
  Edit,
  List,
  LayoutGrid,
  FileImage,
} from "lucide-react";

export default function SuperAdminDashboardPage() {
  return (
    <AuthGuard requiredRole="super_admin">
      {(user) => <SuperAdminContent superAdminUser={user} />}
    </AuthGuard>
  );
}

function SuperAdminContent({ superAdminUser }: { superAdminUser: any }) {
  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [diagrams, setDiagrams] = useState<DiagramTemplateModel[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<ProjectModel | null>(null);
  const [projectListViewMode, setProjectListViewMode] = useState<"card" | "list">("card");
  const [refreshingProjects, setRefreshingProjects] = useState(false);

  // Diagram Template Modal State
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

  // Edit Canvas / Revision Modal State
  const [showEditCanvasModal, setShowEditCanvasModal] = useState(false);
  const [targetCanvas, setTargetCanvas] = useState<CanvasModel | null>(null);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [uploadingRevision, setUploadingRevision] = useState(false);

  // Fullscreen Preview State
  const [fullscreenCanvas, setFullscreenCanvas] = useState<{
    url: string;
    name: string;
    version: number;
    projectName?: string;
    status?: string;
    canvasType?: string;
    date?: string;
  } | null>(null);

  const backendHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // ESC Key listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowDiagramModal(false);
        setShowUploadModal(false);
        setShowEditCanvasModal(false);
        setDeleteModal({ isOpen: false, title: "", description: "", id: null, deleting: false, onConfirm: async () => {} });
        setFullscreenCanvas(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navItems: SidebarNavItem[] = [
    { id: "projects", label: "Client Projects", icon: FolderKanban, badge: projects.length },
    { id: "users", label: "User Accounts", icon: ShieldCheck },
    { id: "roles", label: "Role Permissions", icon: SlidersHorizontal },
    { id: "diagrams", label: "Diagram Templates", icon: Layers, badge: diagrams.length },
  ];

  async function loadData(opts?: { refreshDetails?: boolean }) {
    try {
      // Parallel list loads (remote MySQL - avoid serial wait)
      const [pData, dData] = await Promise.all([
        canvasApi.listProjects(search),
        canvasApi.listDiagramTemplates(),
      ]);
      setProjects(pData);
      setDiagrams(dData);
      if (selectedProject) {
        const updated = pData.find((p) => p.id === selectedProject.id);
        if (updated) {
          setSelectedProject((prev) =>
            prev && prev.id === updated.id
              ? {
                  ...prev,
                  name: updated.name,
                  status: updated.status,
                  clientName: updated.clientName,
                  clientEmail: updated.clientEmail,
                  designerName: updated.designerName,
                  shareToken: updated.shareToken,
                  updatedAt: updated.updatedAt,
                }
              : prev,
          );
          if (opts?.refreshDetails) {
            await loadProjectDetails(updated.id);
          }
        } else if (pData.length > 0) {
          await loadProjectDetails(pData[0].id);
        } else {
          setSelectedProject(null);
        }
      } else if (pData.length > 0) {
        await loadProjectDetails(pData[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadProjectDetails(projectId: number) {
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
        } else {
          setTargetCanvas(null);
          setShowEditCanvasModal(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadData();
  }, [search, activeTab]);

  // Diagram Template CRUD
  async function handleSaveDiagram(e: React.FormEvent) {
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
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save diagram template.");
    } finally {
      setSavingDiagram(false);
    }
  }

  function handleOpenEditDiagram(d: DiagramTemplateModel) {
    setEditingDiagram(d);
    setDiagramForm({ name: d.name, description: d.description || "" });
    setDiagramImageFile(null);
    setShowDiagramModal(true);
  }

  function promptDeleteDiagram(d: DiagramTemplateModel) {
    setDeleteModal({
      isOpen: true,
      title: "Delete Diagram Template",
      description: `Are you sure you want to delete "${d.name}"? The diagram preview and structure will be permanently removed.`,
      id: d.id,
      deleting: false,
      onConfirm: async () => {
        setDeletingDiagramId(d.id);
        setDeleteModal((prev) => ({ ...prev, deleting: true }));
        try {
          await canvasApi.deleteDiagramTemplate(d.id);
          setDiagrams((prev) => prev.filter((item) => item.id !== d.id));
          setDeleteModal({ isOpen: false, title: "", description: "", id: null, deleting: false, onConfirm: async () => {} });
        } catch (err) {
          alert(err instanceof Error ? err.message : "Failed to delete diagram template.");
        } finally {
          setDeletingDiagramId(null);
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
      description: `Are you sure you want to delete canvas "${canvasName}"? All image files will be purged from storage.`,
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
          await loadProjectDetails(projectId);
        } catch (err) {
          alert(err instanceof Error ? err.message : "Error deleting canvas");
          await loadProjectDetails(projectId);
        }
      },
    });
  }

  // Upload Canvas
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

  // Upload Revision
  async function handleUploadRevision(e: React.FormEvent) {
    e.preventDefault();
    if (!targetCanvas || !revisionFile || !selectedProject) return;

    setUploadingRevision(true);
    try {
      const formData = new FormData();
      formData.append("file", revisionFile);
      formData.append("watermarkEnabled", String(targetCanvas.watermarkEnabled));
      formData.append("watermarkText", targetCanvas.watermarkText || "");

      await canvasApi.uploadRevision(targetCanvas.id, formData);
      setShowEditCanvasModal(false);
      setTargetCanvas(null);
      setRevisionFile(null);
      loadProjectDetails(selectedProject.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Revision upload failed");
    } finally {
      setUploadingRevision(false);
    }
  }

  return (
    <SidebarLayout
      title="Super Admin Command Center"
      subtitle="Full control of User Accounts, Role Permissions, Projects Directory & Diagram Blueprints"
      roleName="Super Admin"
      userEmail={superAdminUser.email}
      userName={superAdminUser.name}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* TAB 1: CLIENT PROJECTS - same workspace UI as designer */}
      {activeTab === "projects" && (
        <div className="space-y-5">
          {/* Full-width top toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                type="text"
                placeholder="Search project or client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-white shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
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
                  await loadData({ refreshDetails: true });
                  setRefreshingProjects(false);
                }}
                title="Refresh Projects & Proofs"
              >
                <RefreshCw
                  size={14}
                  className={refreshingProjects ? "animate-spin text-indigo-600" : ""}
                />
                {refreshingProjects ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Two-column workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: project list */}
            <div className="lg:col-span-4 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {projects.length === 0 ? (
                <Card className="p-8 text-center text-slate-400 space-y-2">
                  <FolderKanban size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">No client projects found.</p>
                </Card>
              ) : projectListViewMode === "list" ? (
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
                            Client: <strong className="text-slate-700">{p.clientName}</strong>
                            {" · "}
                            {p.designerName || "Designer"}
                            {" · "}
                            Updated {new Date(p.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {p.shareToken && (
                          <Button
                            variant="link"
                            size="sm"
                            className="px-1 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/review/${p.shareToken}`, "_blank");
                            }}
                          >
                            <Share2 size={12} /> Share
                          </Button>
                        )}
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
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Designer: {p.designerName || "Designer"}
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2.5">
                        <span className="text-slate-400 text-[11px]">
                          Updated {new Date(p.updatedAt).toLocaleDateString()}
                        </span>
                        {p.shareToken && (
                          <Button
                            variant="link"
                            size="sm"
                            className="px-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/review/${p.shareToken}`, "_blank");
                            }}
                          >
                            <Share2 size={13} /> Share
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Right: selected project workspace */}
            <div className="lg:col-span-8 space-y-4 min-h-[560px]">
              {selectedProject ? (
                <>
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
                          {selectedProject.clientEmail
                            ? ` (${selectedProject.clientEmail})`
                            : ""}
                          {" · "}
                          Designer:{" "}
                          <strong className="text-slate-800">
                            {selectedProject.designerName || "Designer"}
                          </strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {selectedProject.shareToken && (
                          <Button
                            variant="outline"
                            onClick={() =>
                              window.open(`/review/${selectedProject.shareToken}`, "_blank")
                            }
                          >
                            <Share2 size={14} /> Share Token
                          </Button>
                        )}
                        <Button onClick={() => setShowUploadModal(true)}>
                          <Upload size={14} /> Upload Canvas
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

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
                          const isCollageLike =
                            c.canvasType === "collage" || c.canvasType === "diagram";
                          const isChangesReq = c.status === "changes_requested";
                          const latestRemark =
                            c.remarks && c.remarks.length > 0 ? c.remarks[0] : null;

                          return (
                            <Card
                              key={c.id}
                              onClick={() => {
                                setTargetCanvas(c);
                                setShowEditCanvasModal(true);
                              }}
                              className={`p-3.5 space-y-3 cursor-pointer transition hover:shadow-md ${
                                isChangesReq
                                  ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20"
                                  : "hover:border-slate-300"
                              }`}
                            >
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

                                {isChangesReq && latestRemark && (
                                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 text-xs space-y-1">
                                    <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wide">
                                      <MessageSquare size={12} className="text-amber-700" /> Client
                                      Requested Changes:
                                    </span>
                                    <p className="italic text-[11px] text-amber-950 line-clamp-2">
                                      &quot;{latestRemark.remark}&quot;
                                    </p>
                                  </div>
                                )}
                              </div>

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
                  <p className="text-xs mt-1">Select a project from the directory to manage canvases.</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER ACCOUNTS */}
      {activeTab === "users" && (
        <UserManagement
          currentUserId={superAdminUser.id}
          currentUserRoles={superAdminUser.roles}
        />
      )}

      {/* TAB 3: ROLE PERMISSIONS */}
      {activeTab === "roles" && <RolePermissionManagement />}

      {/* TAB 4: DIAGRAM BLUEPRINTS */}
      {activeTab === "diagrams" && (
        <div className="space-y-5">
          <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Diagram Layout Blueprints</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage system-wide technical blueprint templates and diagram layouts with photos.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingDiagram(null);
                setDiagramForm({ name: "", description: "" });
                setDiagramImageFile(null);
                setShowDiagramModal(true);
              }}
            >
              <Plus size={16} /> Add Diagram Blueprint
            </Button>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {diagrams.map((d) => {
              const photoUrl = d.previewUrl ? `${backendHost}${d.previewUrl}` : null;
              return (
                <Card key={d.id} className="p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    {photoUrl ? (
                      <div
                        onClick={() =>
                          setFullscreenCanvas({ url: photoUrl, name: d.name, version: 1 })
                        }
                        className="w-full aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden relative group border cursor-pointer"
                      >
                        <img src={photoUrl} alt={d.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[1px]">
                          <Eye size={16} /> View Fullscreen
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center border border-violet-100">
                        <Layers size={36} />
                      </div>
                    )}

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{d.name}</h3>
                      {d.description && (
                        <p className="text-xs text-slate-500 mt-1">{d.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Button variant="link" size="sm" className="px-0" onClick={() => handleOpenEditDiagram(d)}>
                      <Edit size={13} /> Edit Blueprint
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingDiagramId === d.id}
                      onClick={() => promptDeleteDiagram(d)}
                    >
                      {deletingDiagramId === d.id ? (
                        <>
                          <Loader2 size={13} className="animate-spin" /> Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={13} /> Delete
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT DIAGRAM TEMPLATE */}
      {showDiagramModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 my-auto flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 flex-shrink-0">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingDiagram ? "Edit Diagram Blueprint" : "Add Diagram Blueprint"}
              </h3>
              <Button onClick={() => setShowDiagramModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </Button>
            </div>
            <form onSubmit={handleSaveDiagram} className="py-4 space-y-4">
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
                disabled={savingDiagram || !diagramForm.name.trim()}
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {savingDiagram ? <Loader2 size={16} className="animate-spin" /> : null}
                {savingDiagram ? "Saving Blueprint..." : editingDiagram ? "Update Diagram Blueprint" : "Create Diagram Blueprint"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD CANVAS FOR SUPER ADMIN */}
      {showUploadModal && selectedProject && (
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
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Canvas Type</label>
                  <Select
                    value={canvasForm.canvasType}
                    onChange={(e) => setCanvasForm({ ...canvasForm, canvasType: e.target.value as any })}
                    className="w-full border rounded-xl p-2.5 text-xs bg-white cursor-pointer"
                  >
                    <option value="individual">Individual Canvas</option>
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
                      {diagrams.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </Select>
                  </div>
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
                {uploadingCanvas ? "Uploading..." : "Upload Canvases"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CANVAS / REVISION */}
      {showEditCanvasModal && targetCanvas && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 flex-shrink-0">
              <h3 className="font-extrabold text-lg text-slate-900">Manage Canvas: {targetCanvas.name}</h3>
              <Button onClick={() => setShowEditCanvasModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 py-4 space-y-4">
              {targetCanvas.remarks && targetCanvas.remarks.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                  <span className="font-bold text-amber-900 uppercase">Client Feedback History</span>
                  {targetCanvas.remarks.map((r) => (
                    <div key={r.id} className="p-2 bg-white border border-amber-200 rounded">
                      <p className="font-bold text-slate-800">{r.userName || "Client"}:</p>
                      <p className="text-slate-600">"{r.remark}"</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleUploadRevision} className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700">Upload Revision Image File</label>
                <Input
                  type="file"
                  required
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setRevisionFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-xs text-slate-500 cursor-pointer"
                />

                <Button
                  disabled={uploadingRevision || !revisionFile}
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {uploadingRevision ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={14} />}
                  {uploadingRevision ? "Uploading..." : `Submit Revision V${(targetCanvas.latestVersion?.versionNumber || 1) + 1}`}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX */}
      {fullscreenCanvas && (
        <div
          onClick={() => setFullscreenCanvas(null)}
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <Button onClick={() => setFullscreenCanvas(null)} className="absolute top-5 right-5 text-white bg-slate-800 p-3 rounded-full cursor-pointer z-50">
            <X size={24} />
          </Button>
          <img src={fullscreenCanvas.url} alt={fullscreenCanvas.name} className="max-h-[92vh] max-w-[94vw] object-contain rounded-xl shadow-2xl" />
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
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
    </SidebarLayout>
  );
}
