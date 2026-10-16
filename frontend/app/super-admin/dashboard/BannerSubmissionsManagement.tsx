"use client";
import { DetailRow } from "@/app/Components/ui/detail-row";

import { useEffect, useState, useMemo, Fragment } from "react";
import {
  bannerTemplateApi,
  resolveImageUrl,
  type BannerSubmissionListItem,
  type BannerSubmissionDetail,
  type BannerSubmissionStatus,
  type BannerSubmissionFile,
} from "@/app/lib/client/banner-template-api";
import { franchiseApi, type FranchiseModel } from "@/app/lib/client/franchise";
import { BannerSubmissionThreadModal } from "@/app/user/dashboard/BannerSubmissionThreadModal";
import {
  Card,
  CardHeader,
  Button,
  Input,
  Badge,
} from "@/app/Components/ui";
import {
  Search,
  RefreshCw,
  Eye,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle,
  X,
  ExternalLink,
  FileText,
  FileImage,
  ImageIcon,
  Loader2,
  Building2,
  Calendar,
  User,
  Inbox,
  Layers,
  LayoutGrid,
  List,
  Maximize2,
  Edit3,
  Share2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const STATUS_OPTIONS: BannerSubmissionStatus[] = [
  "Pending",
  "In Review",
  "Changes Requested",
  "Approved",
  "Rejected",
  "Completed",
];

function getStatusBadge(status: string) {
  const norm = (status || "Pending").toLowerCase().replace(/_/g, " ");
  switch (norm) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
          <Clock size={12} className="text-blue-500" />
          In Review
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/60 shadow-2xs">
          <XCircle size={12} className="text-red-500" />
          Rejected
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 shadow-2xs">
          <CheckCircle2 size={12} className="text-purple-500" />
          Completed
        </span>
      );
    case "pending":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 shadow-2xs">
          <Clock size={12} className="text-amber-500" />
          Pending
        </span>
      );
  }
}

export interface ClientBannerSubmissionsGroup {
  userId: number;
  userName: string;
  userEmail: string;
  franchiseId: number | null;
  franchiseName: string | null;
  orders: BannerSubmissionListItem[];
  totalOrders: number;
}

