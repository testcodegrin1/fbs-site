"use client";

import { useEffect, useState, useMemo } from "react";
import { AuthGuard } from "@/app/Components/auth/AuthGuard";
import {
  SidebarLayout,
  type SidebarNavItem,
} from "@/app/Components/auth/SidebarLayout";
import {
  Button,
  Card,
  Input,
  Textarea,
  Label,
  StatusBadge,
} from "@/app/Components/ui";
import { canvasApi, type ProjectModel } from "@/app/lib/client/canvas-api";
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
  Inbox,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  ArrowLeft,
  History,
} from "lucide-react";
import {
  bannerTemplateApi,
  resolveImageUrl,
  type BannerTemplateModel,
  type BannerSubmissionListItem,
} from "@/app/lib/client/banner-template-api";
import { franchiseApi, type FranchiseModel } from "@/app/lib/client/franchise";
import { BannerSubmissionThreadModal } from "./BannerSubmissionThreadModal";

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
          <span className="text-[10px] font-semibold text-slate-400">
            Preview not available
          </span>
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
  const [projectListViewMode, setProjectListViewMode] = useState<
    "card" | "list"
  >("list");

  // Banner Templates state for the user's selected franchise
  const [bannerTemplates, setBannerTemplates] = useState<BannerTemplateModel[]>(
    [],
  );
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [refreshingBanners, setRefreshingBanners] = useState(false);
  const [bannerSearch, setBannerSearch] = useState("");
  const [bannerOrientationFilter, setBannerOrientationFilter] = useState<
    "all" | "landscape" | "portrait"
  >("all");
  const [bannerViewMode, setBannerViewMode] = useState<"grid" | "list">("list");
  const [viewingTemplate, setViewingTemplate] =
    useState<BannerTemplateModel | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Dynamic Custom Input Fields state & attachments
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, any>
  >({});
  const [customFieldFiles, setCustomFieldFiles] = useState<
    Record<string, File>
  >({});
  const [loadingCustomization, setLoadingCustomization] = useState(false);
  const [savingCustomization, setSavingCustomization] = useState(false);
  const [customizationNotice, setCustomizationNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // User's Submitted Banners state
  const [mySubmissions, setMySubmissions] = useState<
    BannerSubmissionListItem[]
  >([]);
  const [loadingMySubmissions, setLoadingMySubmissions] = useState(false);
  const [refreshingMySubmissions, setRefreshingMySubmissions] = useState(false);
  const [selectedMySubmission, setSelectedMySubmission] =
    useState<BannerSubmissionListItem | null>(null);
  const [loadingSubmissionDetail, setLoadingSubmissionDetail] = useState(false);
  const [mySubmissionDetail, setMySubmissionDetail] = useState<any>(null);
  const [threadSubmissionId, setThreadSubmissionId] = useState<number | null>(
    null,
  );
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionListViewMode, setSubmissionListViewMode] = useState<
    "card" | "list"
  >("list");

  async function loadMySubmissions(isSilent = false) {
    if (!isSilent) setLoadingMySubmissions(true);
    else setRefreshingMySubmissions(true);
    try {
      const res = await bannerTemplateApi.getMyBannerSubmissions();
      setMySubmissions(res.submissions || []);
    } catch (err) {
      console.error("Failed to load my banner submissions:", err);
    } finally {
      setLoadingMySubmissions(false);
      setRefreshingMySubmissions(false);
    }
  }

  async function openMySubmissionDetail(sub: BannerSubmissionListItem) {
    setSelectedMySubmission(sub);
    setLoadingSubmissionDetail(true);
    try {
      const detail = await bannerTemplateApi.getBannerSubmissionById(sub.id);
      setMySubmissionDetail(detail);
    } catch (err) {
      console.error("Failed to load submission detail:", err);
      setMySubmissionDetail(null);
    } finally {
      setLoadingSubmissionDetail(false);
    }
  }

  function getSubmissionStatusBadge(status: string) {
    const norm = (status || "Pending").toLowerCase().replace(/_/g, " ");
    switch (norm) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle size={12} className="text-emerald-500" />
            Approved
          </span>
        );
      case "changes requested":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs">
            <AlertCircle size={12} className="text-amber-500" />
            Changes Requested
          </span>
        );
      case "in review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <Clock size={12} className="text-blue-500" />
            In Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
            <XCircle size={12} className="text-red-500" />
            Rejected
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
            <CheckCircle2 size={12} className="text-purple-500" />
            Completed
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <Clock size={12} className="text-amber-500" />
            Pending Review
          </span>
        );
    }
  }

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
        const cust = await bannerTemplateApi.getBannerCustomization(
          viewingTemplate.id,
        );
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
      const currentImage = viewingTemplate.images?.[activeImageIndex];
      const variantTitle =
        viewingTemplate.images && viewingTemplate.images.length > 1
          ? `${viewingTemplate.name} (#${activeImageIndex + 1})`
          : viewingTemplate.name;

      const res = await bannerTemplateApi.submitBannerCustomization({
        templateId: viewingTemplate.id,
        franchiseId: userFranchiseId ? Number(userFranchiseId) : undefined,
        values: {
          ...customFieldValues,
          _selectedImageIndex: activeImageIndex,
          _selectedImageUrl: currentImage?.imageUrl || "",
          _bannerTitle: variantTitle,
        },
        files: customFieldFiles,
      });

      const subIdMsg = res?.submissionId
        ? ` (Submission #${res.submissionId})`
        : "";
      setCustomizationNotice({
        type: "success",
        message: `Banner customization submitted successfully!${subIdMsg} You can track the status under 'My Banner Submissions'.`,
      });
      loadMySubmissions(true);
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

  const backendHost =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const userFranchiseId = clientUser?.franchiseId;

  const activeFranchiseName = clientUser?.franchiseName || "Assigned Franchise";

  // Franchise detail state for user
  const [franchiseDetail, setFranchiseDetail] = useState<FranchiseModel | null>(
    null,
  );
  const [loadingFranchise, setLoadingFranchise] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchFranchiseInfo() {
      if (!userFranchiseId) return;
      setLoadingFranchise(true);
      try {
        const data = await franchiseApi.getFranchiseById(
          Number(userFranchiseId),
        );
        if (isMounted && data) {
          setFranchiseDetail(data);
        }
      } catch (err) {
        console.warn("Could not fetch full franchise profile:", err);
      } finally {
        if (isMounted) setLoadingFranchise(false);
      }
    }

    fetchFranchiseInfo();
    return () => {
      isMounted = false;
    };
  }, [userFranchiseId]);

  const totalBannerImages = useMemo(() => {
    return bannerTemplates.reduce(
      (sum, t) => sum + (t.images && t.images.length > 0 ? t.images.length : 1),
      0,
    );
  }, [bannerTemplates]);

  const navItems: SidebarNavItem[] = [
    {
      id: "projects",
      label: "My Design Proofs",
      icon: FolderKanban,
      badge: projects.length,
    },
    {
      id: "my-franchise",
      label: "My Franchise",
      icon: Building2,
    },
    {
      id: "banner-templates",
      label: "Banner Templates",
      icon: LayoutTemplate,
      badge: totalBannerImages,
    },
    {
      id: "my-banner-submissions",
      label: "My Banner Submissions",
      icon: Inbox,
      badge: mySubmissions.length > 0 ? mySubmissions.length : undefined,
    },
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

  async function loadFranchiseBanners(
    targetFranchiseId?: number,
    isSilent = false,
  ) {
    if (!isSilent) {
      setLoadingBanners(true);
    } else {
      setRefreshingBanners(true);
    }
    try {
      const fId = targetFranchiseId ?? userFranchiseId;
      const data = await bannerTemplateApi.getBannerTemplates(
        fId ? Number(fId) : undefined,
      );
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
    loadMySubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectSearch]);

  useEffect(() => {
    if (activeTab === "my-banner-submissions") {
      loadMySubmissions();
    }
  }, [activeTab]);

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
      if (
        userFranchiseId &&
        item.franchiseId &&
        Number(item.franchiseId) !== Number(userFranchiseId)
      ) {
        return false;
      }

      // Search matching
      const query = bannerSearch.toLowerCase().trim();
      if (query) {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = (item.description || "")
          .toLowerCase()
          .includes(query);
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
  async function handleDownloadBanner(
    imgUrl?: string | null,
    fileName?: string,
  ) {
    if (!imgUrl) return;
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

  const filteredMySubmissions = useMemo(() => {
    if (!submissionSearch.trim()) return mySubmissions;
    const q = submissionSearch.toLowerCase().trim();
    return mySubmissions.filter((sub) => {
      const matchName = sub.templateName.toLowerCase().includes(q);
      const matchFranchise = (sub.franchiseName || "")
        .toLowerCase()
        .includes(q);
      const matchStatus = sub.status.toLowerCase().includes(q);
      return matchName || matchFranchise || matchStatus;
    });
  }, [mySubmissions, submissionSearch]);

  return (
    <SidebarLayout
      title={
        activeTab === "banner-templates"
          ? "Banner Templates"
          : activeTab === "my-banner-submissions"
            ? "My Banner Submissions"
            : activeTab === "my-franchise"
              ? "My Franchise"
              : "Client Review Portal"
      }
      subtitle={
        activeTab === "banner-templates"
          ? "Browse and customize marketing banner templates for your franchise"
          : activeTab === "my-banner-submissions"
            ? "Track and manage your submitted banner requests"
            : activeTab === "my-franchise"
              ? "View franchise profile and assigned marketing assets"
              : "View, review, and submit feedback on your custom design proofs"
      }
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
                  className={`p-3.5 transition hover:border-indigo-300 hover:shadow-md ${
                    p.shareToken
                      ? "cursor-pointer"
                      : "opacity-70 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm truncate">
                          {p.name}
                        </h3>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Designer:{" "}
                        <strong className="text-slate-700">
                          {p.designerName || "Designer"}
                        </strong>
                        {" · "}
                        Updated {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {p.shareToken && (
                      <span className="portal-action" title="Open Proof"><Eye size={15} aria-hidden="true" /><span className="sr-only">Open Proof</span></span>
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
                    className={`overflow-hidden transition hover:border-indigo-300 hover:shadow-md p-0 ${
                      p.shareToken
                        ? "cursor-pointer"
                        : "opacity-70 cursor-not-allowed"
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
                          <span className="text-[10px] font-medium text-slate-400">
                            No preview yet
                          </span>
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
                          <span className="portal-action" title="Open Proof"><Eye size={15} aria-hidden="true" /><span className="sr-only">Open Proof</span></span>
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

      {/* TAB 2: MY FRANCHISE (READ ONLY) */}
      {activeTab === "my-franchise" && (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
          {/* Header & Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  My Franchise
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Assigned
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Your assigned franchise association, branding overview, and
                specifications
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("banner-templates")}
              className="text-xs h-9 font-medium gap-1.5"
            >
              <LayoutTemplate size={13} className="text-indigo-600" />
              View Franchise Banners
            </Button>
          </div>

          {loadingFranchise ? (
            <Card className="p-12 text-center text-xs text-slate-500 space-y-2">
              <Loader2
                size={24}
                className="animate-spin mx-auto text-indigo-600"
              />
              <p className="font-semibold text-slate-700">
                Loading franchise information...
              </p>
            </Card>
          ) : !userFranchiseId && !franchiseDetail ? (
            <Card className="p-12 text-center text-slate-400 space-y-3 bg-white border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center border border-slate-200">
                <Building2 size={28} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  No Franchise Assigned
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You are not currently linked to an official franchise partner.
                  Please contact your administrator.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-5">
              {/* Main Franchise Card */}
              <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* Franchise Logo Preview */}
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                    {franchiseDetail?.brandingLogoUrl ? (
                      <img
                        src={resolveImageUrl(franchiseDetail.brandingLogoUrl)}
                        alt={franchiseDetail.name || activeFranchiseName}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                          const parent = (e.target as HTMLElement)
                            .parentElement;
                          if (
                            parent &&
                            !parent.querySelector(".fallback-building-icon")
                          ) {
                            const iconWrap = document.createElement("div");
                            iconWrap.className =
                              "fallback-building-icon text-indigo-500 font-bold text-sm";
                            iconWrap.textContent = (
                              franchiseDetail?.name || activeFranchiseName
                            )
                              .slice(0, 2)
                              .toUpperCase();
                            parent.appendChild(iconWrap);
                          }
                        }}
                      />
                    ) : (
                      <Building2 size={36} className="text-indigo-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {franchiseDetail?.name || activeFranchiseName}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Building2 size={12} /> Franchise
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {franchiseDetail?.description ||
                        "Official franchise partner organization associated with your client account."}
                    </p>
                  </div>
                </div>

                {/* Details Grid (Read-only, clean 2-column) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 pt-6 border-t border-slate-100">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Assigned Member
                    </span>
                    <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                      {clientUser?.name || "Client User"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {clientUser?.email}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Marketing Banners
                    </span>
                    <p className="text-xs font-bold text-slate-900 mt-1">
                      {totalBannerImages} Templates
                    </p>
                    <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
                      Available for customization
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BANNER TEMPLATES FOR USER'S FRANCHISE */}
      {activeTab === "banner-templates" &&
        (viewingTemplate !== null ? (
          /* IN-PAGE EMBEDDED BANNER REVIEW & CUSTOMIZATION (MATCHING SCREENSHOT 2) */
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Top Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/90">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingTemplate(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 h-8 px-2.5 rounded-xl border-slate-200 cursor-pointer flex-shrink-0 bg-white shadow-2xs"
                >
                  <ArrowLeft size={14} /> Back to Banner Templates
                </Button>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">
                  Banner Template Details
                </span>
                {/* <span className="hidden sm:inline-flex items-center rounded-xl bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap">
                  Anyone with this link can review
                </span> */}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Commented out Approved badge on template view */}
                {/* <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  Approved
                </span> */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loadingBanners || refreshingBanners}
                  onClick={() =>
                    loadFranchiseBanners(
                      userFranchiseId ? Number(userFranchiseId) : undefined,
                      true,
                    )
                  }
                  className="h-8 px-3 rounded-xl bg-white text-xs font-semibold flex-shrink-0"
                  title="Refresh Template Data"
                >
                  <RefreshCw
                    size={13}
                    className={
                      refreshingBanners ? "animate-spin text-indigo-600" : ""
                    }
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Template / Project Title & Subtitle */}
            <div className="min-w-0 space-y-1">
              <h1 className="text-2xl sm:text-[1.75rem] font-extrabold text-slate-900 tracking-tight">
                {viewingTemplate.name}
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>
                  Client:{" "}
                  <strong className="text-slate-800 font-semibold">
                    {clientUser?.name || "Client User"}
                  </strong>
                </span>
                <span className="text-slate-300">·</span>
                <span>
                  Designer:{" "}
                  <strong className="text-slate-800 font-semibold">
                    {viewingTemplate.franchiseName ||
                      activeFranchiseName ||
                      "FBS designer - 1"}
                  </strong>
                </span>
                <span className="text-slate-300">·</span>
                <span>
                  Size:{" "}
                  <strong className="text-slate-800 font-semibold font-mono">
                    {viewingTemplate.widthPx} × {viewingTemplate.heightPx} px
                  </strong>
                </span>
              </p>
            </div>

            {/* Two-Column Review Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT COLUMN: Project Banners */}
              <div className="lg:col-span-8 space-y-4">
                <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-indigo-600">
                      BANNER TEMPLATE
                    </h3>
                    {/* <p className="text-[11px] text-slate-400 font-medium">
                      Select variation &amp; preview
                    </p> */}
                  </div>

                  {/* Banner proof container */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4 transition">
                    {/* Banner sub-header */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-[15px] text-slate-900 truncate">
                            {viewingTemplate.name}
                          </h4>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold">
                            <FileImage size={11} /> Banner Template
                          </span>
                          {/* <span className="text-[11px] text-slate-400 font-mono font-semibold">
                            v{activeImageIndex + 1}
                          </span> */}
                        </div>
                        <p className="text-[12px] text-slate-500">
                          {viewingTemplate.description ||
                            "Banner template preview"}
                        </p>
                      </div>
                      {/* Commented out Approved badge on banner preview */}
                      {/* <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={11} className="text-emerald-600" />{" "}
                        Approved
                      </span> */}
                    </div>

                    {/* Banner Main Proof Preview */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2 sm:p-3">
                      <div className="relative h-[220px] sm:h-[320px] md:h-[400px] bg-white rounded-lg overflow-hidden group border border-slate-200/60 flex items-center justify-center p-2">
                        {viewingTemplate.images &&
                        viewingTemplate.images[activeImageIndex] ? (
                          <img
                            src={resolveImageUrl(
                              viewingTemplate.images[activeImageIndex].imageUrl,
                            )}
                            alt={`${viewingTemplate.name} preview`}
                            className="w-full h-full object-contain mx-auto rounded drop-shadow-sm"
                          />
                        ) : (
                          <div className="p-8 text-center text-slate-400">
                            <FileImage
                              size={40}
                              className="mx-auto mb-2 text-slate-300"
                            />
                            <p className="text-xs">
                              No preview image available
                            </p>
                          </div>
                        )}

                        {/* Fullscreen Proof Action Button on hover */}
                        {viewingTemplate.images &&
                          viewingTemplate.images[activeImageIndex] && (
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[1px]">
                              <a
                                href={resolveImageUrl(
                                  viewingTemplate.images[activeImageIndex]
                                    .imageUrl,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="bg-white/95 hover:bg-white shadow cursor-pointer font-semibold text-xs gap-1.5"
                                >
                                  <Maximize2 size={14} /> Fullscreen View
                                </Button>
                              </a>
                            </div>
                          )}

                        {/* <span className="absolute top-2 right-2 bg-slate-900/85 text-white text-[9.5px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-md shadow">
                          v{activeImageIndex + 1}
                        </span> */}

                        {/* <span className="absolute bottom-2 left-2 inline-flex items-center rounded-full bg-slate-100/90 text-slate-600 border border-slate-200 text-[8.5px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 uppercase tracking-wide">
                          WATERMARKED
                        </span> */}
                      </div>
                    </div>

                    {/* Multiple images thumbnail row commented out - show only one image */}
                    {/* 
                    {viewingTemplate.images &&
                      viewingTemplate.images.length > 1 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-slate-600 block">
                            Switch Banner Variation:
                          </span>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {viewingTemplate.images.map((img, idx) => (
                              <button
                                key={img.id || idx}
                                type="button"
                                onClick={() => setActiveImageIndex(idx)}
                                className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition bg-slate-50 ${
                                  activeImageIndex === idx
                                    ? "border-indigo-600 ring-2 ring-indigo-200"
                                    : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                                }`}
                              >
                                <img
                                  src={resolveImageUrl(img.imageUrl)}
                                  alt={`Variation ${idx + 1}`}
                                  className="w-full h-full object-contain p-0.5"
                                />
                                <span className="absolute bottom-0.5 right-1 bg-slate-900/80 text-white text-[9px] px-1 rounded font-mono font-bold">
                                  #{idx + 1}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    */}

                    {/* Banner Technical Specifications */}
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                          Dimensions
                        </span>
                        <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                          {viewingTemplate.widthPx} × {viewingTemplate.heightPx}{" "}
                          px
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                          Orientation
                        </span>
                        <span className="capitalize font-bold text-slate-900 mt-0.5 block">
                          {viewingTemplate.orientation}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                          Franchise
                        </span>
                        <span className="truncate font-bold text-slate-900 mt-0.5 block">
                          {viewingTemplate.franchiseName || activeFranchiseName}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                          Format
                        </span>
                        <span className="font-bold text-slate-900 mt-0.5 block">
                          Banner Template
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Overall Feedback & Customization Form + Activity */}
              <div className="lg:col-span-4 space-y-4">
                {/* Overall Feedback Card (Matching Screenshot 2) */}
                <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Customize Banner
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fill in your franchise details to request this banner.
                    </p>
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

                  {/* Form fields */}
                  <form
                    id="banner-review-customization-form"
                    onSubmit={handleSaveCustomization}
                    className="space-y-3.5"
                  >
                    {viewingTemplate.fields &&
                    viewingTemplate.fields.length > 0 ? (
                      <div className="space-y-3">
                        {viewingTemplate.fields.map((field, fIdx) => {
                          const fieldKey = String(field.id || fIdx);
                          const val = customFieldValues[fieldKey] ?? "";
                          const isReadOnly = field.isEditable === false;

                          return (
                            <div key={fieldKey} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11.5px] font-bold text-slate-700 flex items-center gap-1">
                                  <span>{field.label}</span>
                                  {field.isRequired && (
                                    <span className="text-red-500 font-bold">
                                      *
                                    </span>
                                  )}
                                </label>
                                {isReadOnly && (
                                  <span className="text-[10px] text-slate-400 italic">
                                    Read-only
                                  </span>
                                )}
                              </div>

                              {field.fieldType === "textarea" ? (
                                <Textarea
                                  placeholder={
                                    field.placeholder ||
                                    `Type feedback or changes for ${field.label}...`
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
                                  className="text-xs resize-none bg-slate-50/50 focus:bg-white"
                                  required={field.isRequired}
                                />
                              ) : field.fieldType === "file" ? (
                                <div className="space-y-1.5">
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
                                    className="h-8 text-xs file:mr-2 file:py-0.5 file:px-2 file:rounded-md file:border-0 file:text-[10.5px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                                  />
                                  {typeof val === "string" && val && (
                                    <p className="text-[10.5px] text-slate-500 truncate flex items-center gap-1">
                                      <FileImage
                                        size={11}
                                        className="text-slate-400 flex-shrink-0"
                                      />
                                      <span>
                                        Current: <strong>{val}</strong>
                                      </span>
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <Input
                                  type={
                                    field.fieldType === "number"
                                      ? "number"
                                      : field.fieldType === "email"
                                        ? "email"
                                        : field.fieldType === "phone"
                                          ? "tel"
                                          : "text"
                                  }
                                  placeholder={
                                    field.placeholder ||
                                    `Enter ${field.label}...`
                                  }
                                  value={val}
                                  disabled={isReadOnly}
                                  onChange={(e) =>
                                    setCustomFieldValues((prev) => ({
                                      ...prev,
                                      [fieldKey]: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-xs bg-slate-50/50 focus:bg-white"
                                  required={field.isRequired}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Textarea
                          placeholder="Type feedback or required changes for this banner..."
                          rows={4}
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition resize-none bg-white"
                        />
                      </div>
                    )}

                    {/* Action button: Submit banner customization request */}
                    <div className="pt-2">
                      {/* Commented out proof review buttons:
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          type="button"
                          disabled={savingCustomization}
                          variant="outline"
                          onClick={() => handleSaveCustomization()}
                          className="h-9 px-2 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <AlertCircle size={13} className="text-amber-600" />
                          <span className="truncate">Request Changes</span>
                        </Button>

                        <Button
                          type="submit"
                          disabled={savingCustomization}
                          onClick={() => handleSaveCustomization()}
                          className="h-9 px-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                        >
                          {savingCustomization ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          <span className="truncate">Approve</span>
                        </Button>
                      </div>
                      */}
                      <Button
                        type="submit"
                        disabled={savingCustomization}
                        className="w-full h-10 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {savingCustomization ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                        <span>Submit Banner Request</span>
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Commented out fake approval status history - actual submissions are tracked under 'My Banner Submissions' */}
                {/* 
                <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <History size={13} className="text-slate-400" /> Activity
                      &amp; Status History
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {viewingTemplate.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={10} className="text-emerald-600" />{" "}
                      Approved
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="relative pl-5 space-y-1">
                      <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                      <span className="font-bold text-emerald-700 text-xs block">
                        Approved
                      </span>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-slate-700 text-[11px] leading-relaxed">
                        Approved photo.
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(
                          viewingTemplate.updatedAt || Date.now(),
                        ).toLocaleDateString()}
                        , {clientUser?.name || "Client"}
                      </span>
                    </div>

                    <div className="relative pl-5 space-y-1">
                      <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-100" />
                      <span className="font-bold text-indigo-700 text-xs block">
                        Pending Review
                      </span>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-slate-700 text-[11px] leading-relaxed">
                        Initial banner uploaded
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(
                          viewingTemplate.createdAt || Date.now(),
                        ).toLocaleDateString()}
                        , Designer
                      </span>
                    </div>
                  </div>
                </div>
                */}
              </div>
            </div>
          </div>
        ) : (
          /* TEMPLATES LIST / GRID VIEW (MATCHING SCREENSHOT 1) */
          <div className="space-y-5 max-w-3xl animate-in fade-in duration-200">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 min-w-0">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <Input
                  type="text"
                  placeholder="Search banner templates..."
                  value={bannerSearch}
                  onChange={(e) => setBannerSearch(e.target.value)}
                  className="pl-9 h-10 bg-white shadow-sm text-xs"
                />
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                  <Button
                    variant={bannerViewMode === "grid" ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() => setBannerViewMode("grid")}
                    title="Card View"
                    className={bannerViewMode === "grid" ? "shadow-sm" : ""}
                  >
                    <LayoutGrid size={14} />
                  </Button>
                  <Button
                    variant={bannerViewMode === "list" ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() => setBannerViewMode("list")}
                    title="List View"
                    className={bannerViewMode === "list" ? "shadow-sm" : ""}
                  >
                    <List size={14} />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  disabled={loadingBanners || refreshingBanners}
                  onClick={() =>
                    loadFranchiseBanners(
                      userFranchiseId ? Number(userFranchiseId) : undefined,
                      true,
                    )
                  }
                  title="Refresh Banner Templates"
                >
                  <RefreshCw
                    size={14}
                    className={
                      refreshingBanners ? "animate-spin text-indigo-600" : ""
                    }
                  />
                  {refreshingBanners ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>

            {/* Banner Content Grid / List */}
            {loadingBanners ? (
              <Card className="p-10 text-center text-xs text-slate-500">
                Loading banner templates...
              </Card>
            ) : bannerDisplayItems.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 space-y-2">
                <FileImage size={40} className="mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">
                  No banner templates found.
                </p>
                <p className="text-xs">
                  {bannerSearch
                    ? "No templates match your search criteria."
                    : `No marketing banners have been assigned to ${activeFranchiseName} yet.`}
                </p>
              </Card>
            ) : bannerViewMode === "list" ? (
              /* List View */
              <div className="space-y-2">
                {bannerDisplayItems.map((item) => (
                  <Card
                    key={item.key}
                    onClick={() => {
                      setViewingTemplate(item.template);
                      setActiveImageIndex(item.imageIndex);
                    }}
                    className="p-3.5 transition hover:border-indigo-300 hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm truncate">
                            {item.template.name}
                          </h3>
                          {/* Commented out Approved badge on template */}
                          {/* <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2
                              size={11}
                              className="text-emerald-600"
                            />{" "}
                            Approved
                          </span> */}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          Designer:{" "}
                          <strong className="text-slate-700">
                            {item.template.franchiseName ||
                              activeFranchiseName ||
                              "FBS designer - 1"}
                          </strong>
                          {" · "}
                          Updated{" "}
                          {new Date(
                            item.template.updatedAt ||
                              item.template.createdAt ||
                              Date.now(),
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="portal-action" title="Customize Banner"><Eye size={15} aria-hidden="true" /><span className="sr-only">Customize Banner</span></span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* Grid View (Matching Screenshot 1) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bannerDisplayItems.map((item) => {
                  const effectiveImage = item.imageUrl
                    ? resolveImageUrl(item.imageUrl)
                    : "";

                  return (
                    <Card
                      key={item.key}
                      onClick={() => {
                        setViewingTemplate(item.template);
                        setActiveImageIndex(item.imageIndex);
                      }}
                      className="overflow-hidden transition hover:border-indigo-300 hover:shadow-md p-0 cursor-pointer"
                    >
                      {/* Banner image preview */}
                      <div className="relative aspect-[16/10] bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                        {effectiveImage ? (
                          <img
                            src={effectiveImage}
                            alt={`${item.template.name} preview`}
                            className="w-full h-full object-contain bg-white"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1">
                            <FileImage size={28} />
                            <span className="text-[10px] font-medium text-slate-400">
                              No preview yet
                            </span>
                          </div>
                        )}
                        {/* Commented out Approved badge on banner template card */}
                        {/* <div className="absolute top-2 right-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10.5px] font-semibold">
                            <CheckCircle2
                              size={11}
                              className="text-emerald-600"
                            />{" "}
                            Approved
                          </span>
                        </div> */}
                      </div>

                      <div className="p-3.5 space-y-2">
                        <div className="min-w-0">
                          <h3
                            className="font-extrabold text-slate-900 text-sm truncate"
                            title={item.template.name}
                          >
                            {item.template.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            Designer:{" "}
                            <strong className="text-slate-700">
                              {item.template.franchiseName ||
                                activeFranchiseName ||
                                "FBS designer - 1"}
                            </strong>
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2.5">
                          <span className="text-slate-400 text-[11px]">
                            Updated{" "}
                            {new Date(
                              item.template.updatedAt ||
                                item.template.createdAt ||
                                Date.now(),
                            ).toLocaleDateString()}
                          </span>
                          <span className="portal-action" title="Customize Banner"><Eye size={15} aria-hidden="true" /><span className="sr-only">Customize Banner</span></span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ))}

      {/* TAB 4: MY BANNER SUBMISSIONS */}
      {activeTab === "my-banner-submissions" && (
        <div
          className={`space-y-5 ${threadSubmissionId !== null ? "max-w-6xl w-full" : "max-w-3xl"}`}
        >
          {threadSubmissionId !== null ? (
            /* IN-PAGE EMBEDDED SUBMISSION DETAILS & THREAD (NO POPUP) */
            <BannerSubmissionThreadModal
              submissionId={threadSubmissionId}
              isOpen={true}
              onClose={() => {
                setThreadSubmissionId(null);
                loadMySubmissions(true);
              }}
              role="user"
              currentUserName={clientUser?.name}
              onStatusUpdated={(newStatus) => {
                setMySubmissions((prev) =>
                  prev.map((s) =>
                    s.id === threadSubmissionId
                      ? { ...s, status: newStatus }
                      : s,
                  ),
                );
              }}
              onSubmissionUpdated={() => loadMySubmissions(true)}
              embedded={true}
            />
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <Input
                    type="text"
                    placeholder="Search submission..."
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                    className="pl-9 h-10 bg-white shadow-sm"
                  />
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    <Button
                      variant={
                        submissionListViewMode === "card" ? "default" : "ghost"
                      }
                      size="icon-sm"
                      onClick={() => setSubmissionListViewMode("card")}
                      title="Card View"
                      className={
                        submissionListViewMode === "card" ? "shadow-sm" : ""
                      }
                    >
                      <LayoutGrid size={14} />
                    </Button>
                    <Button
                      variant={
                        submissionListViewMode === "list" ? "default" : "ghost"
                      }
                      size="icon-sm"
                      onClick={() => setSubmissionListViewMode("list")}
                      title="List View"
                      className={
                        submissionListViewMode === "list" ? "shadow-sm" : ""
                      }
                    >
                      <List size={14} />
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    disabled={refreshingMySubmissions || loadingMySubmissions}
                    onClick={() => loadMySubmissions(true)}
                    title="Refresh Submissions"
                  >
                    <RefreshCw
                      size={14}
                      className={
                        refreshingMySubmissions
                          ? "animate-spin text-indigo-600"
                          : ""
                      }
                    />
                    {refreshingMySubmissions ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
              </div>

              {/* Submissions List / Grid */}
              {loadingMySubmissions ? (
                <Card className="p-10 text-center text-xs text-slate-500">
                  Loading your submitted banner requests...
                </Card>
              ) : filteredMySubmissions.length === 0 ? (
                <Card className="p-12 text-center text-slate-400 space-y-2">
                  <FileImage size={40} className="mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">
                    No banner submissions found.
                  </p>
                  <p className="text-xs">
                    {submissionSearch
                      ? "No submissions matched your search query."
                      : "When you submit a banner customization request, it will appear here."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("banner-templates")}
                    className="text-xs mt-2 font-semibold"
                  >
                    Browse Franchise Templates
                  </Button>
                </Card>
              ) : submissionListViewMode === "list" ? (
                <div className="space-y-2">
                  {filteredMySubmissions.map((sub) => (
                    <Card
                      key={sub.id}
                      onClick={() => setThreadSubmissionId(sub.id)}
                      className="p-3.5 transition hover:border-indigo-300 hover:shadow-md cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 text-sm truncate">
                              {sub.templateName}
                            </h3>
                            {getSubmissionStatusBadge(sub.status)}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            Franchise:{" "}
                            <strong className="text-slate-700">
                              {sub.franchiseName ||
                                activeFranchiseName ||
                                "General"}
                            </strong>
                            {" · "}
                            Updated{" "}
                            {new Date(
                              sub.updatedAt || sub.createdAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="portal-action" title="Open Proof"><Eye size={15} aria-hidden="true" /><span className="sr-only">Open Proof</span></span>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredMySubmissions.map((sub) => {
                    return (
                      <Card
                        key={sub.id}
                        onClick={() => setThreadSubmissionId(sub.id)}
                        className="overflow-hidden transition hover:border-indigo-300 hover:shadow-md p-0 cursor-pointer"
                      >
                        {/* Small proof preview */}
                        <div className="relative aspect-[16/10] bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                          {sub.previewImageUrl ? (
                            <img
                              src={resolveImageUrl(sub.previewImageUrl)}
                              alt={`${sub.templateName} preview`}
                              className="w-full h-full object-contain bg-white"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1">
                              <FileImage size={28} />
                              <span className="text-[10px] font-medium text-slate-400">
                                No preview yet
                              </span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            {getSubmissionStatusBadge(sub.status)}
                          </div>
                        </div>

                        <div className="p-3.5 space-y-2">
                          <div className="min-w-0">
                            <h3
                              className="font-extrabold text-slate-900 text-sm truncate"
                              title={sub.templateName}
                            >
                              {sub.templateName}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              Franchise:{" "}
                              <strong className="text-slate-700">
                                {sub.franchiseName ||
                                  activeFranchiseName ||
                                  "General"}
                              </strong>
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2.5">
                            <span className="text-slate-400 text-[11px]">
                              Updated{" "}
                              {new Date(
                                sub.updatedAt || sub.createdAt,
                              ).toLocaleDateString()}
                            </span>
                            <span className="portal-action" title="Open Proof"><Eye size={15} aria-hidden="true" /><span className="sr-only">Open Proof</span></span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* USER SUBMISSION DETAIL MODAL */}
      {selectedMySubmission && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedMySubmission(null);
              setMySubmissionDetail(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-base text-slate-900 truncate">
                    {selectedMySubmission.templateName}
                  </h3>
                  {getSubmissionStatusBadge(selectedMySubmission.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedMySubmission.widthPx} ×{" "}
                  {selectedMySubmission.heightPx} px · Submitted{" "}
                  {new Date(
                    selectedMySubmission.createdAt,
                  ).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMySubmission(null);
                  setMySubmissionDetail(null);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Banner Image Preview */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-950 flex items-center justify-center p-2 min-h-[180px] max-h-[260px]">
                {selectedMySubmission.previewImageUrl ? (
                  <img
                    src={resolveImageUrl(selectedMySubmission.previewImageUrl)}
                    alt={selectedMySubmission.templateName}
                    className="max-h-[240px] w-auto max-w-full object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    <ImageIcon
                      size={28}
                      className="mx-auto mb-1 text-slate-600"
                    />
                    <p className="text-xs">No image preview available</p>
                  </div>
                )}
              </div>

              {/* Submitted Custom Fields */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Your Submitted Custom Fields
                </h4>

                {loadingSubmissionDetail ? (
                  <div className="py-6 text-center space-y-2">
                    <Loader2
                      size={18}
                      className="animate-spin mx-auto text-indigo-600"
                    />
                    <p className="text-xs text-slate-500">Loading details...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mySubmissionDetail?.submittedFields &&
                    mySubmissionDetail.submittedFields.length > 0
                      ? mySubmissionDetail.submittedFields.map(
                          (f: any, idx: number) => {
                            const isFile =
                              f.fieldType === "file" ||
                              (typeof f.value === "string" &&
                                (f.value.startsWith("/uploads/") ||
                                  f.value.match(
                                    /\.(png|jpg|jpeg|svg|webp|pdf)$/i,
                                  )));

                            return (
                              <div
                                key={f.id || idx}
                                className={`p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 ${f.fieldType === "textarea" ? "sm:col-span-2" : ""}`}
                              >
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                  {f.label}
                                </label>
                                {isFile ? (
                                  <a
                                    href={resolveImageUrl(String(f.value))}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                                  >
                                    <ExternalLink size={12} /> View Uploaded
                                    File
                                  </a>
                                ) : (
                                  <p className="text-xs font-semibold text-slate-800 break-words">
                                    {f.value !== undefined &&
                                    f.value !== null &&
                                    String(f.value).trim() !== ""
                                      ? String(f.value)
                                      : "-"}
                                  </p>
                                )}
                              </div>
                            );
                          },
                        )
                      : Object.entries(
                          selectedMySubmission.customizationValues || {},
                        )
                          .filter(
                            ([key]) =>
                              !key.startsWith("_") &&
                              key !== "templateId" &&
                              key !== "franchiseId",
                          )
                          .map(([key, val], idx) => {
                            const isFile =
                              typeof val === "string" &&
                              (val.startsWith("/uploads/") ||
                                val.match(/\.(png|jpg|jpeg|svg|webp|pdf)$/i));

                            return (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1"
                              >
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                  Field #{idx + 1}
                                </label>
                                {isFile ? (
                                  <a
                                    href={resolveImageUrl(String(val))}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                                  >
                                    <ExternalLink size={12} /> View Uploaded
                                    File
                                  </a>
                                ) : (
                                  <p className="text-xs font-semibold text-slate-800 break-words">
                                    {String(val)}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            {selectedMySubmission.previewImageUrl && (
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-start flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDownloadBanner(
                      selectedMySubmission.previewImageUrl,
                      `${selectedMySubmission.templateName}.png`,
                    )
                  }
                  className="text-xs font-semibold gap-1.5 h-8 text-slate-700"
                >
                  <Download size={13} />
                  <span>Download Banner</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
