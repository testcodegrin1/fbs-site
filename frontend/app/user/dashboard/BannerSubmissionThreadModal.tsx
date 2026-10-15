"use client";

import { useEffect, useState, useRef } from "react";
import {
  bannerTemplateApi,
  resolveImageUrl,
  type BannerSubmissionDetail,
  type BannerSubmissionFile,
  type BannerSubmissionMessage,
  type BannerSubmissionStatus,
} from "@/app/lib/client/banner-template-api";
import { Button, Input, Textarea, Badge } from "@/app/Components/ui";
import {
  X,
  Eye,
  RefreshCw,
  Plus,
  Upload,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle,
  Download,
  Loader2,
  LayoutGrid,
  FileImage,
  History,
  Lock,
  ChevronDown,
  ChevronUp,
  User,
  Send,
  ExternalLink,
  FileText,
  ArrowLeft,
} from "lucide-react";

interface BannerSubmissionThreadModalProps {
  submissionId: number | null;
  isOpen: boolean;
  onClose: () => void;
  role: "user" | "admin" | "designer" | "super_admin";
  currentUserName?: string;
  onStatusUpdated?: (newStatus: string) => void;
  onSubmissionUpdated?: () => void;
  embedded?: boolean;
}

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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle size={12} className="text-emerald-500" />
          Approved
        </span>
      );
    case "changes requested":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300">
          <AlertCircle size={12} className="text-amber-500" />
          Changes Requested
        </span>
      );
    case "in review":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock size={12} className="text-blue-500" />
          In Review
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
          <XCircle size={12} className="text-red-500" />
          Rejected
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <CheckCircle2 size={12} className="text-purple-500" />
          Completed
        </span>
      );
    case "pending":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50/70 text-amber-800 border border-amber-200">
          <Clock size={12} className="text-amber-500" />
          Pending
        </span>
      );
  }
}

