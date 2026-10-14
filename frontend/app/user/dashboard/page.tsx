"use client";

import { useEffect, useState, useMemo } from "react";
import { AuthGuard } from "@/app/Components/auth/AuthGuard";
import { SidebarLayout, type SidebarNavItem } from "@/app/Components/auth/SidebarLayout";
import {
  Button,
  Card,
  Input,
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
  Clock,
  XCircle,
  ShieldCheck,
  MapPin,
  Calendar,
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
  Sparkles,
} from "lucide-react";
import {
  franchiseApi,
  type FranchiseModel,
  type FranchiseAccessRequestModel,
} from "@/app/lib/client/franchise";
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

  // Franchise info state
  const [franchiseData, setFranchiseData] = useState<{
    franchise: FranchiseModel | null;
    access: FranchiseAccessRequestModel | null;
    status: "pending" | "approved" | "rejected";
  } | null>(null);
  const [loadingFranchise, setLoadingFranchise] = useState(true);

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

  const backendHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const userFranchiseId =
    franchiseData?.franchise?.id ||
    franchiseData?.access?.franchiseId ||
    clientUser?.franchiseId;

  const activeFranchiseName =
    franchiseData?.franchise?.name ||
    clientUser?.franchiseName ||
    "Assigned Franchise";
  const activeFranchiseStatus =
    franchiseData?.status || clientUser?.franchiseStatus || "approved";
  const franchiseLogoUrl = franchiseData?.franchise?.brandingLogoUrl
    ? resolveImageUrl(franchiseData.franchise.brandingLogoUrl)
    : clientUser?.brandingLogoUrl
      ? resolveImageUrl(clientUser.brandingLogoUrl)
      : null;

  const navItems: SidebarNavItem[] = [
    { id: "projects", label: "My Design Proofs", icon: FolderKanban, badge: projects.length },
    { id: "franchise", label: "My Franchise", icon: Building2 },
    { id: "banner-templates", label: "Banner Templates", icon: LayoutTemplate, badge: bannerTemplates.length },
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

  async function loadUserFranchise() {
    try {
      const data = await franchiseApi.getMyFranchise();
      setFranchiseData(data);
      const fId = data?.franchise?.id || data?.access?.franchiseId || clientUser?.franchiseId;
      if (fId) {
        await loadFranchiseBanners(fId);
      } else {
        await loadFranchiseBanners();
      }
    } catch (err) {
      console.error("Failed to load user franchise:", err);
      if (clientUser?.franchiseId) {
        await loadFranchiseBanners(clientUser.franchiseId);
      }
    } finally {
      setLoadingFranchise(false);
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
    loadUserFranchise();
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
        const matchesDim = (item.dimensionsLabel || "").toLowerCase().includes(query);
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
      franchiseName={activeFranchiseName}
      franchiseStatus={activeFranchiseStatus}
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
          ) : filteredBanners.length === 0 ? (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredBanners.map((template) => {
                const primaryImage = template.images?.[0]?.imageUrl
                  ? resolveImageUrl(template.images[0].imageUrl)
                  : "";

                return (
                  <Card
                    key={template.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-lg hover:border-indigo-300 transition-all duration-200 p-0 flex flex-col"
                  >
                    {/* Top Image Preview Banner */}
                    <div
                      onClick={() => {
                        setViewingTemplate(template);
                        setActiveImageIndex(0);
                      }}
                      className="cursor-pointer relative aspect-[16/10] bg-slate-50 border-b border-slate-100 overflow-hidden"
                    >
                      <BannerImageThumbnail
                        src={primaryImage}
                        alt={template.name}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 bg-white"
                      />

                      {/* Overlay Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/95 backdrop-blur-xs text-slate-800 shadow-xs capitalize border border-slate-200">
                          {template.orientation}
                        </span>
                        {template.images && template.images.length > 1 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white shadow-xs backdrop-blur-xs">
                            {template.images.length} Assets
                          </span>
                        )}
                      </div>

                      <div className="absolute top-2.5 right-2.5 z-10">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white shadow-xs font-mono">
                          {template.dimensionsLabel}
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
                              setViewingTemplate(template);
                              setActiveImageIndex(0);
                            }}
                          >
                            {template.name}
                          </h3>
                        </div>

                        {template.description ? (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {template.description}
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
                          {template.widthPx} × {template.heightPx} px
                        </span>

                        <div className="flex items-center gap-1.5">
                          {primaryImage && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Download Banner"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadBanner(template.images[0].imageUrl, `${template.name}-banner.png`);
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
                              setViewingTemplate(template);
                              setActiveImageIndex(0);
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
              {filteredBanners.map((template) => {
                const primaryImage = template.images?.[0]?.imageUrl
                  ? resolveImageUrl(template.images[0].imageUrl)
                  : "";

                return (
                  <Card
                    key={template.id}
                    className="p-3.5 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition rounded-xl flex items-center justify-between gap-4"
                  >
                    <div
                      onClick={() => {
                        setViewingTemplate(template);
                        setActiveImageIndex(0);
                      }}
                      className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="w-16 h-12 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <BannerImageThumbnail
                          src={primaryImage}
                          alt={template.name}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{template.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                            {template.dimensionsLabel}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                            {template.orientation}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {template.description || `${template.widthPx}x${template.heightPx} px blueprint`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {primaryImage && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDownloadBanner(template.images[0].imageUrl, `${template.name}-banner.png`)}
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
                          setViewingTemplate(template);
                          setActiveImageIndex(0);
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

      {/* TAB 3: MY FRANCHISE DETAILS */}
      {activeTab === "franchise" && (
        <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
          <Card className="p-6 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-2xl">
            {/* Top Branding Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 p-2 overflow-hidden shadow-inner">
                  {franchiseLogoUrl ? (
                    <img
                      src={franchiseLogoUrl}
                      alt={activeFranchiseName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Building2 size={32} className="text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {activeFranchiseName}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" />
                    Authorized Regional Branch
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${activeFranchiseStatus === "approved"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : activeFranchiseStatus === "pending"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                >
                  {activeFranchiseStatus === "approved" && (
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  )}
                  {activeFranchiseStatus === "pending" && (
                    <Clock size={14} className="text-amber-600" />
                  )}
                  {activeFranchiseStatus === "rejected" && (
                    <XCircle size={14} className="text-rose-600" />
                  )}
                  {activeFranchiseStatus === "approved"
                    ? "Approved & Active"
                    : activeFranchiseStatus === "pending"
                      ? "Pending Super Admin Approval"
                      : "Access Rejected"}
                </span>
              </div>
            </div>

            {/* Franchise Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 text-xs">
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Franchise Description
                </span>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {franchiseData?.franchise?.description ||
                    "Official partner franchise branch for custom signs, banners, and printing services."}
                </p>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Membership Details
                </span>
                <div className="space-y-1 text-slate-600">
                  <p className="flex items-center justify-between">
                    <span>Account User:</span>
                    <strong className="text-slate-900">{clientUser.name}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Registered Email:</span>
                    <strong className="text-slate-900">{clientUser.email}</strong>
                  </p>
                  {franchiseData?.access?.createdAt && (
                    <p className="flex items-center justify-between">
                      <span>Requested On:</span>
                      <strong className="text-slate-900">
                        {new Date(franchiseData.access.createdAt).toLocaleDateString()}
                      </strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Franchise Banner Templates Section */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <LayoutTemplate size={16} className="text-indigo-600" />
                    Franchise Banner Templates
                    {bannerTemplates.length > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                        {bannerTemplates.length}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official marketing banners and templates assigned to {activeFranchiseName}
                  </p>
                </div>
                {bannerTemplates.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("banner-templates")}
                    className="text-xs font-semibold gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  >
                    View All <ChevronRight size={13} />
                  </Button>
                )}
              </div>

              {loadingBanners ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Loader2 size={16} className="animate-spin inline mr-2 text-indigo-600" />
                  Loading franchise banners...
                </div>
              ) : bannerTemplates.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
                  <FileImage size={24} className="mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">No banner templates assigned yet</p>
                  <p>Banners configured for {activeFranchiseName} by administrators will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {bannerTemplates.slice(0, 3).map((bt) => {
                    const primaryImg = bt.images?.[0]?.imageUrl
                      ? resolveImageUrl(bt.images[0].imageUrl)
                      : "";
                    return (
                      <div
                        key={bt.id}
                        onClick={() => {
                          setViewingTemplate(bt);
                          setActiveImageIndex(0);
                        }}
                        className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-2 hover:border-indigo-300 hover:shadow-md transition"
                      >
                        <div className="aspect-[16/10] bg-slate-50 rounded-lg overflow-hidden relative">
                          {primaryImg ? (
                            <img
                              src={primaryImg}
                              alt={bt.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition duration-300 bg-white"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <FileImage size={20} />
                            </div>
                          )}
                          <div className="absolute top-1.5 right-1.5">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs font-mono">
                              {bt.dimensionsLabel}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition">
                            {bt.name}
                          </p>
                          <p className="text-[10px] text-slate-500 capitalize mt-0.5">
                            {bt.orientation} · {bt.images?.length || 0} image(s)
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rejection / Note banner */}
            {activeFranchiseStatus === "rejected" && franchiseData?.access?.rejectionReason && (
              <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                <h4 className="font-bold flex items-center gap-1.5 text-rose-800">
                  <XCircle size={15} /> Rejection Reason Given by Administrator
                </h4>
                <p className="font-medium pl-5">{franchiseData.access.rejectionReason}</p>
              </div>
            )}

            {/* Action Bar */}
            <p className="text-xs text-slate-400 pt-2">
              Need to transfer to another franchise? Contact support.
            </p>
          </Card>
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
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-medium text-slate-700">{activeFranchiseName}</span>
                    <span>·</span>
                    <span className="font-mono text-indigo-600 font-semibold">
                      {viewingTemplate.dimensionsLabel}
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

              {/* Multiple Images Selector Strip */}
              {viewingTemplate.images && viewingTemplate.images.length > 1 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Template Assets ({viewingTemplate.images.length})
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {viewingTemplate.images.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-16 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition bg-slate-900 relative ${activeImageIndex === idx
                            ? "border-indigo-600 shadow-xs ring-2 ring-indigo-200"
                            : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                          }`}
                      >
                        <img
                          src={resolveImageUrl(img.imageUrl)}
                          alt={img.imageName || `Asset ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                      <span>Aspect Ratio:</span>
                      <strong className="text-slate-900 font-mono">
                        {viewingTemplate.dimensionsLabel}
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
                        cur.imageName || `${viewingTemplate.name}-banner.png`
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