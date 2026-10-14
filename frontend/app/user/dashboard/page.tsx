"use client";

import { useEffect, useState, useMemo } from "react";
import { AuthGuard } from "@/app/Components/auth/AuthGuard";
import { SidebarLayout, type SidebarNavItem } from "@/app/Components/auth/SidebarLayout";
import {
  Button,
  Card,
  Input,
  Textarea,
  Label,
  StatusBadge,
} from "@/app/Components/ui";
import {
  canvasApi,
  type ProjectModel,
} from "@/app/lib/client/canvas-api";
import {
  FolderKanban,
  Eye,
  FileImage,
  RefreshCw,
  Search,
  List,
  LayoutGrid,
  Building2,
  CheckCircle2,
  XCircle,
  LayoutTemplate,
  Download,
  Maximize2,
  ChevronRight,
  X,
  ExternalLink,
  ImageIcon,
  Loader2,
  Check,
  Copy,
} from "lucide-react";
import {
  bannerTemplateApi,
  resolveImageUrl,
  type BannerTemplateModel,
} from "@/app/lib/client/banner-template-api";

export default function ClientDashboardPage() {
  return (
    <AuthGuard requiredRole="user">
      {(user) => <ClientDashboardContent clientUser={user} />}
    </AuthGuard>
  );
}

/**
 * Robust banner image thumbnail with loading spinner and fallback placeholder
 */