export function BannerSubmissionThreadModal({
  submissionId,
  isOpen,
  onClose,
  role,
  currentUserName,
  onStatusUpdated,
  onSubmissionUpdated,
  embedded = false,
}: BannerSubmissionThreadModalProps) {
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState<BannerSubmissionDetail | null>(
    null,
  );
  const [files, setFiles] = useState<BannerSubmissionFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [messages, setMessages] = useState<BannerSubmissionMessage[]>([]);

  // Per-photo reply drafts: key = file.id
  const [tileReplies, setTileReplies] = useState<Record<number, string>>({});
  const [sendingReplyKey, setSendingReplyKey] = useState<number | null>(null);

  // Overall note draft
  const [overallNote, setOverallNote] = useState("");
  const [sendingOverallNote, setSendingOverallNote] = useState(false);

  // File replacement state
  const [replacingFileId, setReplacingFileId] = useState<number | null>(null);

  // Add new photo state
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [addingPhoto, setAddingPhoto] = useState(false);

  // Expanded version history map
  const [expandedHistories, setExpandedHistories] = useState<
    Record<number, boolean>
  >({});

  // Fullscreen viewer state
  const [fullscreenImage, setFullscreenImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Collapsible form fields state
  const [showCustomFields, setShowCustomFields] = useState(false);

  // Status updating state (admin / designer)
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load thread data
  async function loadThread(isSilent = false) {
    if (!submissionId) return;
    if (!isSilent) setLoading(true);

    try {
      const data =
        await bannerTemplateApi.getBannerSubmissionThread(submissionId);
      if (data) {
        setSubmission(data.submission);
        setFiles(data.files || []);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load banner submission thread:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen && submissionId) {
      loadThread();
      setTileReplies({});
      setOverallNote("");
      setNewPhotoFile(null);
      setNewPhotoCaption("");
      setStatusMessage(null);
    }
  }, [isOpen, submissionId]);

  if (!isOpen || !submissionId) return null;

  const isReadOnly =
    submission?.status === "Approved" || submission?.status === "Completed";

  const isStaff =
    role === "admin" || role === "designer" || role === "super_admin";

  // Handle send message & user review actions (matching Canvas: user requests changes or approves)
  async function handleSendMessage(
    imageId: number | null = null,
    statusAction?: "approved" | "changes_requested",
  ) {
    if (!submissionId) return;
    let text =
      imageId !== null
        ? (tileReplies[imageId] || "").trim()
        : overallNote.trim();

    if (statusAction === "changes_requested" && !text) {
      alert(
        "Please type a note or explanation of what changes are required before requesting changes.",
      );
      return;
    }

    if (statusAction === "approved" && !text) {
      text = "Approved banner proof.";
    }

    if (!text) return;

    if (imageId !== null) {
      setSendingReplyKey(imageId);
    } else {
      setSendingOverallNote(true);
    }

    try {
      const newMsg = await bannerTemplateApi.sendBannerSubmissionMessage(
        submissionId,
        text,
        imageId,
        statusAction,
      );

      // Append locally and refresh thread silently
      setMessages((prev) => [...prev, newMsg]);

      if (imageId !== null) {
        setTileReplies((prev) => ({ ...prev, [imageId]: "" }));
      } else {
        setOverallNote("");
      }

      // Update status if user requested changes or approved
      let newStatus = submission?.status;
      if (statusAction === "approved") {
        newStatus = "Approved";
      } else if (statusAction === "changes_requested") {
        newStatus = "Changes Requested";
      } else if (
        !isStaff &&
        submission &&
        submission.status !== "Approved" &&
        submission.status !== "Completed"
      ) {
        newStatus = "In Review";
      }

      if (submission && newStatus && newStatus !== submission.status) {
        setSubmission({ ...submission, status: newStatus });
        onStatusUpdated?.(newStatus);
      }

      onSubmissionUpdated?.();
      await loadThread(true);
    } catch (err: any) {
      alert(err?.message || "Failed to post message.");
    } finally {
      if (imageId !== null) setSendingReplyKey(null);
      else setSendingOverallNote(false);
    }
  }

  // Handle replace photo
  async function handleReplacePhoto(fileId: number, file: File) {
    if (!submissionId || isReadOnly) return;
    setReplacingFileId(fileId);

    try {
      await bannerTemplateApi.replaceBannerSubmissionFile(
        submissionId,
        fileId,
        file,
        file.name,
      );

      if (submission && submission.status === "Changes Requested") {
        setSubmission({ ...submission, status: "In Review" });
        onStatusUpdated?.("In Review");
      } else if (
        !isStaff &&
        submission &&
        submission.status !== "Approved" &&
        submission.status !== "Completed"
      ) {
        setSubmission({ ...submission, status: "In Review" });
        onStatusUpdated?.("In Review");
      }

      onSubmissionUpdated?.();
      await loadThread(true);
    } catch (err: any) {
      alert(err?.message || "Failed to replace photo.");
    } finally {
      setReplacingFileId(null);
    }
  }

  // Handle add new photo
  async function handleAddNewPhoto() {
    if (!submissionId || !newPhotoFile || isReadOnly) return;
    setAddingPhoto(true);

    try {
      await bannerTemplateApi.addBannerSubmissionFile(
        submissionId,
        newPhotoFile,
        newPhotoCaption.trim() || newPhotoFile.name,
      );

      setNewPhotoFile(null);
      setNewPhotoCaption("");

      if (submission && submission.status === "Changes Requested") {
        setSubmission({ ...submission, status: "In Review" });
        onStatusUpdated?.("In Review");
      } else if (
        !isStaff &&
        submission &&
        submission.status !== "Approved" &&
        submission.status !== "Completed"
      ) {
        setSubmission({ ...submission, status: "In Review" });
        onStatusUpdated?.("In Review");
      }

      onSubmissionUpdated?.();
      await loadThread(true);
    } catch (err: any) {
      alert(err?.message || "Failed to add photo.");
    } finally {
      setAddingPhoto(false);
    }
  }

  // Handle admin status update
  async function handleStatusChange(newStatus: string) {
    if (!submissionId || !isStaff) return;
    setUpdatingStatus(true);
    setStatusMessage(null);

    try {
      await bannerTemplateApi.updateBannerSubmissionStatus(
        submissionId,
        newStatus,
      );
      if (submission) {
        setSubmission({ ...submission, status: newStatus });
      }
      setStatusMessage(`Status updated to ${newStatus}`);
      onStatusUpdated?.(newStatus);
      onSubmissionUpdated?.();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || "Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  // Download banner helper
  function handleDownloadBanner(url: string, filename: string) {
    const fullUrl = resolveImageUrl(url);
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filter messages for overall section
  const overallMessages = messages.filter((m) => !m.imageId);

  const innerCard = (
    <div
      className={`bg-white rounded-2xl w-full border border-slate-200 flex flex-col overflow-hidden ${
        embedded
          ? "shadow-xs"
          : "rounded-[1.5rem] max-w-4xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]"
      }`}
    >
      {/* Modal / Card Header */}
      <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
        <div className="min-w-0 flex-1">
          {embedded && (
            <div className="mb-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 px-3 text-xs font-bold gap-1.5 rounded-xl border-slate-200 text-slate-700 hover:text-indigo-600 bg-white shadow-2xs cursor-pointer inline-flex items-center"
              >
                <ArrowLeft size={14} /> Back to My Submissions
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight truncate">
              {submission?.templateName || `Banner Submission #${submissionId}`}
            </h3>
            {submission && getStatusBadge(submission.status)}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {submission?.dimensionsLabel && (
              <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200/60 font-semibold">
                {submission.dimensionsLabel}
              </span>
            )}
            <span>
              By:{" "}
              <strong className="text-slate-800">
                {submission?.userName || "Client"}
              </strong>{" "}
              ({submission?.userEmail || "-"})
            </span>
            <span>
              Submitted:{" "}
              <span className="text-slate-700 font-medium">
                {submission?.createdAt
                  ? new Date(submission.createdAt).toLocaleDateString()
                  : "-"}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Modal Body */}
      <div className="overflow-y-auto flex-1 min-h-0 px-5 sm:px-6 py-5 space-y-6">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2
              size={28}
              className="animate-spin mx-auto text-indigo-600"
            />
            <p className="text-xs font-semibold text-slate-600">
              Loading submission thread...
            </p>
          </div>
        ) : !submission ? (
          <div className="py-16 text-center text-red-600 text-xs font-semibold">
            Failed to load banner submission details.
          </div>
        ) : (
          <>
            {/* Status Alert Banner */}
            {isReadOnly && (
              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-700">
                <Lock size={16} className="text-slate-500 flex-shrink-0" />
                <span>
                  This banner submission is <strong>{submission.status}</strong>
                  . File replacements and messaging are finalized and locked in
                  read-only mode.
                </span>
              </div>
            )}

            {statusMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2
                  size={15}
                  className="text-emerald-600 flex-shrink-0"
                />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* PHOTO TILES SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <LayoutGrid size={15} /> Photo Tiles ({files.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  {isReadOnly
                    ? "Viewing submission photos"
                    : "Replace photos requested for change or leave tile-specific replies"}
                </span>
              </div>

              {files.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <FileImage size={28} className="mx-auto text-slate-400" />
                  <p className="text-xs text-slate-500 font-medium">
                    No individual photo tiles uploaded yet for this banner.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {files.map((file, idx) => {
                    const tileImgUrl = resolveImageUrl(file.fileUrl);
                    const isUpdating = replacingFileId === file.id;
                    const tileMessages = messages.filter(
                      (m) => m.imageId === file.id,
                    );
                    const draft = tileReplies[file.id] || "";
                    const isSubmittingReply = sendingReplyKey === file.id;
                    const hasHistory = file.history && file.history.length > 0;
                    const isHistoryExpanded = !!expandedHistories[file.id];

                    return (
                      <div
                        key={file.id}
                        className="rounded-2xl bg-white border border-slate-200 p-3.5 flex flex-col shadow-xs hover:shadow-md transition duration-200 space-y-3"
                      >
                        {/* Top Card Bar */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span
                            className="font-extrabold text-slate-900 truncate"
                            title={file.fileName || `Photo #${idx + 1}`}
                          >
                            Photo #{idx + 1}:{" "}
                            {file.fileName || `Image ${idx + 1}`}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold font-mono">
                            v{file.version || 1}
                          </span>
                        </div>

                        {/* Image Box */}
                        <div className="relative aspect-[4/3] w-full bg-slate-950 rounded-xl overflow-hidden group border border-slate-100 flex items-center justify-center">
                          <img
                            src={tileImgUrl}
                            alt={file.fileName || "Tile"}
                            className="w-full h-full object-contain"
                          />

                          <div className="absolute top-2 left-2 z-10">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide shadow-sm bg-indigo-600 text-white">
                              {submission.status === "Changes Requested"
                                ? "CHANGES REQUESTED"
                                : submission.status === "Approved"
                                  ? "APPROVED"
                                  : "PENDING REVIEW"}
                            </span>
                          </div>

                          {/* Hover Actions */}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 backdrop-blur-2xs">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-8 px-2.5 text-xs bg-white/95 hover:bg-white text-slate-800 shadow gap-1"
                              onClick={() =>
                                setFullscreenImage({
                                  url: tileImgUrl,
                                  title: file.fileName || `Photo #${idx + 1}`,
                                })
                              }
                              title="View Fullscreen"
                            >
                              <Eye size={13} />
                              <span>Preview</span>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-8 px-2.5 text-xs bg-white/95 hover:bg-white text-slate-800 shadow gap-1"
                              onClick={() =>
                                handleDownloadBanner(
                                  file.fileUrl,
                                  file.fileName || `photo-${idx + 1}.png`,
                                )
                              }
                              title="Download Photo"
                            >
                              <Download size={13} />
                            </Button>
                          </div>
                        </div>

                        {/* Replacement History Accordion */}
                        {hasHistory && (
                          <div className="border border-slate-100 bg-slate-50/60 rounded-xl p-2 text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedHistories((prev) => ({
                                  ...prev,
                                  [file.id]: !prev[file.id],
                                }))
                              }
                              className="w-full flex items-center justify-between text-slate-600 font-semibold hover:text-slate-900 transition cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5 text-[11px]">
                                <History
                                  size={12}
                                  className="text-indigo-600"
                                />
                                Previous Versions ({file.history!.length})
                              </span>
                              {isHistoryExpanded ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </button>

                            {isHistoryExpanded && (
                              <div className="mt-2 space-y-1.5 pt-1 border-t border-slate-200/60">
                                {file.history!.map((oldF) => (
                                  <div
                                    key={oldF.id}
                                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white border border-slate-200/60 text-[11px]"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-8 h-8 rounded bg-slate-900 overflow-hidden flex-shrink-0">
                                        <img
                                          src={resolveImageUrl(oldF.fileUrl)}
                                          alt="Old version"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-mono text-indigo-700 font-bold truncate">
                                          v{oldF.version || 1} · {oldF.fileName}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                          {new Date(
                                            oldF.createdAt,
                                          ).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFullscreenImage({
                                          url: resolveImageUrl(oldF.fileUrl),
                                          title: `v${oldF.version} - ${oldF.fileName}`,
                                        })
                                      }
                                      className="text-indigo-600 hover:text-indigo-800 p-1 font-semibold flex-shrink-0 cursor-pointer"
                                    >
                                      View
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Per-photo Comments / Conversation */}
                        {tileMessages.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 text-[11px]">
                            <span className="font-bold text-[10px] uppercase tracking-wide flex items-center gap-1 text-slate-500">
                              <MessageSquare
                                size={11}
                                className="text-indigo-600"
                              />
                              Photo Conversation ({tileMessages.length})
                            </span>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {tileMessages.map((msg) => {
                                const isDesignerOrAdmin =
                                  msg.senderRole === "designer" ||
                                  msg.senderRole === "super_admin" ||
                                  (msg.senderName &&
                                    msg.senderName
                                      .toLowerCase()
                                      .includes("designer")) ||
                                  (msg.senderName &&
                                    msg.senderName
                                      .toLowerCase()
                                      .includes("admin"));
                                const authorLabel = isDesignerOrAdmin
                                  ? "FBS Admin"
                                  : msg.senderName ||
                                    submission.userName ||
                                    "Vendor";

                                return (
                                  <div
                                    key={msg.id}
                                    className={`p-2 rounded-lg text-xs leading-snug border ${
                                      isDesignerOrAdmin
                                        ? "bg-indigo-50/60 border-indigo-100 text-slate-800"
                                        : "bg-white border-slate-200 text-slate-800"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
                                      <span
                                        className={
                                          isDesignerOrAdmin
                                            ? "text-indigo-700"
                                            : "text-slate-800"
                                        }
                                      >
                                        {authorLabel}
                                      </span>
                                      <span className="text-slate-400 font-normal">
                                        {new Date(
                                          msg.createdAt,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                    <p className="whitespace-pre-wrap">
                                      {msg.message}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Per-Photo Reply Input (if not read-only) */}
                        {!isReadOnly && (
                          <div className="space-y-1.5 pt-1">
                            <Textarea
                              rows={2}
                              value={draft}
                              onChange={(e) =>
                                setTileReplies((prev) => ({
                                  ...prev,
                                  [file.id]: e.target.value,
                                }))
                              }
                              placeholder="Reply to this photo..."
                              className="w-full text-xs rounded-xl bg-slate-50/60 border-slate-200 focus:bg-white resize-none"
                            />
                            <Button
                              type="button"
                              size="sm"
                              disabled={isSubmittingReply || !draft.trim()}
                              onClick={() => handleSendMessage(file.id)}
                              className="w-full h-8 text-xs font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 gap-1"
                            >
                              {isSubmittingReply ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Send size={12} />
                              )}
                              <span>Send Photo Reply</span>
                            </Button>
                          </div>
                        )}

                        {/* Replace Photo Button - Enabled for Admin / Staff */}
                        {isStaff && !isReadOnly && (
                          <label
                            className={`w-full h-8.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs ${
                              isUpdating ? "opacity-50 pointer-events-none" : ""
                            }`}
                            title="Replace this photo with an updated file"
                          >
                            {isUpdating ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <RefreshCw size={13} />
                            )}
                            <span>
                              {isUpdating ? "Replacing..." : "Replace Photo"}
                            </span>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleReplacePhoto(file.id, f);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ========================================================================= */}
              {/* ADD NEW PHOTO SECTION (Choose file) - COMMENTED OUT FOR USER SIDE         */}
              {/* ========================================================================= */}
              {/* Commented out for user side per request:
                {!isReadOnly && (
                  <div className="pt-2 space-y-3">
                    <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                      <Plus size={14} /> Add New Photo
                    </span>
                    {!newPhotoFile ? (
                      <label className="w-full min-h-[80px] px-4 bg-indigo-50/30 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl text-xs text-indigo-700 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition">
                        <Upload size={18} className="text-indigo-500" />
                        <span className="font-bold">+ Choose Photo File to Add...</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={(e) => setNewPhotoFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    ) : (
                      <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Eye size={14} className="text-indigo-600" /> New Photo Preview
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setNewPhotoFile(null);
                              setNewPhotoCaption("");
                            }}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X size={15} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-xl bg-slate-950 overflow-hidden border border-slate-200 flex-shrink-0">
                            <img
                              src={URL.createObjectURL(newPhotoFile)}
                              alt="Upload preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {newPhotoFile.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {(newPhotoFile.size / 1024).toFixed(0)} KB
                            </p>
                            <Input
                              type="text"
                              value={newPhotoCaption}
                              onChange={(e) => setNewPhotoCaption(e.target.value)}
                              placeholder="Photo caption / label (optional)..."
                              className="h-8 text-xs bg-slate-50"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            disabled={addingPhoto}
                            onClick={handleAddNewPhoto}
                            className="flex-1 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5"
                          >
                            {addingPhoto ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Plus size={14} />
                            )}
                            Upload Tile & Append to Banner
                          </Button>
                          <label className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition inline-flex items-center">
                            Change File
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              className="hidden"
                              onChange={(e) =>
                                setNewPhotoFile(e.target.files?.[0] || null)
                              }
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                */}

              {/* Only visible if staff/admin */}
              {isStaff && !isReadOnly && (
                <div className="pt-2 space-y-3">
                  <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                    <Plus size={14} /> Add New Photo
                  </span>

                  {!newPhotoFile ? (
                    <label className="w-full min-h-[80px] px-4 bg-indigo-50/30 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl text-xs text-indigo-700 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition">
                      <Upload size={18} className="text-indigo-500" />
                      <span className="font-bold">
                        + Choose Photo File to Add...
                      </span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={(e) =>
                          setNewPhotoFile(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  ) : (
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Eye size={14} className="text-indigo-600" /> New
                          Photo Preview
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewPhotoFile(null);
                            setNewPhotoCaption("");
                          }}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-slate-950 overflow-hidden border border-slate-200 flex-shrink-0">
                          <img
                            src={URL.createObjectURL(newPhotoFile)}
                            alt="Upload preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {newPhotoFile.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {(newPhotoFile.size / 1024).toFixed(0)} KB
                          </p>
                          <Input
                            type="text"
                            value={newPhotoCaption}
                            onChange={(e) => setNewPhotoCaption(e.target.value)}
                            placeholder="Photo caption / label (optional)..."
                            className="h-8 text-xs bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          disabled={addingPhoto}
                          onClick={handleAddNewPhoto}
                          className="flex-1 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5"
                        >
                          {addingPhoto ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Plus size={14} />
                          )}
                          Upload Tile & Append to Banner
                        </Button>
                        <label className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition inline-flex items-center">
                          Change File
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                            onChange={(e) =>
                              setNewPhotoFile(e.target.files?.[0] || null)
                            }
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SUBMITTED FORM FIELDS (Collapsible) */}
            {submission.submittedFields &&
              submission.submittedFields.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                      <FileText size={14} className="text-indigo-600" />
                      Submitted Form Fields ({submission.submittedFields.length}
                      )
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomFields((prev) => !prev)}
                      className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showCustomFields ? "Hide Fields" : "View Fields"}
                      {showCustomFields ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                  </div>

                  {showCustomFields && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                      {submission.submittedFields.map((f, fIdx) => (
                        <div
                          key={f.id || fIdx}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                        >
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            {f.label}
                          </label>
                          <p className="font-semibold text-slate-800 break-words">
                            {String(f.value ?? "-")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* ========================================================================= */}
            {/* OVERALL NOTES & CONVERSATION SECTION - COMMENTED OUT FOR BOTH USER & ADMIN */}
            {/* ========================================================================= */}
            {/* Commented out for both user & admin sides per request:
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-indigo-600" /> Overall Notes &
                    Conversation ({overallMessages.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Discussion between Vendor and FBS Admin
                  </span>
                </div>

                {overallMessages.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center italic">
                    No overall remarks yet. You can leave a general note or revision question
                    below.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {overallMessages.map((msg) => {
                      const isDesignerOrAdmin =
                        msg.senderRole === "designer" ||
                        msg.senderRole === "super_admin" ||
                        (msg.senderName && msg.senderName.toLowerCase().includes("designer")) ||
                        (msg.senderName && msg.senderName.toLowerCase().includes("admin"));
                      const authorLabel = isDesignerOrAdmin
                        ? "FBS Admin"
                        : msg.senderName || submission.userName || "Vendor";

                      return (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-xl border text-xs leading-relaxed ${
                            isDesignerOrAdmin
                              ? "bg-indigo-50/70 border-indigo-200 text-slate-800"
                              : "bg-white border-slate-200 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                            <span
                              className={
                                isDesignerOrAdmin ? "text-indigo-700" : "text-slate-800"
                              }
                            >
                              {authorLabel}
                            </span>
                            <span className="text-slate-400 font-normal text-[10px]">
                              {new Date(msg.createdAt).toLocaleDateString()}{" "}
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!isReadOnly && (
                  <div className="pt-2 space-y-2">
                    <Textarea
                      rows={3}
                      value={overallNote}
                      onChange={(e) => setOverallNote(e.target.value)}
                      placeholder={
                        isStaff
                          ? "Write a reply or request changes from the client..."
                          : "Leave a note or question for the FBS Admin..."
                      }
                      className="w-full text-xs rounded-xl bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        disabled={sendingOverallNote || !overallNote.trim()}
                        onClick={() => handleSendMessage(null)}
                        className="h-8.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5"
                      >
                        {sendingOverallNote ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Send size={13} />
                        )}
                        <span>Send Message</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              */}
          </>
        )}
      </div>

      {/* Modal Footer */}
      <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
        <div>
          {submission?.previewImageUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleDownloadBanner(
                  submission.previewImageUrl!,
                  `${submission.templateName || "banner"}.png`,
                )
              }
              className="text-xs font-semibold gap-1.5 h-8 text-slate-700"
            >
              <Download size={13} />
              <span>Download Preview</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="text-xs font-semibold h-8 px-4 cursor-pointer"
          >
            {embedded ? "Back to Submissions" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );

  const lightbox = fullscreenImage && (
    <div
      className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={() => setFullscreenImage(null)}
    >
      <div
        className="max-w-5xl max-h-[90vh] flex flex-col items-center gap-3 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full text-white text-xs font-bold px-2">
          <span>{fullscreenImage.title}</span>
          <button
            type="button"
            onClick={() => setFullscreenImage(null)}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <img
          src={fullscreenImage.url}
          alt={fullscreenImage.title}
          className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl"
        />
      </div>
    </div>
  );

  if (embedded) {
    if (loading) {
      return (
        <div className="py-20 text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-indigo-600" />
          <p className="text-xs font-semibold text-slate-600">
            Loading submission review...
          </p>
        </div>
      );
    }
    if (!submission) {
      return (
        <div className="py-16 text-center text-red-600 text-xs font-semibold">
          Failed to load banner submission details.
        </div>
      );
    }

    const activeFile = files[selectedFileIndex] || files[0] || null;
    const tileImgUrl = activeFile?.fileUrl
      ? resolveImageUrl(activeFile.fileUrl)
      : submission.previewImageUrl
        ? resolveImageUrl(submission.previewImageUrl)
        : "";

    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/90">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 h-8 px-2.5 rounded-xl border-slate-200 cursor-pointer flex-shrink-0 bg-white shadow-2xs"
            >
              <ArrowLeft size={14} /> Back to My Submissions
            </Button>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">
              Banner Details &amp; Approval
            </span>
            <span className="hidden sm:inline-flex items-center rounded-xl bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap">
              Anyone with this link can review
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {getStatusBadge(submission.status)}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadThread(true)}
              className="h-8 px-3 rounded-xl bg-white text-xs font-semibold flex-shrink-0"
              title="Refresh Proof Data"
            >
              <RefreshCw
                size={13}
                className={loading ? "animate-spin text-indigo-600" : ""}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Project Title & Subtitle */}
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl sm:text-[1.75rem] font-extrabold text-slate-900 tracking-tight">
            {submission.templateName}
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>
              Client:{" "}
              <strong className="text-slate-800 font-semibold">
                {submission.userName || currentUserName || "Client User"}
              </strong>
            </span>
            <span className="text-slate-300">·</span>
            <span>
              Designer:{" "}
              <strong className="text-slate-800 font-semibold">
                {submission.franchiseName || "FBS designer - 1"}
              </strong>
            </span>
            {submission.dimensionsLabel && (
              <>
                <span className="text-slate-300">·</span>
                <span>
                  Size:{" "}
                  <strong className="text-slate-800 font-semibold font-mono">
                    {submission.dimensionsLabel}
                  </strong>
                </span>
              </>
            )}
          </p>
        </div>

        {/* 2-Column Review Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: Project Banners (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-indigo-600">
                  PROJECT BANNERS ({files.length || 1})
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Review &amp; approve on each banner
                </p>
              </div>

              {/* Banner Proof Container */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4 transition">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-[15px] text-slate-900 truncate">
                        {activeFile?.fileName || submission.templateName}
                      </h4>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold">
                        <FileImage size={11} /> Individual Banner
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono font-semibold">
                        v{activeFile?.version || 1}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500">
                      Individual banner proof
                    </p>
                  </div>
                  {getStatusBadge(submission.status)}
                </div>

                {/* Big Proof Preview Image */}
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2 sm:p-3">
                  <div className="relative h-[220px] sm:h-[320px] md:h-[400px] bg-white rounded-lg overflow-hidden group border border-slate-200/60 flex items-center justify-center p-2">
                    {tileImgUrl ? (
                      <img
                        src={tileImgUrl}
                        alt={submission.templateName}
                        className="w-full h-full object-contain mx-auto rounded drop-shadow-sm"
                      />
                    ) : (
                      <div className="p-8 text-center text-slate-400">
                        <FileImage
                          size={40}
                          className="mx-auto mb-2 text-slate-300"
                        />
                        <p className="text-xs">No preview image available</p>
                      </div>
                    )}

                    {tileImgUrl && (
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[1px]">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="bg-white/95 hover:bg-white shadow cursor-pointer font-semibold text-xs gap-1.5"
                          onClick={() =>
                            setFullscreenImage({
                              url: tileImgUrl,
                              title: (activeFile?.fileName ||
                                submission.templateName ||
                                "Proof") as string,
                            })
                          }
                        >
                          <Eye size={14} /> Fullscreen Proof
                        </Button>
                      </div>
                    )}

                    <span className="absolute top-2 right-2 bg-slate-900/85 text-white text-[9.5px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-md shadow">
                      v{activeFile?.version || 1}
                    </span>

                    <span className="absolute bottom-2 left-2 inline-flex items-center rounded-full bg-slate-100/90 text-slate-600 border border-slate-200 text-[8.5px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 uppercase tracking-wide">
                      WATERMARKED
                    </span>
                  </div>
                </div>

                {/* Multiple files switcher */}
                {files.length > 1 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      Switch Banner File:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {files.map((f, idx) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedFileIndex(idx)}
                          className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition bg-slate-50 ${
                            selectedFileIndex === idx
                              ? "border-indigo-600 ring-2 ring-indigo-200"
                              : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={resolveImageUrl(f.fileUrl)}
                            alt={f.fileName || `Photo #${idx + 1}`}
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

                {/* Banner Review Action section */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-indigo-600" />{" "}
                      Banner Review Action
                    </span>
                    {getStatusBadge(submission.status)}
                  </div>

                  <Textarea
                    rows={2}
                    value={
                      activeFile
                        ? tileReplies[activeFile.id] || ""
                        : overallNote
                    }
                    onChange={(e) => {
                      if (activeFile) {
                        setTileReplies((prev) => ({
                          ...prev,
                          [activeFile.id]: e.target.value,
                        }));
                      } else {
                        setOverallNote(e.target.value);
                      }
                    }}
                    placeholder={`Feedback or change requests for "${submission.templateName}"...`}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition resize-none bg-white"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      disabled={sendingReplyKey !== null || sendingOverallNote}
                      variant="outline"
                      onClick={() =>
                        handleSendMessage(
                          activeFile ? activeFile.id : null,
                          "changes_requested",
                        )
                      }
                      className="h-9 px-2 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <AlertCircle size={13} className="text-amber-600" />
                      <span className="truncate">Request Changes</span>
                    </Button>

                    <Button
                      type="button"
                      disabled={sendingReplyKey !== null || sendingOverallNote}
                      onClick={() =>
                        handleSendMessage(
                          activeFile ? activeFile.id : null,
                          "approved",
                        )
                      }
                      className="h-9 px-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {sendingReplyKey !== null || sendingOverallNote ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={13} />
                      )}
                      <span className="truncate">Approve Banner</span>
                    </Button>
                  </div>

                  {/* Replace Photo action - Enabled for Admin / Staff */}
                  {isStaff && activeFile && !isReadOnly && (
                    <div className="pt-2">
                      <label
                        className={`w-full h-8.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                          replacingFileId === activeFile.id
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }`}
                      >
                        {replacingFileId === activeFile.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <RefreshCw size={13} className="text-indigo-600" />
                        )}
                        <span>
                          {replacingFileId === activeFile.id
                            ? "Uploading replacement..."
                            : "Upload / Replace Photo"}
                        </span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f && activeFile)
                              handleReplacePhoto(activeFile.id, f);
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Submitted Form Fields (Collapsible) */}
                {(() => {
                  const customVals =
                    (submission as any).customizationValues ||
                    (submission as any).customFieldValues ||
                    {};
                  const fieldKeys = Object.keys(customVals).filter(
                    (k) => !k.startsWith("_"),
                  );
                  if (fieldKeys.length === 0) return null;

                  return (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowCustomFields(!showCustomFields)}
                        className="w-full flex items-center justify-between text-xs font-bold text-slate-700 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <FileText size={13} className="text-indigo-600" />
                          Submitted Form Fields ({fieldKeys.length})
                        </span>
                        {showCustomFields ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>

                      {showCustomFields && (
                        <div className="mt-2.5 p-3 rounded-xl bg-white border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {fieldKeys.map((k) => (
                            <div
                              key={k}
                              className="p-2 rounded-lg bg-slate-50 border border-slate-100"
                            >
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                                {k}
                              </span>
                              <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                                {String(customVals[k])}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Overall Feedback + Activity History (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Overall Feedback Card (Matching Screenshot 2) */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Overall Feedback
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Share feedback or approve this banner proof as a whole.
                </p>
              </div>

              <Textarea
                rows={4}
                value={overallNote}
                onChange={(e) => setOverallNote(e.target.value)}
                placeholder="Type feedback or required changes for this banner..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition resize-none bg-white"
              />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  disabled={sendingOverallNote}
                  variant="outline"
                  onClick={() => handleSendMessage(null, "changes_requested")}
                  className="h-9 px-2 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AlertCircle size={13} className="text-amber-600" />
                  <span className="truncate">Request Changes</span>
                </Button>

                <Button
                  type="button"
                  disabled={sendingOverallNote}
                  onClick={() => handleSendMessage(null, "approved")}
                  className="h-9 px-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {sendingOverallNote ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  <span className="truncate">Approve</span>
                </Button>
              </div>
            </div>

            {/* Activity & Status History Card (Matching Screenshot 2) */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <History size={13} className="text-slate-400" /> Activity
                  &amp; Status History
                </h3>
              </div>

              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {submission.templateName}
                </span>
                {getStatusBadge(submission.status)}
              </div>

              {/* History Timeline */}
              <div className="space-y-3 text-xs">
                {messages.length > 0 ? (
                  messages
                    .slice()
                    .reverse()
                    .map((msg) => {
                      const isDesigner =
                        msg.senderRole === "designer" ||
                        msg.senderRole === "super_admin" ||
                        (msg.senderName &&
                          msg.senderName.toLowerCase().includes("admin"));
                      const isChanges =
                        submission.status === "Changes Requested" ||
                        msg.message.toLowerCase().includes("change");
                      const dotColor = isChanges
                        ? "bg-rose-500 ring-rose-100"
                        : "bg-emerald-500 ring-emerald-100";
                      const titleColor = isChanges
                        ? "text-rose-600"
                        : "text-emerald-700";
                      const titleText = isChanges
                        ? "Changes Requested"
                        : isDesigner
                          ? "Designer Review"
                          : "Client Feedback";

                      return (
                        <div key={msg.id} className="relative pl-5 space-y-1">
                          <div
                            className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full ring-4 ${dotColor}`}
                          />
                          <span
                            className={`font-bold text-xs block ${titleColor}`}
                          >
                            {titleText}
                          </span>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-slate-700 text-[11px] leading-relaxed">
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(msg.createdAt).toLocaleString()},{" "}
                            {isDesigner
                              ? "FBS Admin"
                              : msg.senderName ||
                                submission.userName ||
                                "Client"}
                          </span>
                        </div>
                      );
                    })
                ) : (
                  <div className="relative pl-5 space-y-1">
                    <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-100" />
                    <span className="font-bold text-indigo-700 text-xs block">
                      Pending Review
                    </span>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-slate-700 text-[11px] leading-relaxed">
                      Initial banner uploaded
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(submission.createdAt).toLocaleDateString()},
                      Designer
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen Proof Modal if clicked */}
        {fullscreenImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
              <img
                src={fullscreenImage.url}
                alt={fullscreenImage.title}
                className="max-h-[85vh] object-contain rounded-lg"
              />
              <span className="mt-2 text-xs text-white/80 font-medium">
                {fullscreenImage.title} (Click anywhere to close)
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {innerCard}
      {lightbox}
    </div>
  );
}