export function BannerSubmissionsManagement() {
  const [submissions, setSubmissions] = useState<BannerSubmissionListItem[]>([]);
  const [franchises, setFranchises] = useState<FranchiseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [franchiseFilter, setFranchiseFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"canvas" | "table">("table");
  const [expandedClients, setExpandedClients] = useState<Record<number, boolean>>({});

  function toggleClientExpand(userId: number) {
    setExpandedClients((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  }

  // Selected Submission Workspace State
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [selectedSubmissionFiles, setSelectedSubmissionFiles] = useState<BannerSubmissionFile[]>([]);
  const [threadSubmissionId, setThreadSubmissionId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<BannerSubmissionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusChoice, setStatusChoice] = useState<string>("Pending");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; name: string; version?: number } | null>(null);

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [subsRes, franRes] = await Promise.all([
        bannerTemplateApi.getBannerSubmissions({
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          franchiseId: franchiseFilter !== "all" ? Number(franchiseFilter) : undefined,
        }),
        franchiseApi.getFranchises().catch(() => []),
      ]);

      const fetchedSubs = subsRes.submissions || [];
      setSubmissions(fetchedSubs);
      setFranchises(franRes || []);

      // If in canvas view and nothing selected yet or selected id not in list, select first
      if (fetchedSubs.length > 0) {
        if (!selectedSubmissionId || !fetchedSubs.some((s) => s.id === selectedSubmissionId)) {
          openSubmissionDetail(fetchedSubs[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load banner submissions:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, franchiseFilter]);

  async function openSubmissionDetail(id: number) {
    setSelectedSubmissionId(id);
    setLoadingDetail(true);
    setStatusMessage(null);

    try {
      const [detail, thread] = await Promise.all([
        bannerTemplateApi.getBannerSubmissionById(id),
        bannerTemplateApi.getBannerSubmissionThread(id).catch(() => null),
      ]);

      setDetailData(detail);
      if (detail?.status) {
        setStatusChoice(detail.status);
      }
      if (thread?.files) {
        setSelectedSubmissionFiles(thread.files);
      } else {
        setSelectedSubmissionFiles([]);
      }
    } catch (err) {
      console.error("Failed to load submission detail:", err);
      setDetailData(null);
      setSelectedSubmissionFiles([]);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!selectedSubmissionId) return;
    setUpdatingStatus(true);
    setStatusMessage(null);

    try {
      await bannerTemplateApi.updateBannerSubmissionStatus(selectedSubmissionId, newStatus);
      setStatusChoice(newStatus);
      setStatusMessage({ type: "success", text: `Status updated to ${newStatus}` });

      setSubmissions((prev) =>
        prev.map((s) => (s.id === selectedSubmissionId ? { ...s, status: newStatus } : s)),
      );
      if (detailData) {
        setDetailData({ ...detailData, status: newStatus });
      }
    } catch (err: any) {
      console.error("Status update failed:", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to update submission status.",
      });
    } finally {
      setUpdatingStatus(false);
    }
  }

  function handleDownloadBanner(imgUrl?: string | null, name?: string) {
    if (!imgUrl) return;
    const fullUrl = resolveImageUrl(imgUrl);
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = name || "banner.png";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (statusFilter !== "all" && sub.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (
        franchiseFilter !== "all" &&
        sub.franchiseId &&
        Number(sub.franchiseId) !== Number(franchiseFilter)
      ) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesId = String(sub.id).includes(q);
        const matchesTpl = sub.templateName.toLowerCase().includes(q);
        const matchesUser = sub.userName.toLowerCase().includes(q);
        const matchesEmail = sub.userEmail.toLowerCase().includes(q);
        const matchesFran = (sub.franchiseName || "").toLowerCase().includes(q);
        return matchesId || matchesTpl || matchesUser || matchesEmail || matchesFran;
      }
      return true;
    });
  }, [submissions, statusFilter, franchiseFilter, search]);

  const groupedSubmissions = useMemo<ClientBannerSubmissionsGroup[]>(() => {
    const map = new Map<number, ClientBannerSubmissionsGroup>();

    for (const sub of filteredSubmissions) {
      const uId = sub.userId;
      if (!map.has(uId)) {
        map.set(uId, {
          userId: uId,
          userName: sub.userName || "Unknown Client",
          userEmail: sub.userEmail || "",
          franchiseId: sub.franchiseId ?? null,
          franchiseName: sub.franchiseName ?? null,
          orders: [],
          totalOrders: 0,
        });
      }

      const group = map.get(uId)!;
      group.orders.push(sub);
      group.totalOrders += 1;
      if (!group.franchiseName && sub.franchiseName) {
        group.franchiseName = sub.franchiseName;
        group.franchiseId = sub.franchiseId ?? null;
      }
    }

    return Array.from(map.values());
  }, [filteredSubmissions]);

  const selectedSubmission = useMemo(() => {
    return filteredSubmissions.find((s) => s.id === selectedSubmissionId) || submissions.find((s) => s.id === selectedSubmissionId) || null;
  }, [filteredSubmissions, submissions, selectedSubmissionId]);

  return (
    <div className="space-y-6">
      {/* Top Toolbar: Search, Filters, Refresh & View Mode */}
      <Card className="p-4 sm:p-5 bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
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
              className="pl-9.5 h-10 text-xs bg-slate-50/60 border-slate-200 focus:bg-white rounded-xl"
            />
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode Switcher (Matching Canvas UI) */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <Button
                variant={viewMode === "canvas" ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("canvas")}
                title="Canvas Split View"
                className={`h-8 w-8 rounded-lg cursor-pointer ${
                  viewMode === "canvas" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid size={14} />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("table")}
                title="Table List View"
                className={`h-8 w-8 rounded-lg cursor-pointer ${
                  viewMode === "table" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <List size={14} />
              </Button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st.toLowerCase()}>
                  {st}
                </option>
              ))}
            </select>

            {/* Franchise Filter */}
            {franchises.length > 0 && (
              <select
                value={franchiseFilter}
                onChange={(e) => setFranchiseFilter(e.target.value)}
                className="h-9.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[170px] truncate shadow-2xs"
              >
                <option value="all">All Franchises</option>
                {franchises.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing || loading}
              onClick={() => loadData(true)}
              className="text-xs font-semibold gap-1.5 h-9.5 rounded-xl border-slate-200 shadow-2xs"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin text-indigo-600" : "text-slate-500"}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading ? (
        <Card className="p-16 text-center space-y-3 bg-white border-slate-200/80">
          <Loader2 size={26} className="animate-spin mx-auto text-indigo-600" />
          <p className="text-xs font-semibold text-slate-600">Loading banner submissions...</p>
        </Card>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="p-16 text-center space-y-3 bg-white border-slate-200/80">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Inbox size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">No Banner Submissions Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== "all" || franchiseFilter !== "all"
                ? "No submissions matched your search or filter criteria. Try clearing filters."
                : "Banner customization requests submitted by clients will appear here."}
            </p>
          </div>
        </Card>
      ) : viewMode === "canvas" ? (
        /* ========================================================================= */
        /* TWO-COLUMN CANVAS WORKSPACE VIEW (MATCHING CANVAS UI SCREENSHOT)          */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Submissions Grouped by Client (col-span-4) */}
          <div className="lg:col-span-4 space-y-3.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {groupedSubmissions.map((group) => {
              const isExpanded = Boolean(expandedClients[group.userId]);
              const containsSelected = group.orders.some((o) => o.id === selectedSubmissionId);

              return (
                <Card
                  key={group.userId}
                  className={`overflow-hidden transition-all rounded-2xl bg-white border ${
                    containsSelected
                      ? "border-indigo-400 ring-2 ring-indigo-500/15 shadow-md"
                      : "border-slate-200/90 shadow-2xs hover:border-slate-300"
                  }`}
                >
                  {/* Client Group Header */}
                  <div
                    onClick={() => toggleClientExpand(group.userId)}
                    className={`p-3 bg-gradient-to-r from-slate-50/90 via-slate-50/50 to-white flex items-center justify-between gap-2.5 cursor-pointer select-none hover:bg-slate-100/60 transition ${
                      isExpanded ? "border-b border-slate-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                        {group.userName ? group.userName.charAt(0).toUpperCase() : "C"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 text-xs truncate">
                            {group.userName}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {group.userEmail}
                        </p>
                        {group.franchiseName && (
                          <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-medium mt-0.5">
                            <Building2 size={10} className="text-slate-400 flex-shrink-0" />
                            <span>{group.franchiseName}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 shadow-2xs">
                        <Layers size={11} className="text-indigo-500" />
                        <span>{group.totalOrders} {group.totalOrders === 1 ? "Order" : "Orders"}</span>
                        {isExpanded ? <ChevronUp size={13} className="text-indigo-500 ml-0.5" /> : <ChevronDown size={13} className="text-indigo-500 ml-0.5" />}
                      </span>
                    </div>
                  </div>

                  {/* Associated Orders for this client (collapsed by default) */}
                  {isExpanded && (
                    <div className="p-2 space-y-2 bg-slate-50/30">
                      {group.orders.map((order) => {
                        const isSelected = selectedSubmissionId === order.id;

                        return (
                          <div
                            key={order.id}
                            onClick={() => openSubmissionDetail(order.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-white border-indigo-500 ring-2 ring-indigo-500/15 shadow-sm"
                                : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Order Thumbnail Preview */}
                              <div className="w-12 h-11 rounded-lg bg-slate-100 border border-slate-200/80 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                                {order.previewImageUrl ? (
                                  <img
                                    src={resolveImageUrl(order.previewImageUrl)}
                                    alt={order.templateName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FileImage size={16} className="text-slate-400" />
                                )}
                              </div>

                              {/* Order Info */}
                              <div className="min-w-0 flex-1">
                                <h4
                                  className="font-bold text-slate-900 text-xs truncate"
                                  title={order.templateName}
                                >
                                  {order.templateName}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-slate-500">
                                  <span className="font-mono font-medium">
                                    {order.widthPx} × {order.heightPx} px
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <span className="capitalize">{order.orientation}</span>
                                  <span className="text-slate-300">·</span>
                                  <span className="font-bold text-indigo-600">Qty: {order.quantity || 1}</span>
                                </div>
                              </div>
                            </div>

                            {/* Order Footer: Status, Date, Actions */}
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {getStatusBadge(order.status)}
                                <span className="text-slate-400 text-[10px]">
                                  {new Date(order.updatedAt || order.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              {order.previewImageUrl && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadBanner(
                                        order.previewImageUrl,
                                        `${order.templateName}.png`,
                                      );
                                    }}
                                    title="Download Banner"
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                  >
                                    <Download size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Right Column: Selected Submission Workspace (col-span-8) */}
          <div className="lg:col-span-8 space-y-4 min-h-[560px]">
            {selectedSubmission ? (
              <>
                {/* Header Card */}
                <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xs">
                  <CardHeader className="p-4 sm:p-5 space-y-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        {detailData?.templateName || selectedSubmission.templateName}
                      </h2>
                      {detailData && getStatusBadge(detailData.status)}
                    </div>
                  </CardHeader>
                </Card>

                {/* Banners / Photo Tiles Card */}
                <Card className="p-5 space-y-4 rounded-2xl border-slate-200/90 bg-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      PROJECT BANNERS (
                      {selectedSubmissionFiles.length > 0
                        ? selectedSubmissionFiles.length
                        : selectedSubmission.previewImageUrl
                        ? 1
                        : 0}
                      )
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {selectedSubmissionFiles.length > 0
                        ? `${selectedSubmissionFiles.length} photo tile${selectedSubmissionFiles.length > 1 ? "s" : ""} uploaded`
                        : "Main proof banner"}
                    </span>
                  </div>

                  {loadingDetail ? (
                    <div className="py-16 text-center space-y-3">
                      <Loader2 size={24} className="animate-spin mx-auto text-indigo-600" />
                      <p className="text-xs font-semibold text-slate-500">Loading banners...</p>
                    </div>
                  ) : selectedSubmissionFiles.length > 0 ? (
                    /* Grid of individual photo tiles/banners */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedSubmissionFiles.map((file, idx) => {
                        const thumb = resolveImageUrl(file.fileUrl);
                        const versionNum = file.version || 1;

                        return (
                          <Card
                            key={file.id}
                            className="p-3.5 space-y-3 transition hover:shadow-md hover:border-slate-300 rounded-2xl bg-white border-slate-200 group"
                          >
                            {/* Banner Preview Container */}
                            <div className="aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden relative group border border-slate-100 flex items-center justify-center">
                              <img
                                src={thumb}
                                alt={file.fileName || `Photo #${idx + 1}`}
                                className="w-full h-full object-contain bg-white"
                              />

                              {/* Hover Fullscreen Overlay */}
                              <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[1px]">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="bg-white/95 hover:bg-white shadow text-xs font-bold gap-1.5 rounded-lg"
                                  onClick={() =>
                                    setFullscreenImage({
                                      url: thumb,
                                      name: file.fileName || `Photo #${idx + 1}`,
                                      version: versionNum,
                                    })
                                  }
                                  title="View Fullscreen Proof"
                                >
                                  <Maximize2 size={13} /> Fullscreen
                                </Button>
                              </div>

                              {/* Version Badge (Matching Screenshot) */}
                              <span className="absolute top-2 right-2 bg-slate-900/85 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow">
                                v{versionNum}
                              </span>
                            </div>

                            {/* Tile Title & Status */}
                            <div className="flex items-center justify-between pt-1">
                              <span
                                className="font-extrabold text-slate-900 text-xs truncate"
                                title={file.fileName || `Photo #${idx + 1}`}
                              >
                                {file.fileName || `Photo #${idx + 1}`}
                              </span>
                              {detailData && getStatusBadge(detailData.status)}
                            </div>

                            <div className="space-y-1 text-[11px] text-slate-500 pt-1">
                              <div>
                                Client:{" "}
                                <strong className="text-slate-800">
                                  {detailData?.userName || selectedSubmission.userName}
                                </strong>
                                {(detailData?.userEmail || selectedSubmission.userEmail) && (
                                  <span className="text-slate-400 ml-1">
                                    ({detailData?.userEmail || selectedSubmission.userEmail})
                                  </span>
                                )}
                              </div>
                              {selectedSubmission.franchiseName && (
                                <div className="flex items-center gap-1">
                                  <Building2 size={11} className="text-slate-400" />
                                  <span>Franchise: </span>
                                  <strong className="text-slate-700">{selectedSubmission.franchiseName}</strong>
                                </div>
                              )}
                              <div>
                                Dimensions:{" "}
                                <span className="font-mono text-indigo-600 font-bold">
                                  {selectedSubmission.widthPx} × {selectedSubmission.heightPx} px
                                </span>
                              </div>
                              <div>
                                Quantity:{" "}
                                <strong className="text-slate-800">
                                  {selectedSubmission.quantity || 1}{" "}
                                  {Number(selectedSubmission.quantity || 1) > 1
                                    ? "Banners"
                                    : "Banner"}
                                </strong>
                              </div>
                              <div>
                                Uploaded by: <strong className="text-slate-600">{file.uploadedBy || "Client"}</strong>
                              </div>
                            </div>

                            {/* Bottom Actions - Button */}
                            <div className="pt-2 border-t border-slate-100">
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs cursor-pointer"
                                onClick={() => setThreadSubmissionId(selectedSubmission.id)}
                              >
                                <Edit3 size={13} /> View / Edit Banner
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : selectedSubmission.previewImageUrl ? (
                    /* Main Banner Proof Canvas */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card className="p-3.5 space-y-3 rounded-2xl bg-white border-slate-200 transition hover:shadow-md hover:border-slate-300 group">
                        <div className="aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden relative group border border-slate-100 flex items-center justify-center">
                          <img
                            src={resolveImageUrl(selectedSubmission.previewImageUrl)}
                            alt={selectedSubmission.templateName}
                            className="w-full h-full object-contain bg-white"
                          />
                          <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[1px]">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-white/95 hover:bg-white shadow text-xs font-bold gap-1.5 rounded-lg"
                              onClick={() =>
                                setFullscreenImage({
                                  url: resolveImageUrl(selectedSubmission.previewImageUrl),
                                  name: selectedSubmission.templateName,
                                  version: 1,
                                })
                              }
                            >
                              <Maximize2 size={13} /> Fullscreen
                            </Button>
                          </div>
                          <span className="absolute top-2 right-2 bg-slate-900/85 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow">
                            v1
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="font-extrabold text-slate-900 text-xs truncate">
                            {selectedSubmission.templateName}
                          </span>
                          {detailData && getStatusBadge(detailData.status)}
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-500 pt-1">
                          <div>
                            Client:{" "}
                            <strong className="text-slate-800">
                              {detailData?.userName || selectedSubmission.userName}
                            </strong>
                            {(detailData?.userEmail || selectedSubmission.userEmail) && (
                              <span className="text-slate-400 ml-1">
                                ({detailData?.userEmail || selectedSubmission.userEmail})
                              </span>
                            )}
                          </div>
                          {selectedSubmission.franchiseName && (
                            <div className="flex items-center gap-1">
                              <Building2 size={11} className="text-slate-400" />
                              <span>Franchise: </span>
                              <strong className="text-slate-700">{selectedSubmission.franchiseName}</strong>
                            </div>
                          )}
                          <div>
                            Dimensions:{" "}
                            <span className="font-mono text-indigo-600 font-bold">
                              {selectedSubmission.widthPx} × {selectedSubmission.heightPx} px
                            </span>
                          </div>
                          <div>
                            Quantity:{" "}
                            <strong className="text-slate-800">
                              {selectedSubmission.quantity || 1}{" "}
                              {Number(selectedSubmission.quantity || 1) > 1
                                ? "Banners"
                                : "Banner"}
                            </strong>
                          </div>
                        </div>

                        {/* Bottom Actions - Button */}
                        <div className="pt-2 border-t border-slate-100">
                          <Button
                            size="sm"
                            className="h-8 gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs cursor-pointer"
                            onClick={() => setThreadSubmissionId(selectedSubmission.id)}
                          >
                            <Edit3 size={13} /> View / Edit Banner
                          </Button>
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-2xl">
                      <FileImage size={36} className="mx-auto text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No banners yet</p>
                      <p className="text-xs">No proof or photo files attached yet.</p>
                    </div>
                  )}
                </Card>


              </>
            ) : (
              <div className="py-20 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-2xl bg-white">
                <Inbox size={32} className="mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">Select a submission</p>
                <p className="text-xs">Choose a banner submission from the left to view banners.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* TRADITIONAL DATA TABLE VIEW (FOR TOGGLE VIEW)                             */
        /* ========================================================================= */
        <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-xs rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Preview</th>
                  <th className="py-3.5 px-4">Banner Template</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Franchise</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedSubmissions.map((group) => {
                  return (
                    <Fragment key={group.userId}>
                      {/* Client Section Header Row */}
                      <tr className="bg-slate-50/90 border-t-2 border-b border-slate-200">
                        <td colSpan={8} className="py-2.5 px-4">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[10px] flex items-center justify-center shadow-2xs">
                                {group.userName ? group.userName.charAt(0).toUpperCase() : "C"}
                              </div>
                              <span className="font-extrabold text-slate-900 text-xs">{group.userName}</span>
                              <span className="text-slate-400 text-xs">({group.userEmail})</span>
                              {group.franchiseName && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                  <Building2 size={10} className="text-slate-400" />
                                  {group.franchiseName}
                                </span>
                              )}
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Layers size={10} className="text-indigo-500" />
                              {group.totalOrders} {group.totalOrders === 1 ? "Order" : "Orders"}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Orders for this client */}
                      {group.orders.map((sub) => (
                        <DetailRow
                          key={sub.id}
                          aria-label={`View ${sub.templateName} submission ${sub.id}`}
                          onClick={() => { openSubmissionDetail(sub.id); setViewMode("canvas"); }}
                          className="hover:bg-slate-50/50 transition duration-150 group"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                            #{sub.id}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="w-14 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                              {sub.previewImageUrl ? (
                                <img
                                  src={resolveImageUrl(sub.previewImageUrl)}
                                  alt={sub.templateName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon size={18} className="text-slate-400" />
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div className="font-bold text-slate-900 text-xs">
                              {sub.templateName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              {sub.widthPx} × {sub.heightPx} px
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{sub.userName}</div>
                            <div className="text-[11px] text-slate-400">{sub.userEmail}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                              <Building2 size={12} className="text-slate-400" />
                              {sub.franchiseName || "General / Unassigned"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(sub.createdAt).toLocaleDateString()}{" "}
                            <span className="text-slate-400 text-[10px]">
                              {new Date(sub.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {getStatusBadge(sub.status)}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => {
                                  openSubmissionDetail(sub.id);
                                  setViewMode("canvas");
                                }}
                                className="portal-action"
                               title="Canvas View" aria-label="Canvas View">
                      <Eye size={15} aria-hidden="true" />
                    </Button>

                              <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => setThreadSubmissionId(sub.id)}
                                className="portal-action"
                               title="Revisions" aria-label="Revisions">
                      <Edit3 size={15} aria-hidden="true" />
                    </Button>

                              {sub.previewImageUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDownloadBanner(
                                      sub.previewImageUrl,
                                      `${sub.templateName}-submission-${sub.id}.png`,
                                    )
                                  }
                                  title="Download Banner Template"
                                  className="text-xs h-7.5 w-7.5 p-0 text-slate-600"
                                >
                                  <Download size={12} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </DetailRow>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* BANNER SUBMISSION THREAD MODAL (EDIT CANVAS / REVISIONS)                  */}
      {/* ========================================================================= */}
      {threadSubmissionId !== null && (
        <BannerSubmissionThreadModal
          submissionId={threadSubmissionId}
          isOpen={true}
          onClose={() => {
            setThreadSubmissionId(null);
            if (selectedSubmissionId) {
              openSubmissionDetail(selectedSubmissionId);
            }
            loadData(true);
          }}
          role="admin"
        />
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN IMAGE LIGHTBOX MODAL                                           */}
      {/* ========================================================================= */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setFullscreenImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>
            <img
              src={fullscreenImage.url}
              alt={fullscreenImage.name}
              className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl bg-slate-900 border border-slate-800"
            />
            <div className="mt-3 text-center text-white text-xs font-bold flex items-center gap-2">
              <span>{fullscreenImage.name}</span>
              {fullscreenImage.version && (
                <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-[10px]">
                  v{fullscreenImage.version}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