function BannerImageThumbnail({
  src,
  alt,
  className = "w-full h-full object-cover",
  containerClassName = "w-full h-44 bg-slate-100 flex items-center justify-center relative overflow-hidden",
}: {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div className={containerClassName}>
      {!loaded && !error && src && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-400">
          <Loader2 size={18} className="animate-spin text-slate-400" />
        </div>
      )}
      {error || !src ? (
        <div className="flex flex-col items-center justify-center text-slate-300 gap-1.5 p-3 text-center">
          <FileImage size={24} className="text-slate-300" />
          <span className="text-[10px] font-semibold text-slate-400">Preview not available</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

function ClientDashboardContent({ clientUser }: { clientUser: any }) {
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [projectSearch, setProjectSearch] = useState("");
  const [projectListViewMode, setProjectListViewMode] = useState<"card" | "list">("card");

  // Banner Templates state for the user's selected franchise
  const [bannerTemplates, setBannerTemplates] = useState<BannerTemplateModel[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [refreshingBanners, setRefreshingBanners] = useState(false);
  const [bannerSearch, setBannerSearch] = useState("");
  const [bannerOrientationFilter, setBannerOrientationFilter] = useState<"all" | "landscape" | "portrait">("all");
  const [bannerViewMode, setBannerViewMode] = useState<"grid" | "list">("grid");
  const [viewingTemplate, setViewingTemplate] = useState<BannerTemplateModel | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Dynamic Custom Input Fields state & attachments
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [customFieldFiles, setCustomFieldFiles] = useState<Record<string, File>>({});
  const [loadingCustomization, setLoadingCustomization] = useState(false);
  const [savingCustomization, setSavingCustomization] = useState(false);
  const [customizationNotice, setCustomizationNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Load existing customization when a banner template is opened
  useEffect(() => {
    if (!viewingTemplate) {
      setCustomFieldValues({});
      setCustomFieldFiles({});
      setCustomizationNotice(null);
      return;
    }

    let isMounted = true;
    async function loadSavedCustomization() {
      if (!viewingTemplate?.id) return;
      setLoadingCustomization(true);
      setCustomizationNotice(null);
      try {
        const cust = await bannerTemplateApi.getBannerCustomization(viewingTemplate.id);
        if (isMounted && cust?.customizationValues) {
          setCustomFieldValues(cust.customizationValues);
        }
      } catch (err) {
        console.warn("No existing banner customization found:", err);
      } finally {
        if (isMounted) setLoadingCustomization(false);
      }
    }

    loadSavedCustomization();
    return () => {
      isMounted = false;
    };
  }, [viewingTemplate?.id]);

  // Save banner customization values
  async function handleSaveCustomization(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!viewingTemplate?.id) return;

    // Validate required fields
    if (viewingTemplate.fields && viewingTemplate.fields.length > 0) {
      for (const field of viewingTemplate.fields) {
        if (field.isRequired) {
          const key = String(field.id);
          const val = customFieldValues[key];
          const fileVal = customFieldFiles[key];
          if (field.fieldType === "file") {
            if (!fileVal && !val) {
              setCustomizationNotice({
                type: "error",
                message: `"${field.label}" is required. Please upload a file.`,
              });
              return;
            }
          } else if (
            val === undefined ||
            val === null ||
            val === "" ||
            (Array.isArray(val) && val.length === 0)
          ) {
            setCustomizationNotice({
              type: "error",
              message: `"${field.label}" is a required field.`,
            });
            return;
          }
        }
      }
    }

    setSavingCustomization(true);
    setCustomizationNotice(null);

    try {
      await bannerTemplateApi.saveBannerCustomization({
        templateId: viewingTemplate.id,
        franchiseId: userFranchiseId ? Number(userFranchiseId) : undefined,
        values: customFieldValues,
        files: customFieldFiles,
      });

      setCustomizationNotice({
        type: "success",
        message: "Customization details saved successfully!",
      });
    } catch (err: any) {
      console.error("Failed to save customization:", err);
      setCustomizationNotice({
        type: "error",
        message: err?.message || "Failed to save banner customization.",
      });
    } finally {
      setSavingCustomization(false);
    }
  }

  const backendHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const userFranchiseId = clientUser?.franchiseId;

  const activeFranchiseName =
    clientUser?.franchiseName ||
    "Assigned Franchise";

  const totalBannerImages = useMemo(() => {
    return bannerTemplates.reduce(
      (sum, t) => sum + (t.images && t.images.length > 0 ? t.images.length : 1),
      0,
    );
  }, [bannerTemplates]);

  const navItems: SidebarNavItem[] = [
    { id: "projects", label: "My Design Proofs", icon: FolderKanban, badge: projects.length },
    { id: "banner-templates", label: "Banner Templates", icon: LayoutTemplate, badge: totalBannerImages },
  ];

  async function loadClientProjects() {
    try {
      const data = await canvasApi.listProjects(projectSearch || undefined);
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadFranchiseBanners(targetFranchiseId?: number, isSilent = false) {
    if (!isSilent) {
      setLoadingBanners(true);
    } else {
      setRefreshingBanners(true);
    }
    try {
      const fId = targetFranchiseId ?? userFranchiseId;
      const data = await bannerTemplateApi.getBannerTemplates(fId ? Number(fId) : undefined);
      setBannerTemplates(data);
    } catch (err) {
      console.error("Failed to load franchise banner templates:", err);
    } finally {
      setLoadingBanners(false);
      setRefreshingBanners(false);
    }
  }

  useEffect(() => {
    loadClientProjects();
    loadFranchiseBanners(clientUser?.franchiseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectSearch]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && viewingTemplate) {
        setViewingTemplate(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewingTemplate]);

  function openReview(p: ProjectModel) {
    if (p.shareToken) {
      window.location.href = `/review/${p.shareToken}`;
    }
  }

  // Filter banner templates based on search & orientation
  const filteredBanners = useMemo(() => {
    return bannerTemplates.filter((item) => {
      // If user has a specific franchise, filter to ensure it belongs to that franchise
      if (userFranchiseId && item.franchiseId && Number(item.franchiseId) !== Number(userFranchiseId)) {
        return false;
      }

      // Search matching
      const query = bannerSearch.toLowerCase().trim();
      if (query) {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = (item.description || "").toLowerCase().includes(query);
        const matchesDim =
          (item.dimensionsLabel || "").toLowerCase().includes(query) ||
          `${item.widthPx}x${item.heightPx}`.includes(query) ||
          `${item.widthPx} x ${item.heightPx}`.includes(query);
        if (!matchesName && !matchesDesc && !matchesDim) {
          return false;
        }
      }

      // Orientation matching
      if (
        bannerOrientationFilter !== "all" &&
        item.orientation.toLowerCase() !== bannerOrientationFilter
      ) {
        return false;
      }

      return true;
    });
  }, [bannerTemplates, userFranchiseId, bannerSearch, bannerOrientationFilter]);

  // Flatten templates by their images so each image is displayed separately on the user side
  const bannerDisplayItems = useMemo(() => {
    const list: Array<{
      key: string;
      template: BannerTemplateModel;
      imageIndex: number;
      imageUrl: string;
      imageName?: string | null;
      totalImages: number;
    }> = [];

    for (const template of filteredBanners) {
      if (!template.images || template.images.length === 0) {
        list.push({
          key: `tpl-${template.id}-0`,
          template,
          imageIndex: 0,
          imageUrl: "",
          imageName: template.name,
          totalImages: 0,
        });
      } else {
        template.images.forEach((img, idx) => {
          list.push({
            key: `tpl-${template.id}-img-${img.id || idx}`,
            template,
            imageIndex: idx,
            imageUrl: img.imageUrl,
            imageName: img.imageName,
            totalImages: template.images.length,
          });
        });
      }
    }

    return list;
  }, [filteredBanners]);

  // Download banner image
  async function handleDownloadBanner(imgUrl: string, fileName?: string) {
    try {
      const fullUrl = resolveImageUrl(imgUrl);
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "banner-template.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(resolveImageUrl(imgUrl), "_blank");
    }
  }

  // Copy Image Link
  function handleCopyImageLink(imgUrl: string) {
    const fullUrl = resolveImageUrl(imgUrl);
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <SidebarLayout
      title="Client Review Portal"
      subtitle="View, review, and submit feedback on your custom design proofs"
      roleName="Client User"
      userEmail={clientUser.email}
      userName={clientUser.name}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* TAB 1: DESIGN PROOFS */}
      {activeTab === "projects" && (
        <div className="space-y-5 max-w-3xl">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                type="text"
                placeholder="Search project..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="pl-9 h-10 bg-white shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <Button
                  variant={projectListViewMode === "card" ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => setProjectListViewMode("card")}
                  title="Card View"
                  className={projectListViewMode === "card" ? "shadow-sm" : ""}
                >
                  <LayoutGrid size={14} />
                </Button>
                <Button
                  variant={projectListViewMode === "list" ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => setProjectListViewMode("list")}
                  title="List View"
                  className={projectListViewMode === "list" ? "shadow-sm" : ""}
                >
                  <List size={14} />
                </Button>
              </div>

              <Button
                variant="outline"
                disabled={refreshing || loading}
                onClick={() => {
                  setRefreshing(true);
                  loadClientProjects();
                }}
                title="Refresh Projects"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin text-indigo-600" : ""}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Proofs list only - click opens review */}
          {loading ? (
            <Card className="p-10 text-center text-xs text-slate-500">
              Loading your project proofs...
            </Card>
          ) : projects.length === 0 ? (
            <Card className="p-12 text-center text-slate-400 space-y-2">
              <FileImage size={40} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">
                No active design projects found.
              </p>
              <p className="text-xs">
                When your designer creates a proof, it will appear here.
              </p>
            </Card>
          ) : projectListViewMode === "list" ? (
            <div className="space-y-2">
              {projects.map((p) => (
                <Card
                  key={p.id}
                  onClick={() => openReview(p)}
                  className={`p-3.5 transition hover:border-indigo-300 hover:shadow-md ${p.shareToken ? "cursor-pointer" : "opacity-70 cursor-not-allowed"
                    }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{p.name}</h3>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Designer:{" "}
                        <strong className="text-slate-700">{p.designerName || "Designer"}</strong>
                        {" · "}
                        Updated {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {p.shareToken && (
                      <span className="text-indigo-600 font-bold text-xs flex items-center gap-1 flex-shrink-0">
                        <Eye size={13} /> Open Proof
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((p) => {
                const thumb = p.previewThumbnailUrl
                  ? `${backendHost}${p.previewThumbnailUrl}`
                  : null;

                return (
                  <Card
                    key={p.id}
                    onClick={() => openReview(p)}
                    className={`overflow-hidden transition hover:border-indigo-300 hover:shadow-md p-0 ${p.shareToken ? "cursor-pointer" : "opacity-70 cursor-not-allowed"
                      }`}
                  >
                    {/* Small proof preview */}
                    <div className="relative aspect-[16/10] bg-slate-50 border-b border-slate-100">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`${p.name} preview`}
                          className="w-full h-full object-contain bg-white"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1">
                          <FileImage size={28} />
                          <span className="text-[10px] font-medium text-slate-400">No preview yet</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <StatusBadge status={p.status} compact />
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <div className="min-w-0">
                        <h3
                          className="font-extrabold text-slate-900 text-sm truncate"
                          title={p.name}
                        >
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          Designer:{" "}
                          <strong className="text-slate-700">
                            {p.designerName || "Designer"}
                          </strong>
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2.5">
                        <span className="text-slate-400 text-[11px]">
                          Updated {new Date(p.updatedAt).toLocaleDateString()}
                        </span>
                        {p.shareToken && (
                          <span className="text-indigo-600 font-bold flex items-center gap-1">
                            <Eye size={13} /> Open Proof
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BANNER TEMPLATES FOR USER'S FRANCHISE */}
      {activeTab === "banner-templates" && (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
          {/* Header & Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Franchise Banner Templates
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
                  <Building2 size={13} className="text-indigo-600" />
                  {activeFranchiseName}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Official banners, marketing blueprints, and dimension specifications for {activeFranchiseName}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loadingBanners || refreshingBanners}
                onClick={() => loadFranchiseBanners(userFranchiseId ? Number(userFranchiseId) : undefined, true)}
                className="text-xs h-9 font-medium"
              >
                <RefreshCw
                  size={13}
                  className={refreshingBanners ? "animate-spin text-indigo-600" : ""}
                />
                {refreshingBanners ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="relative flex-1 min-w-0">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                type="text"
                placeholder="Search templates by name, dimensions..."
                value={bannerSearch}
                onChange={(e) => setBannerSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50/60 border-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Orientation Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                {(["all", "landscape", "portrait"] as const).map((ori) => (
                  <button
                    key={ori}
                    type="button"
                    onClick={() => setBannerOrientationFilter(ori)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${bannerOrientationFilter === ori
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    {ori}
                  </button>
                ))}
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl">
                <Button
                  variant={bannerViewMode === "grid" ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => setBannerViewMode("grid")}
                  title="Grid View"
                  className={`h-7 w-7 ${bannerViewMode === "grid" ? "shadow-xs" : ""}`}
                >
                  <LayoutGrid size={13} />
                </Button>
                <Button
                  variant={bannerViewMode === "list" ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => setBannerViewMode("list")}
                  title="List View"
                  className={`h-7 w-7 ${bannerViewMode === "list" ? "shadow-xs" : ""}`}
                >
                  <List size={13} />
                </Button>
              </div>
            </div>
          </div>

          {/* Banner Content Grid / List */}
          {loadingBanners ? (
            <Card className="p-12 text-center text-xs text-slate-500 space-y-2">
              <Loader2 size={24} className="animate-spin mx-auto text-indigo-600" />
              <p className="font-semibold text-slate-700">Loading banner templates...</p>
              <p className="text-[11px] text-slate-400">Fetching graphics for {activeFranchiseName}</p>
            </Card>
          ) : bannerDisplayItems.length === 0 ? (
            <Card className="p-12 text-center text-slate-400 space-y-3 bg-white border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center border border-indigo-100 shadow-inner">
                <LayoutTemplate size={28} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  No banner templates found
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {bannerSearch || bannerOrientationFilter !== "all"
                    ? "No templates match your search criteria. Try resetting the filters."
                    : `No marketing banners have been assigned to ${activeFranchiseName} yet.`}
                </p>
              </div>
              {(bannerSearch || bannerOrientationFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBannerSearch("");
                    setBannerOrientationFilter("all");
                  }}
                  className="text-xs mt-2"
                >
                  Clear Filters
                </Button>
              )}
            </Card>
          ) : bannerViewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {bannerDisplayItems.map((item) => {
                const effectiveImage = item.imageUrl
                  ? resolveImageUrl(item.imageUrl)
                  : "";

                return (
                  <Card
                    key={item.key}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-lg hover:border-indigo-300 transition-all duration-200 p-0 flex flex-col"
                  >
                    {/* Top Image Preview Banner */}
                    <div
                      onClick={() => {
                        setViewingTemplate(item.template);
                        setActiveImageIndex(item.imageIndex);
                      }}
                      className="cursor-pointer relative aspect-[16/10] bg-slate-50 border-b border-slate-100 overflow-hidden"
                    >
                      <BannerImageThumbnail
                        src={effectiveImage}
                        alt={item.imageName || item.template.name}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 bg-white"
                      />

                      {/* Overlay Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/95 backdrop-blur-xs text-slate-800 shadow-xs capitalize border border-slate-200">
                          {item.template.orientation}
                        </span>
                        {item.totalImages > 1 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white shadow-xs backdrop-blur-xs font-mono">
                            #{item.imageIndex + 1}
                          </span>
                        )}
                      </div>

                      <div className="absolute top-2.5 right-2.5 z-10">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white shadow-xs font-mono">
                          {item.template.widthPx} × {item.template.heightPx} px
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition truncate cursor-pointer"
                            onClick={() => {
                              setViewingTemplate(item.template);
                              setActiveImageIndex(item.imageIndex);
                            }}
                          >
                            {item.template.name}
                            {item.totalImages > 1 && (
                              <span className="text-xs text-slate-400 font-normal ml-1.5">
                                (#{item.imageIndex + 1})
                              </span>
                            )}
                          </h3>
                        </div>

                        {item.template.description ? (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {item.template.description}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1 italic">
                            No description provided
                          </p>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.template.widthPx} × {item.template.heightPx} px
                        </span>

                        <div className="flex items-center gap-1.5">
                          {effectiveImage && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Download Banner"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadBanner(
                                  item.imageUrl,
                                  item.imageName || `${item.template.name}-banner-${item.imageIndex + 1}.png`
                                );
                              }}
                              className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                            >
                              <Download size={14} />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setViewingTemplate(item.template);
                              setActiveImageIndex(item.imageIndex);
                            }}
                            className="h-8 text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300"
                          >
                            <Eye size={13} /> View Banner
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2.5">
              {bannerDisplayItems.map((item) => {
                const effectiveImage = item.imageUrl
                  ? resolveImageUrl(item.imageUrl)
                  : "";

                return (
                  <Card
                    key={item.key}
                    className="p-3.5 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition rounded-xl flex items-center justify-between gap-4"
                  >
                    <div
                      onClick={() => {
                        setViewingTemplate(item.template);
                        setActiveImageIndex(item.imageIndex);
                      }}
                      className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="w-16 h-12 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <BannerImageThumbnail
                          src={effectiveImage}
                          alt={item.imageName || item.template.name}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {item.template.name}
                            {item.totalImages > 1 && (
                              <span className="text-xs text-slate-400 font-normal ml-1">
                                (#{item.imageIndex + 1})
                              </span>
                            )}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                            {item.template.widthPx} × {item.template.heightPx} px
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                            {item.template.orientation}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {item.template.description || `${item.template.widthPx}x${item.template.heightPx} px blueprint`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {effectiveImage && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            handleDownloadBanner(
                              item.imageUrl,
                              item.imageName || `${item.template.name}-banner-${item.imageIndex + 1}.png`
                            )
                          }
                          title="Download Image"
                          className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                        >
                          <Download size={14} />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setViewingTemplate(item.template);
                          setActiveImageIndex(item.imageIndex);
                        }}
                        className="h-8 text-xs font-semibold gap-1.5"
                      >
                        <Eye size={13} /> View
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DETAIL / PREVIEW MODAL */}
      {viewingTemplate && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingTemplate(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <LayoutTemplate size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {viewingTemplate.name}
                    {viewingTemplate.images && viewingTemplate.images.length > 1 && (
                      <span className="text-xs text-slate-400 font-normal ml-1.5 font-mono">
                        (#{activeImageIndex + 1})
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-medium text-slate-700">{activeFranchiseName}</span>
                    <span>·</span>
                    <span className="font-mono text-indigo-600 font-semibold">
                      {viewingTemplate.widthPx} × {viewingTemplate.heightPx} px
                    </span>
                    <span>·</span>
                    <span className="capitalize">{viewingTemplate.orientation}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingTemplate(null)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Main Banner Image Display */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-950 flex items-center justify-center relative h-56 sm:h-64 w-full shadow-inner">
                {viewingTemplate.images && viewingTemplate.images[activeImageIndex] ? (
                  <img
                    src={resolveImageUrl(viewingTemplate.images[activeImageIndex].imageUrl)}
                    alt={`${viewingTemplate.name} preview`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <FileImage size={32} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-xs">No preview image available</p>
                  </div>
                )}

                {/* View Fullscreen / New Tab Action */}
                {viewingTemplate.images && viewingTemplate.images[activeImageIndex] && (
                  <a
                    href={resolveImageUrl(viewingTemplate.images[activeImageIndex].imageUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open full resolution in new tab"
                    className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs transition"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>

              {/* Specifications & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Template Description
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {viewingTemplate.description || "No specific instructions provided with this template."}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Technical Specifications
                  </span>
                  <div className="space-y-1 text-slate-600">
                    <p className="flex items-center justify-between">
                      <span>Franchise:</span>
                      <strong className="text-slate-900">{activeFranchiseName}</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Resolution:</span>
                      <strong className="text-slate-900 font-mono">
                        {viewingTemplate.widthPx} × {viewingTemplate.heightPx} px
                      </strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Orientation:</span>
                      <strong className="text-slate-900 capitalize">
                        {viewingTemplate.orientation}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Custom Fields Section */}
              {viewingTemplate.fields && viewingTemplate.fields.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <span>Banner Customization & Details</span>
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {viewingTemplate.fields.length}{" "}
                          {viewingTemplate.fields.length === 1 ? "Field" : "Fields"}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Fill in your custom details and information for this banner request.
                      </p>
                    </div>

                    {loadingCustomization && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Loader2 size={13} className="animate-spin text-indigo-600" />
                        <span>Loading saved values...</span>
                      </div>
                    )}
                  </div>

                  {customizationNotice && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                        customizationNotice.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      {customizationNotice.type === "success" ? (
                        <CheckCircle2
                          size={15}
                          className="text-emerald-600 flex-shrink-0"
                        />
                      ) : (
                        <XCircle
                          size={15}
                          className="text-red-600 flex-shrink-0"
                        />
                      )}
                      <span>{customizationNotice.message}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveCustomization} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {viewingTemplate.fields.map((field, fIdx) => {
                        const fieldKey = String(field.id || fIdx);
                        const val = customFieldValues[fieldKey] ?? "";
                        const isReadOnly = field.isEditable === false;

                        return (
                          <div
                            key={fieldKey}
                            className={`space-y-1.5 ${
                              field.fieldType === "textarea" ? "sm:col-span-2" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                <span>{field.label}</span>
                                {field.isRequired && (
                                  <span className="text-red-500 font-bold">*</span>
                                )}
                              </label>
                              {isReadOnly && (
                                <span className="text-[10px] text-slate-400 italic">
                                  Read-only
                                </span>
                              )}
                            </div>

                            {/* Render based on fieldType */}
                            {field.fieldType === "text" && (
                              <Input
                                type="text"
                                placeholder={
                                  field.placeholder || `Enter ${field.label}...`
                                }
                                value={val}
                                disabled={isReadOnly}
                                onChange={(e) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [fieldKey]: e.target.value,
                                  }))
                                }
                                className="h-9 text-xs"
                                required={field.isRequired}
                              />
                            )}

                            {field.fieldType === "email" && (
                              <Input
                                type="email"
                                placeholder={
                                  field.placeholder || "name@example.com"
                                }
                                value={val}
                                disabled={isReadOnly}
                                onChange={(e) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [fieldKey]: e.target.value,
                                  }))
                                }
                                className="h-9 text-xs"
                                required={field.isRequired}
                              />
                            )}

                            {field.fieldType === "phone" && (
                              <Input
                                type="tel"
                                placeholder={
                                  field.placeholder || "+1 (555) 000-0000"
                                }
                                value={val}
                                disabled={isReadOnly}
                                onChange={(e) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [fieldKey]: e.target.value,
                                  }))
                                }
                                className="h-9 text-xs"
                                required={field.isRequired}
                              />
                            )}

                            {field.fieldType === "number" && (
                              <Input
                                type="number"
                                placeholder={field.placeholder || "0"}
                                value={val}
                                disabled={isReadOnly}
                                onChange={(e) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [fieldKey]: e.target.value,
                                  }))
                                }
                                className="h-9 text-xs"
                                required={field.isRequired}
                              />
                            )}

                            {field.fieldType === "textarea" && (
                              <Textarea
                                placeholder={
                                  field.placeholder || `Enter ${field.label}...`
                                }
                                value={val}
                                disabled={isReadOnly}
                                onChange={(e) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [fieldKey]: e.target.value,
                                  }))
                                }
                                rows={3}
                                className="text-xs resize-y"
                                required={field.isRequired}
                              />
                            )}

                            {field.fieldType === "date" && (
                              <Input
                                type="date"
                                value={val}
                                disabled={isReadOnly}
                                onChange={(e) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [fieldKey]: e.target.value,
                                  }))
                                }
                                className="h-9 text-xs"
                                required={field.isRequired}
                              />
                            )}

                            {field.fieldType === "select" && (
                              <select
                                value={val}
                                disabled={isReadOnly}
                                onChange={(e) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [fieldKey]: e.target.value,
                                  }))
                                }
                                className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 disabled:bg-slate-100"
                                required={field.isRequired}
                              >
                                <option value="">
                                  {field.placeholder || "-- Select an option --"}
                                </option>
                                {(field.options || []).map((opt, oIdx) => (
                                  <option key={oIdx} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                            {field.fieldType === "radio" && (
                              <div className="space-y-2 pt-1">
                                {(field.options || []).map((opt, oIdx) => (
                                  <label
                                    key={oIdx}
                                    className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"
                                  >
                                    <input
                                      type="radio"
                                      name={`radio-field-${fieldKey}`}
                                      value={opt}
                                      checked={val === opt}
                                      disabled={isReadOnly}
                                      onChange={() =>
                                        setCustomFieldValues((prev) => ({
                                          ...prev,
                                          [fieldKey]: opt,
                                        }))
                                      }
                                      className="w-3.5 h-3.5 text-indigo-600 border-slate-300"
                                      required={field.isRequired && !val}
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {field.fieldType === "checkbox" && (
                              <div className="pt-1">
                                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(val)}
                                    disabled={isReadOnly}
                                    onChange={(e) =>
                                      setCustomFieldValues((prev) => ({
                                        ...prev,
                                        [fieldKey]: e.target.checked,
                                      }))
                                    }
                                    className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                                  />
                                  <span>
                                    {field.placeholder ||
                                      `Check to confirm ${field.label}`}
                                  </span>
                                </label>
                              </div>
                            )}

                            {field.fieldType === "file" && (
                              <div className="space-y-2">
                                <Input
                                  type="file"
                                  disabled={isReadOnly}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setCustomFieldFiles((prev) => ({
                                        ...prev,
                                        [fieldKey]: file,
                                      }));
                                      setCustomFieldValues((prev) => ({
                                        ...prev,
                                        [fieldKey]: file.name,
                                      }));
                                    }
                                  }}
                                  className="h-9 text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                                />
                                {typeof val === "string" && val && (
                                  <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                    <FileImage
                                      size={12}
                                      className="text-slate-400 flex-shrink-0"
                                    />
                                    <span>
                                      Current file: <strong>{val}</strong>
                                    </span>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                      <Button
                        type="submit"
                        disabled={savingCustomization}
                        className="text-xs h-8 px-4 font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      >
                        {savingCustomization ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <span>Save Customization</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Modal Footer (Sticky at bottom) */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currImg = viewingTemplate.images?.[activeImageIndex]?.imageUrl;
                  if (currImg) handleCopyImageLink(currImg);
                }}
                className="text-xs h-8 gap-1.5"
              >
                {copiedLink ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    Copy Link
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingTemplate(null)}
                  className="text-xs h-8"
                >
                  Close
                </Button>

                {viewingTemplate.images && viewingTemplate.images[activeImageIndex] && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      const cur = viewingTemplate.images[activeImageIndex];
                      handleDownloadBanner(
                        cur.imageUrl,
                        cur.imageName ||
                          (viewingTemplate.images && viewingTemplate.images.length > 1
                            ? `${viewingTemplate.name}-banner-${activeImageIndex + 1}.png`
                            : `${viewingTemplate.name}-banner.png`)
                      );
                    }}
                    className="text-xs h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 shadow-xs"
                  >
                    <Download size={13} /> Download Banner
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
