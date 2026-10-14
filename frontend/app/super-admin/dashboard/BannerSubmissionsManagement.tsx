"use client";

import { useEffect, useState, useMemo } from "react";
import {
  bannerTemplateApi,
  resolveImageUrl,
  type BannerSubmissionListItem,
  type BannerSubmissionDetail,
  type BannerSubmissionStatus,
} from "@/app/lib/client/banner-template-api";
import { franchiseApi, type FranchiseModel } from "@/app/lib/client/franchise";
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
  ImageIcon,
  Loader2,
  Building2,
  Calendar,
  User,
  Inbox,
  Layers,
} from "lucide-react";

const STATUS_OPTIONS: BannerSubmissionStatus[] = [
  "Pending",
  "In Review",
  "Approved",
  "Rejected",
  "Completed",
];

function getStatusBadge(status: string) {
  const norm = (status || "Pending").toLowerCase();
  switch (norm) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
          <CheckCircle size={12} className="text-emerald-500" />
          Approved
        </span>
      );
    case "in review":
    case "in_review":
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

export function BannerSubmissionsManagement() {
  const [submissions, setSubmissions] = useState<BannerSubmissionListItem[]>([]);
  const [franchises, setFranchises] = useState<FranchiseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [franchiseFilter, setFranchiseFilter] = useState("all");

  // Detail Modal State
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<BannerSubmissionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusChoice, setStatusChoice] = useState<string>("Pending");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

      setSubmissions(subsRes.submissions || []);
      setFranchises(franRes || []);
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
      const detail = await bannerTemplateApi.getBannerSubmissionById(id);
      setDetailData(detail);
      if (detail?.status) {
        setStatusChoice(detail.status);
      }
    } catch (err) {
      console.error("Failed to load submission detail:", err);
      setDetailData(null);
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

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="p-6 bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Banner Submissions
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                {submissions.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Review and manage banner customization requests submitted by users.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing || loading}
              onClick={() => loadData(true)}
              className="text-xs font-medium gap-1.5 h-9"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin text-indigo-600" : "text-slate-500"}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <Input
              type="text"
              placeholder="Search by ID, template name, user or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9.5 text-xs bg-slate-50/50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                className="h-9.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[180px] truncate"
              >
                <option value="all">All Franchises</option>
                {franchises.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </Card>

      {/* Submissions Table Card */}
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-xs">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 size={24} className="animate-spin mx-auto text-indigo-600" />
            <p className="text-xs font-semibold text-slate-600">Loading banner submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Inbox size={22} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">No Banner Submissions Found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {search || statusFilter !== "all" || franchiseFilter !== "all"
                  ? "No submissions matched your search or filter criteria. Try clearing filters."
                  : "User-submitted banner customization requests will appear here once submitted."}
              </p>
            </div>
          </div>
        ) : (
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
                {filteredSubmissions.map((sub) => {
                  return (
                    <tr
                      key={sub.id}
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
                            variant="default"
                            size="sm"
                            onClick={() => openSubmissionDetail(sub.id)}
                            className="text-xs h-7.5 px-2.5 gap-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs font-semibold"
                          >
                            <Eye size={12} />
                            <span>View Details</span>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* ADMIN SUBMISSION DETAILS MODAL                                            */}
      {/* Required Display:                                                        */}
      {/* 1. Banner Name                                                           */}
      {/* 2. Width and Height (e.g. 1920 × 1080 px)                                */}
      {/* 3. Banner Image/Preview                                                  */}
      {/* 4. User-Submitted Input Fields (Dynamically displayed)                    */}
      {/* ========================================================================= */}
      {selectedSubmissionId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-shrink-0 bg-slate-50/50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-lg text-slate-900 tracking-tight truncate">
                    {detailData?.templateName || `Banner Submission #${selectedSubmissionId}`}
                  </h3>
                  {detailData && getStatusBadge(detailData.status)}
                </div>
                {/* Width and Height display */}
                {detailData && (
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {detailData.widthPx} × {detailData.heightPx} px
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedSubmissionId(null);
                  setDetailData(null);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingDetail ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 size={24} className="animate-spin mx-auto text-indigo-600" />
                  <p className="text-xs font-semibold text-slate-600">
                    Loading submission details...
                  </p>
                </div>
              ) : !detailData ? (
                <div className="py-12 text-center text-red-600 text-xs font-semibold">
                  Failed to load submission details.
                </div>
              ) : (
                <>
                  {/* Status update alert banner if present */}
                  {statusMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                        statusMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      {statusMessage.type === "success" ? (
                        <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle size={15} className="text-red-600 flex-shrink-0" />
                      )}
                      <span>{statusMessage.text}</span>
                    </div>
                  )}

                  {/* 3. Banner Image / Preview (Exact User-Submitted Banner Image) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Banner Preview
                      </span>
                    </div>

                    <div className="w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center p-2 relative group min-h-[220px]">
                      {detailData.previewImageUrl ? (
                        <img
                          src={resolveImageUrl(detailData.previewImageUrl)}
                          alt={detailData.templateName}
                          className="max-h-[340px] w-auto max-w-full object-contain rounded-lg shadow-sm"
                        />
                      ) : (
                        <div className="py-12 text-center text-slate-400 space-y-2">
                          <ImageIcon size={32} className="mx-auto text-slate-600" />
                          <p className="text-xs">No banner image uploaded for this template.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. User-Submitted Input Fields (Dynamically rendered) */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        User-Submitted Input Fields
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {detailData.submittedFields?.length || 0} Fields
                      </span>
                    </div>

                    {(!detailData.submittedFields || detailData.submittedFields.length === 0) ? (
                      <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/60 text-center text-slate-400 text-xs">
                        No custom fields were submitted for this banner.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {detailData.submittedFields.map((field, fIdx) => {
                          const val = field.value;
                          const isFile =
                            field.fieldType === "file" ||
                            (typeof val === "string" &&
                              (val.startsWith("/uploads/") ||
                                val.match(/\.(png|jpg|jpeg|svg|webp|pdf)$/i)));

                          return (
                            <div
                              key={field.id || fIdx}
                              className={`p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5 ${
                                field.fieldType === "textarea" ? "sm:col-span-2" : ""
                              }`}
                            >
                              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                                {field.label}
                              </label>

                              {isFile ? (
                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <span className="text-xs font-semibold text-slate-800 truncate flex items-center gap-1.5">
                                    <FileText size={14} className="text-indigo-600 flex-shrink-0" />
                                    <span className="truncate">{String(val).split("/").pop()}</span>
                                  </span>
                                  {val && val !== "-" && (
                                    <a
                                      href={resolveImageUrl(String(val))}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs flex-shrink-0"
                                    >
                                      <ExternalLink size={11} /> View File
                                    </a>
                                  )}
                                </div>
                              ) : typeof val === "boolean" ? (
                                <div className="text-xs font-semibold text-slate-900 pt-0.5">
                                  {val ? (
                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                                      Yes / Confirmed
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">No</span>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs font-semibold text-slate-900 whitespace-pre-wrap break-words pt-0.5">
                                  {val !== undefined && val !== null && String(val).trim() !== ""
                                    ? String(val)
                                    : <span className="text-slate-400 italic font-normal">None provided</span>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
              {/* Left: Download banner image button */}
              <div>
                {detailData?.previewImageUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDownloadBanner(
                        detailData.previewImageUrl,
                        `${detailData.templateName}-banner.png`,
                      )
                    }
                    className="text-xs font-semibold gap-1.5 h-8.5 text-slate-700"
                  >
                    <Download size={13} />
                    <span>Download Banner Image</span>
                  </Button>
                )}
              </div>

              {/* Right: Status dropdown & update + close */}
              <div className="flex items-center gap-2 justify-end">
                {detailData && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={statusChoice}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={updatingStatus}
                      className="h-8.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          Status: {st}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSubmissionId(null);
                    setDetailData(null);
                  }}
                  className="text-xs font-semibold h-8.5 px-4"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
