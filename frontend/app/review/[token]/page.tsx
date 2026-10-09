"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  canvasApi,
  type ProjectModel,
  type CanvasModel,
} from "@/app/lib/client/canvas-api";
import {
  Button,
  Card,
  Textarea,
  StatusBadge,
} from "@/app/Components/ui";
import {
  AlertCircle,
  CheckCircle2,
  ZoomIn,
  Layers,
  FileImage,
  LayoutGrid,
  History,
  MessageSquare,
  X,
  Loader2,
  LogIn,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Maximize2,
} from "lucide-react";
import {
  getStoredUser,
  getDashboardPathFromToken,
} from "@/app/lib/auth/token";

export default function SecureCanvasReviewPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params.token || "");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [project, setProject] = useState<ProjectModel | null>(null);
  const [canvases, setCanvases] = useState<CanvasModel[]>([]);
  const [selectedCanvas, setSelectedCanvas] = useState<CanvasModel | null>(null);

  const [fullscreenCanvas, setFullscreenCanvas] = useState<{
    url: string;
    name: string;
    version: number;
    projectName?: string;
    status?: string;
    canvasType?: string;
    date?: string;
  } | null>(null);

  const [subImageRemarks, setSubImageRemarks] = useState<Record<number, string>>({});
  const [submittingImageId, setSubmittingImageId] = useState<number | null>(null);

  const backendHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  async function loadReviewData() {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await canvasApi.getPublicReview(token);
      setProject(data.project);
      setCanvases(data.canvases);

      if (data.canvases.length > 0 && !selectedCanvas) {
        setSelectedCanvas(data.canvases[0]);
      } else if (selectedCanvas) {
        const updated = data.canvases.find((c) => c.id === selectedCanvas.id);
        if (updated) setSelectedCanvas(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load review project.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    loadReviewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreenCanvas(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function openFullscreenProof(c: CanvasModel) {
    const thumb = c.latestVersion?.thumbnailUrl
      ? `${backendHost}${c.latestVersion.thumbnailUrl}`
      : "/placeholder.png";
    const fullImageUrl = c.latestVersion?.watermarkedImageUrl
      ? `${backendHost}${c.latestVersion.watermarkedImageUrl}`
      : thumb;
    setFullscreenCanvas({
      url: fullImageUrl,
      name: c.name,
      version: c.latestVersion?.versionNumber || 1,
      projectName: project?.name,
      status: c.status,
      canvasType: c.canvasType,
      date: new Date(c.updatedAt).toLocaleDateString(),
    });
  }

  async function handleImageAction(
    canvas: CanvasModel,
    imageId: number | null,
    statusAction: "approved" | "changes_requested",
    remarkKey: number,
  ) {
    if (!canvas.latestVersion) return;
    const inputRemark = subImageRemarks[remarkKey]?.trim() || "";

    if (statusAction === "changes_requested" && !inputRemark) {
      alert("Please type a remark explaining what changes are needed for this image.");
      return;
    }

    setSubmittingImageId(remarkKey);
    try {
      await canvasApi.addRemark(canvas.id, {
        versionId: canvas.latestVersion.id,
        imageId: imageId || undefined,
        userName: project?.clientName || "Client Reviewer",
        remark:
          inputRemark ||
          (statusAction === "approved"
            ? "Approved photo."
            : "Requested changes for this photo."),
        statusAction,
      });

      setSubImageRemarks((prev) => ({ ...prev, [remarkKey]: "" }));
      await loadReviewData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update image review status.");
    } finally {
      setSubmittingImageId(null);
    }
  }

  function getCanvasTypeBadge(type: string) {
    switch (type) {
      case "collage":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 text-[11px] font-semibold">
            <LayoutGrid size={11} /> Auto Collage
          </span>
        );
      case "diagram":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 text-[11px] font-semibold">
            <Layers size={11} /> Diagram Layout
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold">
            <FileImage size={11} /> Individual Canvas
          </span>
        );
    }
  }

  function splitDiagramTiles(c: CanvasModel) {
    const tiles = c.diagramImages || [];
    if (c.canvasType !== "diagram" || tiles.length === 0) {
      return { blueprint: null as (typeof tiles)[0] | null, photoTiles: tiles };
    }

    const blueprintIndex = tiles.findIndex((img) => {
      const caption = (img.caption || "").toLowerCase();
      return (
        caption.includes("blueprint") ||
        caption.includes("diagram layout") ||
        caption.includes("diagram blueprint")
      );
    });

    const idx =
      blueprintIndex >= 0 ? blueprintIndex : c.diagramTemplateId ? 0 : -1;

    if (idx < 0) {
      return { blueprint: null as (typeof tiles)[0] | null, photoTiles: tiles };
    }

    return {
      blueprint: tiles[idx],
      photoTiles: tiles.filter((_, i) => i !== idx),
    };
  }

  function renderTileReviewCard(
    c: CanvasModel,
    img: NonNullable<CanvasModel["diagramImages"]>[number],
    label: string,
    options?: { isBlueprint?: boolean },
  ) {
    const imgUrl = `${backendHost}${img.watermarkedImageUrl}`;
    const currentRemarkText = subImageRemarks[img.id] || "";
    const isSubmitting = submittingImageId === img.id;
    const isBlueprint = options?.isBlueprint === true;

    return (
      <Card
        key={img.id}
        className={`p-3 space-y-2 flex flex-col justify-between transition ${isBlueprint
            ? "border-indigo-300 bg-indigo-50/20 ring-1 ring-indigo-200"
            : img.status === "approved"
              ? "border-emerald-400 bg-emerald-50/10 ring-1 ring-emerald-400/20"
              : img.status === "changes_requested"
                ? "border-amber-400 bg-amber-50/10 ring-1 ring-amber-400/20"
                : ""
          }`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-1.5 min-w-0">
            <span className="font-bold text-[11px] text-slate-800 truncate min-w-0" title={label}>
              {label}
            </span>
            {!isBlueprint && (
              <StatusBadge status={img.status} compact pendingLabel="pending" />
            )}
          </div>

          <div className="relative aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden group/tile border border-slate-100 flex items-center justify-center">
            <img src={imgUrl} alt={label} className="w-full h-full object-contain p-1" />
            <div
              onClick={() =>
                setFullscreenCanvas({
                  url: imgUrl,
                  name: label,
                  version: c.latestVersion?.versionNumber || 1,
                  projectName: project?.name,
                  status: isBlueprint ? c.status : img.status,
                  canvasType: c.canvasType,
                  date: new Date(c.updatedAt).toLocaleDateString(),
                })
              }
              className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover/tile:opacity-100 transition flex items-center justify-center backdrop-blur-[1px] cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5 bg-white/95 hover:bg-white text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition transform group-hover/tile:scale-105">
                <ZoomIn size={14} className="text-indigo-600" /> Zoom
              </span>
            </div>
          </div>

          {img.remarks && img.remarks.length > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <MessageSquare size={10} /> Remarks ({img.remarks.length})
              </span>
              <div className="space-y-1 max-h-16 overflow-y-auto">
                {img.remarks.map((r) => {
                  const isDesigner = r.statusAction === "comment";
                  return (
                    <div
                      key={r.id}
                      className={`text-[10.5px] border-t border-slate-200/50 pt-1 ${isDesigner ? "text-indigo-900" : "text-slate-700"
                        }`}
                    >
                      <strong className={isDesigner ? "text-indigo-800" : "text-slate-800"}>
                        {r.userName || (isDesigner ? "Designer" : "Client")}
                        {isDesigner ? " (Designer)" : ""}:
                      </strong>{" "}
                      &quot;{r.remark}&quot;
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {!isBlueprint && (
          <div className="space-y-1.5 border-t border-slate-100 pt-2">
            <Textarea
              rows={2}
              value={currentRemarkText}
              onChange={(e) =>
                setSubImageRemarks({ ...subImageRemarks, [img.id]: e.target.value })
              }
              placeholder={`Remarks for ${label}...`}
              className="w-full rounded-xl border border-slate-200 p-2 text-[10.5px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition resize-none bg-white"
            />
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                type="button"
                disabled={isSubmitting}
                size="sm"
                className="h-8 px-1.5 text-[10.5px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-none rounded-xl flex items-center justify-center gap-1 min-w-0"
                onClick={() => handleImageAction(c, img.id, "changes_requested", img.id)}
              >
                {isSubmitting ? (
                  <Loader2 size={11} className="animate-spin flex-shrink-0" />
                ) : (
                  <AlertCircle size={11} className="flex-shrink-0 text-amber-600" />
                )}
                <span className="truncate">Request Changes</span>
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                size="sm"
                className="h-8 px-1.5 text-[10.5px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-xl flex items-center justify-center gap-1 min-w-0"
                onClick={() => handleImageAction(c, img.id, "approved", img.id)}
              >
                {isSubmitting ? (
                  <Loader2 size={11} className="animate-spin flex-shrink-0" />
                ) : (
                  <CheckCircle2 size={11} className="flex-shrink-0" />
                )}
                <span className="truncate">Approve</span>
              </Button>
            </div>
          </div>
        )}

        {isBlueprint && (
          <p className="text-[10px] text-indigo-700 font-medium border-t border-indigo-100 pt-2">
            Diagram blueprint is reference layout only. Use overall proof feedback or photo tiles
            below for changes.
          </p>
        )}
      </Card>
    );
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center space-y-3">
          <Loader2 size={36} className="mx-auto text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading design review details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-3">
          <AlertCircle size={48} className="mx-auto text-amber-500" />
          <h1 className="text-xl font-extrabold text-slate-900">Review Link Unavailable</h1>
          <p className="text-sm text-slate-600">
            {error || "This review link may be invalid or expired."}
          </p>
        </Card>
      </div>
    );
  }

  const currentUser = typeof window !== "undefined" ? getStoredUser() : null;

  function historyDotClass(status: string) {
    switch (status) {
      case "approved":
        return "bg-emerald-500";
      case "changes_requested":
        return "bg-rose-500";
      default:
        return "bg-indigo-500";
    }
  }

  function historyTitleClass(status: string) {
    switch (status) {
      case "approved":
        return "text-emerald-700";
      case "changes_requested":
        return "text-rose-600";
      default:
        return "text-indigo-700";
    }
  }

  const activeCanvas = selectedCanvas || canvases[0] || null;
  const activeRemarkKey = activeCanvas ? -activeCanvas.id : 0;
  const isSubmittingOverall = submittingImageId === activeRemarkKey;
  const overallPlaceholder =
    activeCanvas?.canvasType === "diagram"
      ? "Overall feedback for this diagram proof (layout, placement, specs)..."
      : activeCanvas?.canvasType === "collage"
        ? "Overall feedback for this collage proof..."
        : "Type feedback or required changes for this canvas...";

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col font-sans antialiased portal-dashboard">
      {/* Thin top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          {/* Top row / Left section */}
          <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {currentUser ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const targetPath = getDashboardPathFromToken() || "/user/dashboard";
                    router.push(targetPath);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 h-8 px-2.5 rounded-xl border-slate-200 cursor-pointer flex-shrink-0"
                >
                  <ArrowLeft size={14} /> Back to Projects
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl flex-shrink-0">
                  <ShieldCheck size={14} className="text-indigo-600 flex-shrink-0" /> Direct Review
                </span>
              )}
              <span className="hidden md:inline text-slate-300">|</span>
              <span className="hidden sm:inline-flex items-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">
                Canvas Details &amp; Approval
              </span>
              <span className="hidden md:inline-flex items-center rounded-xl bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap">
                Anyone with this link can review
              </span>
            </div>

            {/* Mobile actions (status badge + refresh) stay aligned on the right of top row on mobile */}
            <div className="flex sm:hidden items-center gap-1.5 flex-shrink-0 ml-auto">
              {!currentUser && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/user/login")}
                  className="h-7 px-2 rounded-xl bg-white text-[11px] font-semibold flex-shrink-0"
                  title="Log in to view all of your proof history"
                >
                  <LogIn size={12} />
                  History
                </Button>
              )}
              <StatusBadge status={project.status} pendingLabel="pending" />
              <Button
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                onClick={async () => {
                  setIsRefreshing(true);
                  await loadReviewData();
                  setIsRefreshing(false);
                }}
                className="h-7 px-2 rounded-xl bg-white text-[11px] font-semibold flex-shrink-0"
                title="Refresh Proof Data"
              >
                <RefreshCw
                  size={12}
                  className={isRefreshing ? "animate-spin text-indigo-600" : ""}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Desktop right actions */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            {!currentUser && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/user/login")}
                className="h-8 px-3 rounded-xl bg-white text-xs font-semibold flex-shrink-0"
                title="Log in to view all of your proof history"
              >
                <LogIn size={13} />
                Log in for Proof History
              </Button>
            )}
            <StatusBadge status={project.status} pendingLabel="pending" />
            <Button
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              onClick={async () => {
                setIsRefreshing(true);
                await loadReviewData();
                setIsRefreshing(false);
              }}
              className="h-8 px-3 rounded-xl bg-white text-xs font-semibold flex-shrink-0"
              title="Refresh Proof Data"
            >
              <RefreshCw
                size={13}
                className={isRefreshing ? "animate-spin text-indigo-600" : ""}
              />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
        {/* Project title */}
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl sm:text-[1.75rem] font-extrabold text-slate-900 tracking-tight">
            {project.name}
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>
              Client:{" "}
              <strong className="text-slate-800 font-semibold">{project.clientName}</strong>
            </span>
            <span className="text-slate-300">·</span>
            <span>
              Designer:{" "}
              <strong className="text-slate-800 font-semibold">
                {project.designerName || "Designer"}
              </strong>
            </span>
          </p>
        </div>

        {/* Main workspace: canvases left · overall feedback + history right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT - project canvases */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-indigo-600">
                  Project Canvases ({canvases.length})
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Review &amp; approve on each canvas
                </p>
              </div>

              {canvases.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <FileImage size={40} className="mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">
                    No canvases available for review
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {canvases.map((c) => {
                    const thumb = c.latestVersion?.thumbnailUrl
                      ? `${backendHost}${c.latestVersion.thumbnailUrl}`
                      : "/placeholder.png";
                    const isSelected = activeCanvas?.id === c.id;
                    const isChangesReq = c.status === "changes_requested";
                    const isDiagram = c.canvasType === "diagram";
                    const isCollage = c.canvasType === "collage";
                    const isComposite = isDiagram || isCollage;
                    const tiles = c.diagramImages || [];
                    const hasSubImages = tiles.length > 0;
                    const { blueprint, photoTiles } = splitDiagramTiles(c);

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCanvas(c)}
                        className={`rounded-2xl border bg-white p-4 sm:p-5 space-y-4 transition cursor-pointer ${isSelected
                            ? "border-indigo-300 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                            : isChangesReq
                              ? "border-amber-300 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]"
                              : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                          }`}
                      >
                        {/* Canvas header */}
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className="font-extrabold text-[15px] text-slate-900 truncate"
                                title={c.name}
                              >
                                {c.name}
                              </h4>
                              {getCanvasTypeBadge(c.canvasType)}
                              <span className="text-[11px] text-slate-400 font-mono font-semibold">
                                v{c.latestVersion?.versionNumber || 1}
                              </span>
                            </div>
                            <p className="text-[12px] text-slate-500">
                              {isDiagram
                                ? "Diagram proof (blueprint layout + photos composited together)"
                                : isCollage
                                  ? "Auto collage of photo tiles - review each photo separately"
                                  : "Individual canvas proof"}
                            </p>
                          </div>
                          <StatusBadge status={c.status} pendingLabel="pending" />
                        </div>

                        {/* Preview */}
                        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2 sm:p-3">
                          <div className="relative h-[200px] sm:h-[300px] md:h-[380px] bg-white rounded-lg overflow-hidden group border border-slate-200/60 flex items-center justify-center p-2">
                            <img
                              src={thumb}
                              alt={c.name}
                              className="w-full h-full object-contain mx-auto rounded drop-shadow-sm"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[1px]">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="bg-white/95 hover:bg-white shadow cursor-pointer font-semibold text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openFullscreenProof(c);
                                }}
                              >
                                <Maximize2 size={14} /> Fullscreen Proof
                              </Button>
                            </div>
                            <span className="absolute top-2 right-2 bg-slate-900/85 text-white text-[9.5px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-md shadow">
                              v{c.latestVersion?.versionNumber || 1}
                            </span>
                            {isDiagram && (
                              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 text-indigo-700 border border-indigo-100 text-[9.5px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 shadow-sm">
                                <Layers size={10} /> Diagram
                              </span>
                            )}
                            {c.watermarkEnabled && (
                              <span className="absolute bottom-2 left-2 inline-flex items-center rounded-full bg-slate-100/90 text-slate-600 border border-slate-200 text-[8.5px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 uppercase tracking-wide">
                                Watermarked
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Diagram info + components (overall approve lives in right sidebar) */}
                        {isDiagram && hasSubImages ? (
                          <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                            <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-950 space-y-1">
                              <span className="font-bold flex items-center gap-1.5 text-indigo-800">
                                <Layers size={14} className="text-indigo-600" /> Diagram review
                              </span>
                              <p className="text-[11px] text-indigo-800/90 leading-relaxed">
                                This proof includes a <strong>diagram blueprint</strong> (layout
                                reference) plus photo tiles. Use{" "}
                                <strong>Overall Feedback</strong> on the right for the full proof,
                                and request changes on individual photos when needed.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                                <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                                  <Layers size={14} /> Diagram components
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {blueprint ? "1 blueprint" : "No blueprint"} · {photoTiles.length}{" "}
                                  photo{photoTiles.length === 1 ? "" : "s"}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {blueprint &&
                                  renderTileReviewCard(c, blueprint, "Blueprint", {
                                    isBlueprint: true,
                                  })}
                                {photoTiles.map((img, idx) =>
                                  renderTileReviewCard(
                                    c,
                                    img,
                                    `Photo #${idx + 1}: ${img.caption || `Tile ${idx + 1}`}`,
                                  ),
                                )}
                              </div>
                            </div>
                          </div>
                        ) : isCollage && hasSubImages ? (
                          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                              <span className="font-bold text-violet-800 flex items-center gap-1.5">
                                <LayoutGrid size={14} className="text-violet-600" /> Collage photo
                                review
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Approve or request changes on each photo
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {tiles.map((img, idx) =>
                                renderTileReviewCard(
                                  c,
                                  img,
                                  `Photo #${idx + 1}: ${img.caption || `Tile ${idx + 1}`}`,
                                ),
                              )}
                            </div>
                          </div>
                        ) : null}

                        {/* Direct Canvas Action Bar for Individual & overall canvas approval */}
                        {(!hasSubImages || !isComposite) && (
                          <div
                            className="pt-3 border-t border-slate-200/80 space-y-2.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-indigo-600" /> Canvas Review Action
                              </span>
                              <StatusBadge status={c.status} pendingLabel="pending" />
                            </div>

                            <Textarea
                              rows={2}
                              value={subImageRemarks[c.id] || ""}
                              onChange={(e) =>
                                setSubImageRemarks({
                                  ...subImageRemarks,
                                  [c.id]: e.target.value,
                                })
                              }
                              placeholder={`Feedback or change requests for "${c.name}"...`}
                              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition resize-none bg-white"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                              <Button
                                type="button"
                                disabled={submittingImageId === c.id}
                                size="sm"
                                className="w-full h-9 px-3 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-none rounded-xl flex items-center justify-center gap-1.5 cursor-pointer min-w-0"
                                onClick={() =>
                                  handleImageAction(
                                    c,
                                    null,
                                    "changes_requested",
                                    c.id,
                                  )
                                }
                              >
                                {submittingImageId === c.id ? (
                                  <Loader2 size={13} className="animate-spin text-amber-700 flex-shrink-0" />
                                ) : (
                                  <AlertCircle size={13} className="text-amber-700 flex-shrink-0" />
                                )}
                                <span className="truncate">Request Changes</span>
                              </Button>
                              <Button
                                type="button"
                                disabled={submittingImageId === c.id}
                                size="sm"
                                className="w-full h-9 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-xl flex items-center justify-center gap-1.5 cursor-pointer min-w-0"
                                onClick={() =>
                                  handleImageAction(
                                    c,
                                    null,
                                    "approved",
                                    c.id,
                                  )
                                }
                              >
                                {submittingImageId === c.id ? (
                                  <Loader2 size={13} className="animate-spin text-white flex-shrink-0" />
                                ) : (
                                  <CheckCircle2 size={13} className="flex-shrink-0" />
                                )}
                                <span className="truncate">Approve Canvas</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT - Overall Feedback + Activity */}
          <div className="lg:col-span-4 space-y-4 sticky top-[4.25rem]">
            {/* Overall Feedback card */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Overall Feedback</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {activeCanvas?.canvasType === "diagram"
                    ? "Overall feedback for this diagram proof (layout, placement, specs)..."
                    : "Share feedback or approve this canvas proof as a whole."}
                </p>
              </div>

              {activeCanvas?.latestVersion ? (
                <>
                  <Textarea
                    rows={3}
                    value={subImageRemarks[activeRemarkKey] || ""}
                    onChange={(e) =>
                      setSubImageRemarks({
                        ...subImageRemarks,
                        [activeRemarkKey]: e.target.value,
                      })
                    }
                    placeholder={overallPlaceholder}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition resize-none bg-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      disabled={isSubmittingOverall}
                      className="h-10 px-2 sm:px-4 text-[11px] sm:text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-none rounded-xl flex items-center justify-center gap-1.5 min-w-0"
                      onClick={() =>
                        handleImageAction(
                          activeCanvas,
                          null,
                          "changes_requested",
                          activeRemarkKey,
                        )
                      }
                    >
                      {isSubmittingOverall ? (
                        <Loader2 size={14} className="animate-spin flex-shrink-0" />
                      ) : (
                        <AlertCircle size={14} className="flex-shrink-0 text-amber-600" />
                      )}
                      <span className="truncate">Request Changes</span>
                    </Button>
                    <Button
                      type="button"
                      disabled={isSubmittingOverall}
                      className="h-10 px-2 sm:px-4 text-[11px] sm:text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-xl flex items-center justify-center gap-1.5 min-w-0"
                      onClick={() =>
                        handleImageAction(activeCanvas, null, "approved", activeRemarkKey)
                      }
                    >
                      {isSubmittingOverall ? (
                        <Loader2 size={14} className="animate-spin flex-shrink-0" />
                      ) : (
                        <CheckCircle2 size={14} className="flex-shrink-0" />
                      )}
                      <span className="truncate">Approve</span>
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">
                  Select a canvas to leave overall feedback.
                </p>
              )}
            </div>

            {/* Activity & Status History */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <History size={15} className="text-slate-400" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Activity &amp; Status History
                </h3>
              </div>

              {activeCanvas ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <p
                      className="text-[13px] font-bold text-slate-800 truncate"
                      title={activeCanvas.name}
                    >
                      {activeCanvas.name}
                    </p>
                    <StatusBadge
                      status={activeCanvas.status}
                      compact
                      pendingLabel="pending"
                    />
                  </div>

                  <div className="relative pl-1">
                    {activeCanvas.history && activeCanvas.history.length > 0 ? (
                      <div className="space-y-0">
                        {[...activeCanvas.history].reverse().map((h, idx, arr) => (
                          <div key={h.id} className="relative flex gap-3 pb-5 last:pb-0">
                            {idx < arr.length - 1 && (
                              <div className="absolute left-[7px] top-4 bottom-0 w-px bg-slate-200" />
                            )}
                            <div
                              className={`relative z-10 mt-1 w-[15px] h-[15px] rounded-full border-2 border-white shadow-sm flex-shrink-0 ${historyDotClass(h.newStatus)}`}
                            />
                            <div className="min-w-0 flex-1 -mt-0.5">
                              <p
                                className={`text-[13px] font-bold capitalize ${historyTitleClass(h.newStatus)}`}
                              >
                                {h.newStatus.replace(/_/g, " ")}
                              </p>
                              {h.note && (
                                <div className="mt-1.5 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-[12px] text-slate-600 leading-snug">
                                  {h.note}
                                </div>
                              )}
                              <p className="text-[11px] text-slate-400 mt-1">
                                {new Date(h.createdAt).toLocaleString()} ·{" "}
                                {h.actorName || "System"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-3">
                        No status activity recorded yet.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  Select a canvas to view its activity.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen proof sheet */}
      {fullscreenCanvas && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setFullscreenCanvas(null);
          }}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-6 overflow-y-auto"
        >
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
    </div>
  );
}
