"use client";

import { useState, useEffect, useMemo, ChangeEvent, FormEvent, DragEvent } from "react";
import {
  franchiseApi,
  resolveImageUrl,
  type FranchiseModel,
  type FranchiseAccessRequestModel,
} from "@/app/lib/client/franchise";
import {
  Button,
  Card,
  Input,
  Textarea,
  Label,
  Badge,
} from "@/app/Components/ui";
import {
  Building2,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Store,
  Clock,
  XCircle,
  Check,
  UserCheck,
  Users,
  ShieldCheck,
  FileText,
} from "lucide-react";

type FormMode = "create" | "edit" | null;

interface FormDataState {
  name: string;
  description: string;
  logoFile: File | null;
  existingLogoUrl: string | null;
  isActive: boolean;
}

const emptyFormData: FormDataState = {
  name: "",
  description: "",
  logoFile: null,
  existingLogoUrl: null,
  isActive: true,
};

export function FranchiseManagement() {
  const [franchises, setFranchises] = useState<FranchiseModel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Global notice / toast
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal states
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormDataState>(emptyFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // View modal state
  const [viewingFranchise, setViewingFranchise] =
    useState<FranchiseModel | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<FranchiseModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionError, setDeletionError] = useState<string | null>(null);

  // Sub-navigation tab state: "franchises" | "requests"
  const [subTab, setSubTab] = useState<"franchises" | "requests">("franchises");

  // Franchise Requests state
  const [requests, setRequests] = useState<FranchiseAccessRequestModel[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(true);
  const [isRequestsRefreshing, setIsRequestsRefreshing] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [requestFranchiseFilter, setRequestFranchiseFilter] =
    useState<string>("all");

  // Request actions modal state
  const [rejectingRequest, setRejectingRequest] =
    useState<FranchiseAccessRequestModel | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [viewingRequest, setViewingRequest] =
    useState<FranchiseAccessRequestModel | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Auto-dismiss notice after 5 seconds
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => {
      setNotice(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Clean up logo preview object URL when changed/unmounted
  useEffect(() => {
    return () => {
      if (logoPreviewUrl && logoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  // Fetch franchises from backend
  async function loadFranchises(silent = false) {
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setLoadError(null);

    try {
      const data = await franchiseApi.getFranchises();
      setFranchises(data);
    } catch (err: any) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to load franchise records.";
      setLoadError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  // Fetch requests from backend
  async function loadRequests(silent = false) {
    if (!silent) {
      setIsRequestsLoading(true);
    } else {
      setIsRequestsRefreshing(true);
    }
    try {
      const data = await franchiseApi.getUserRequests();
      setRequests(data);
    } catch (err: any) {
      console.error("Failed to load franchise requests:", err);
    } finally {
      setIsRequestsLoading(false);
      setIsRequestsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadFranchises();
    void loadRequests();
  }, []);

  // Request action handlers
  async function handleApproveRequest(req: FranchiseAccessRequestModel) {
    setIsUpdatingStatus(true);
    try {
      await franchiseApi.updateUserRequestStatus(req.id, "approved");
      setNotice({
        type: "success",
        message: `Approved franchise access for "${req.userName || req.userEmail}". User is now active!`,
      });
      await loadRequests(true);
      await loadFranchises(true);
    } catch (err: any) {
      setNotice({
        type: "error",
        message: err?.message || "Failed to approve request.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleRejectSubmit() {
    if (!rejectingRequest) return;
    setIsUpdatingStatus(true);
    try {
      await franchiseApi.updateUserRequestStatus(
        rejectingRequest.id,
        "rejected",
        rejectionReasonInput.trim() || undefined,
      );
      setNotice({
        type: "success",
        message: `Rejected franchise request for "${rejectingRequest.userName || rejectingRequest.userEmail}".`,
      });
      setRejectingRequest(null);
      setRejectionReasonInput("");
      await loadRequests(true);
    } catch (err: any) {
      setNotice({
        type: "error",
        message: err?.message || "Failed to reject request.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleResetPending(req: FranchiseAccessRequestModel) {
    setIsUpdatingStatus(true);
    try {
      await franchiseApi.updateUserRequestStatus(req.id, "pending");
      setNotice({
        type: "success",
        message: `Reset status for "${req.userName || req.userEmail}" to pending.`,
      });
      await loadRequests(true);
    } catch (err: any) {
      setNotice({
        type: "error",
        message: err?.message || "Failed to reset request status.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  // Request statistics counts
  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === "pending").length,
    [requests],
  );
  const approvedCount = useMemo(
    () => requests.filter((r) => r.status === "approved").length,
    [requests],
  );
  const rejectedCount = useMemo(
    () => requests.filter((r) => r.status === "rejected").length,
    [requests],
  );

  // Filtered requests
  const filteredRequests = useMemo(() => {
    let list = requests;
    if (requestStatusFilter !== "all") {
      list = list.filter((r) => r.status === requestStatusFilter);
    }
    if (requestFranchiseFilter !== "all") {
      list = list.filter(
        (r) => String(r.franchiseId) === requestFranchiseFilter,
      );
    }
    const q = requestSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (r) =>
          (r.userName && r.userName.toLowerCase().includes(q)) ||
          (r.userEmail && r.userEmail.toLowerCase().includes(q)) ||
          (r.franchiseName && r.franchiseName.toLowerCase().includes(q)) ||
          (r.rejectionReason && r.rejectionReason.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [requests, requestStatusFilter, requestFranchiseFilter, requestSearch]);

  // Filtered listing by search
  const filteredFranchises = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return franchises;
    return franchises.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q)),
    );
  }, [franchises, searchQuery]);

  // Open Create Form
  function openCreateModal() {
    if (logoPreviewUrl && logoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setFormData(emptyFormData);
    setFormErrors({});
    setLogoPreviewUrl(null);
    setEditingId(null);
    setFormError(null);
    setIsDragging(false);
    setFormMode("create");
  }

  // Open Edit Form
  function openEditModal(franchise: FranchiseModel) {
    if (logoPreviewUrl && logoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setFormData({
      name: franchise.name,
      description: franchise.description || "",
      logoFile: null,
      existingLogoUrl: franchise.brandingLogoUrl || null,
      isActive:
        franchise.isActive !== undefined ? Boolean(franchise.isActive) : true,
    });
    setFormErrors({});
    setLogoPreviewUrl(
      franchise.brandingLogoUrl
        ? resolveImageUrl(franchise.brandingLogoUrl)
        : null,
    );
    setEditingId(franchise.id);
    setFormError(null);
    setIsDragging(false);
    setFormMode("edit");
  }

  // Close Form modal
  function closeFormModal() {
    if (logoPreviewUrl && logoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setFormMode(null);
    setEditingId(null);
    setFormData(emptyFormData);
    setLogoPreviewUrl(null);
    setFormErrors({});
    setFormError(null);
    setIsDragging(false);
  }

  // Process and validate selected or dropped logo file
  function processLogoFile(file: File): boolean {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFormErrors((prev) => ({
        ...prev,
        logo: "Please upload a PNG, JPG, JPEG, or WebP image.",
      }));
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormErrors((prev) => ({
        ...prev,
        logo: "Logo file size must be less than 5MB.",
      }));
      return false;
    }

    if (logoPreviewUrl && logoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setLogoPreviewUrl(preview);
    setFormData((prev) => ({ ...prev, logoFile: file }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.logo;
      return next;
    });
    return true;
  }

  // Handle Logo File Selection
  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    processLogoFile(file);
    e.target.value = "";
  }

  // Drag and drop handlers
  function handleDragOver(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }

  function handleDragEnter(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processLogoFile(files[0]);
    }
  }

  function handleRemoveSelectedLogo() {
    if (logoPreviewUrl && logoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    if (formMode === "edit" && formData.existingLogoUrl) {
      setLogoPreviewUrl(resolveImageUrl(formData.existingLogoUrl));
    } else {
      setLogoPreviewUrl(null);
    }
    setFormData((prev) => ({ ...prev, logoFile: null }));
  }

  // Form submit (Create or Update)
  async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    // Client-side validations
    const errors: Record<string, string> = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      errors.name = "Franchise name is required.";
    }

    // On create, logo is required
    if (formMode === "create" && !formData.logoFile) {
      errors.logo = "Branding logo is required for new franchises.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("name", trimmedName);
      payload.append("description", formData.description.trim());
      payload.append("isActive", String(formData.isActive));

      // If a file was selected, append it as 'brandingLogoUrl'
      if (formData.logoFile) {
        payload.append("brandingLogoUrl", formData.logoFile);
      }

      if (formMode === "create") {
        await franchiseApi.createFranchise(payload);
        setNotice({
          type: "success",
          message: `Franchise "${trimmedName}" created successfully!`,
        });
      } else if (formMode === "edit" && editingId !== null) {
        await franchiseApi.updateFranchise(editingId, payload);
        setNotice({
          type: "success",
          message: `Franchise "${trimmedName}" updated successfully!`,
        });
      }

      closeFormModal();
      await loadFranchises(true);
    } catch (err: any) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to save franchise. Please try again.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Delete franchise handler
  async function confirmDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await franchiseApi.deleteFranchise(deleteTarget.id);
      setNotice({
        type: "success",
        message: `Franchise "${deleteTarget.name}" was deleted successfully.`,
      });
      setDeleteTarget(null);
      await loadFranchises(true);
    } catch (err: any) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to delete franchise. Please try again.";

      // Show blocked popup for FK / dependency errors; otherwise show toast
      const isBlocked =
        err?.data?.code === "FRANCHISE_HAS_DEPENDENCIES" ||
        /linked|foreign key|cannot delete|restrict|constraint/i.test(msg);

      if (isBlocked) {
        setDeleteTarget(null);
        setDeletionError(msg);
      } else {
        setNotice({ type: "error", message: msg });
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Top Banner Notice */}
      {notice && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border animate-in fade-in slide-in-from-top duration-200 ${notice.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === "success" ? (
              <CheckCircle2
                size={18}
                className="text-emerald-600 flex-shrink-0"
              />
            ) : (
              <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
            )}
            <p className="text-xs font-bold">{notice.message}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-700 h-6 w-6"
          >
            <X size={14} />
          </Button>
        </div>
      )}

      {/* Sub-Navigation Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setSubTab("franchises")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${subTab === "franchises"
            ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
        >
          <Building2 size={16} />
          Franchise Branches
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${subTab === "franchises"
              ? "bg-white/20 text-white"
              : "bg-slate-200 text-slate-700"
              }`}
          >
            {franchises.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("requests")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all relative ${subTab === "requests"
            ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
        >
          <UserCheck size={16} />
          Access Requests & Approvals
          {pendingCount > 0 ? (
            <span className="bg-gray-200 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingCount} Pending
            </span>
          ) : (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${subTab === "requests"
                ? "bg-white/20 text-white"
                : "bg-slate-200 text-slate-700"
                }`}
            >
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: FRANCHISE BRANCHES                                  */}
      {/* ============================================================== */}
      {subTab === "franchises" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Page Header Card */}
          <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Franchise Management
                </h1>
                <Badge variant="secondary" className="font-mono text-[11px] px-2">
                  {franchises.length} total
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Manage franchise details, branding, and franchise records.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                disabled={isRefreshing || isLoading}
                onClick={() => void loadFranchises(true)}
                title="Refresh franchise records from API"
              >
                <RefreshCw
                  size={15}
                  className={isRefreshing ? "animate-spin text-indigo-600" : ""}
                />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>

              <Button
                type="button"
                onClick={openCreateModal}
                className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
              >
                <Plus size={16} />
                Add Franchise
              </Button>
            </div>
          </Card>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                type="text"
                placeholder="Search by franchise name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-white border-slate-200 shadow-sm"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </Button>
              )}
            </div>

            {searchQuery && (
              <p className="text-xs text-slate-500 font-medium">
                Showing {filteredFranchises.length} of {franchises.length} records
              </p>
            )}
          </div>

          {/* Main Listing Table Card */}
          <Card className="overflow-hidden shadow-sm p-0 border border-slate-200">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">All Franchises</h2>
                <p className="text-xs text-slate-500">
                  Manage franchise regional branches, brand logos, and settings.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2
                  size={36}
                  className="mx-auto text-indigo-600 animate-spin"
                />
                <p className="text-sm font-semibold text-slate-600">
                  Loading franchise records...
                </p>
                <p className="text-xs text-slate-400">
                  Connecting to backend franchise API
                </p>
              </div>
            ) : loadError ? (
              <div className="py-16 text-center space-y-3 px-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Failed to load franchises
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {loadError}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void loadFranchises()}
                  className="mt-2"
                >
                  <RefreshCw size={14} />
                  Retry API Connection
                </Button>
              </div>
            ) : filteredFranchises.length === 0 ? (
              <div className="py-20 text-center space-y-3 px-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                  <Store size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {searchQuery
                    ? "No matching franchises found"
                    : "No franchises yet"}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `No franchise matched "${searchQuery}". Try a different search query.`
                    : "Create your first franchise record to start managing branding, logos, and regional franchise entries."}
                </p>
                {searchQuery ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search Filter
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={openCreateModal}
                    className="bg-slate-900 hover:bg-slate-800 text-white mt-2"
                  >
                    <Plus size={15} />
                    Add First Franchise
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-black/[0.03] text-slate-800 font-semibold text-xs">
                    <tr>
                      <th className="px-5 py-3.5 w-20">Logo</th>
                      <th className="px-5 py-3.5 font-semibold w-52">
                        Franchise Name
                      </th>
                      <th className="px-5 py-3.5 font-semibold w-64 md:w-80">
                        Description
                      </th>
                      <th className="px-5 py-3.5 font-semibold w-32">Status</th>
                      <th className="px-5 py-3.5 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 bg-white">
                    {filteredFranchises.map((f) => {
                      const logoSrc = f.brandingLogoUrl
                        ? resolveImageUrl(f.brandingLogoUrl)
                        : null;

                      return (
                        <tr
                          key={f.id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          {/* Logo Column */}
                          <td className="px-5 py-4">
                            <div
                              onClick={() => setViewingFranchise(f)}
                              className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 p-1 flex items-center justify-center overflow-hidden cursor-pointer shadow-sm group-hover:border-indigo-300 transition"
                              title="Click to view full details"
                            >
                              {logoSrc ? (
                                <img
                                  src={logoSrc}
                                  alt={f.name}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display =
                                      "none";
                                    const parent = (e.target as HTMLElement)
                                      .parentElement;
                                    if (
                                      parent &&
                                      !parent.querySelector(".fallback-icon")
                                    ) {
                                      const span = document.createElement("span");
                                      span.className =
                                        "fallback-icon text-slate-400 font-bold text-xs";
                                      span.textContent = f.name
                                        .slice(0, 2)
                                        .toUpperCase();
                                      parent.appendChild(span);
                                    }
                                  }}
                                />
                              ) : (
                                <Building2 size={20} className="text-slate-300" />
                              )}
                            </div>
                          </td>

                          {/* Name Column */}
                          <td className="px-5 py-4 font-medium text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => setViewingFranchise(f)}
                                className="cursor-pointer hover:text-indigo-600 transition"
                              >
                                {f.name}
                              </span>
                            </div>
                            {f.createdAt && (
                              <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                                Added {new Date(f.createdAt).toLocaleDateString()}
                              </p>
                            )}
                          </td>

                          {/* Description Column */}
                          <td className="px-5 py-4 text-slate-600 max-w-xs">
                            {f.description ? (
                              <p className="truncate text-xs" title={f.description}>
                                {f.description}
                              </p>
                            ) : (
                              <span className="text-slate-300 italic text-xs">
                                No description provided
                              </span>
                            )}
                          </td>

                          {/* Status Column */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <Badge
                              variant={f.isActive ? "success" : "secondary"}
                              className="capitalize text-xs font-semibold px-2.5 py-0.5"
                            >
                              {f.status || (f.isActive ? "Active" : "Inactive")}
                            </Badge>
                          </td>

                          {/* Actions Column */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingFranchise(f)}
                                title="View franchise details"
                                className="text-xs font-medium"
                              >
                                <Eye size={14} />
                                View
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(f)}
                                title="Edit franchise details"
                                className="text-xs font-medium"
                              >
                                <Edit size={14} />
                                Edit
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                onClick={() => setDeleteTarget(f)}
                                title="Delete franchise"
                                className="bg-transparent hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-medium"
                              >
                                <Trash2 size={14} />
                                Delete
                              </Button>
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
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: FRANCHISE ACCESS REQUESTS & APPROVALS               */}
      {/* ============================================================== */}
      {subTab === "requests" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header Card */}
          <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Franchise Access Requests
                </h1>
                <Badge variant="secondary" className="font-mono text-[11px] px-2">
                  {requests.length} total
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Review user registration applications. Approve or reject franchise member access in real time.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                disabled={isRequestsRefreshing || isRequestsLoading}
                onClick={() => void loadRequests(true)}
                title="Refresh user franchise requests"
              >
                <RefreshCw
                  size={15}
                  className={
                    isRequestsRefreshing ? "animate-spin text-indigo-600" : ""
                  }
                />
                {isRequestsRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </Card>

          {/* Quick Filter Pill Buttons & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setRequestStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${requestStatusFilter === "all"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                All Requests
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${requestStatusFilter === "all"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-700"
                    }`}
                >
                  {requests.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRequestStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${requestStatusFilter === "pending"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <Clock
                  size={13}
                  className={
                    requestStatusFilter === "pending"
                      ? "text-slate-950"
                      : "text-amber-500"
                  }
                />
                Pending
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${requestStatusFilter === "pending"
                      ? "bg-black/20 text-black"
                      : "bg-amber-100 text-amber-800"
                    }`}
                >
                  {pendingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRequestStatusFilter("approved")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${requestStatusFilter === "approved"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <CheckCircle2
                  size={13}
                  className={
                    requestStatusFilter === "approved"
                      ? "text-white"
                      : "text-emerald-500"
                  }
                />
                Approved
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${requestStatusFilter === "approved"
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-800"
                    }`}
                >
                  {approvedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRequestStatusFilter("rejected")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${requestStatusFilter === "rejected"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <XCircle
                  size={13}
                  className={
                    requestStatusFilter === "rejected"
                      ? "text-white"
                      : "text-rose-500"
                  }
                />
                Rejected
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${requestStatusFilter === "rejected"
                      ? "bg-white/20 text-white"
                      : "bg-rose-100 text-rose-800"
                    }`}
                >
                  {rejectedCount}
                </span>
              </button>
            </div>

            {/* Search & Franchise select */}
            <div className="flex items-center gap-2 flex-1 max-w-lg justify-end">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <Input
                  type="text"
                  placeholder="Search user, email, franchise..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="pl-8.5 h-9 text-xs bg-white border-slate-200 shadow-sm"
                />
                {requestSearch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setRequestSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
                  >
                    <X size={12} />
                  </Button>
                )}
              </div>

              {/* Franchise select dropdown */}
              <select
                value={requestFranchiseFilter}
                onChange={(e) => setRequestFranchiseFilter(e.target.value)}
                className="h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="all">All Franchises</option>
                {franchises.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Requests Table Card */}
          <Card className="overflow-hidden shadow-sm p-0 border border-slate-200">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-4 sm:p-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {requestStatusFilter === "all"
                    ? "All Franchise Requests"
                    : `${requestStatusFilter.toUpperCase()} Franchise Requests`}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Approve access to activate user login and assign them to the requested franchise.
                </p>
              </div>
              <Badge variant="outline" className="font-semibold text-xs">
                {filteredRequests.length} results
              </Badge>
            </div>

            {isRequestsLoading ? (
              <div className="p-12 text-center space-y-3">
                <Loader2
                  size={32}
                  className="animate-spin text-slate-400 mx-auto"
                />
                <p className="text-xs text-slate-500 font-medium">
                  Loading franchise requests...
                </p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <UserCheck size={44} className="mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-800">
                  No requests found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {requestSearch || requestStatusFilter !== "all"
                    ? "No franchise requests matched the selected filters. Try adjusting your search."
                    : "No franchise user registration requests currently submitted."}
                </p>
                {(requestSearch || requestStatusFilter !== "all") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRequestSearch("");
                      setRequestStatusFilter("all");
                      setRequestFranchiseFilter("all");
                    }}
                    className="mt-2 text-xs"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3.5">User Details</th>
                      <th className="px-5 py-3.5">Requested Franchise</th>
                      <th className="px-5 py-3.5">Date Submitted</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((req) => {
                      const logoUrl = req.brandingLogoUrl
                        ? resolveImageUrl(req.brandingLogoUrl)
                        : null;

                      return (
                        <tr
                          key={req.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          {/* User Column */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center flex-shrink-0 text-xs shadow-inner">
                                {(req.userName || req.userEmail || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">
                                  {req.userName || "Unnamed User"}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {req.userEmail}
                                </p>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  User #{req.userId}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Franchise Column */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center p-0.5 overflow-hidden flex-shrink-0">
                                {logoUrl ? (
                                  <img
                                    src={logoUrl}
                                    alt={req.franchiseName}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display =
                                        "none";
                                    }}
                                  />
                                ) : (
                                  <Building2
                                    size={15}
                                    className="text-slate-400"
                                  />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">
                                  {req.franchiseName ||
                                    `Franchise #${req.franchiseId}`}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  ID: {req.franchiseId}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Date Column */}
                          <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                            <p className="font-medium text-slate-800">
                              {req.createdAt
                                ? new Date(req.createdAt).toLocaleDateString()
                                : "—"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {req.createdAt
                                ? new Date(req.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                                : ""}
                            </p>
                          </td>

                          {/* Status Column */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {req.status === "pending" && (
                              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                                <Clock size={12} className="text-amber-600" />
                                Pending Approval
                              </span>
                            )}
                            {req.status === "approved" && (
                              <div>
                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                                  <CheckCircle2
                                    size={12}
                                    className="text-emerald-600"
                                  />
                                  Approved
                                </span>
                                {req.approvedAt && (
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    on{" "}
                                    {new Date(
                                      req.approvedAt,
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            )}
                            {req.status === "rejected" && (
                              <div>
                                <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                                  <XCircle size={12} className="text-rose-600" />
                                  Rejected
                                </span>
                                {req.rejectionReason && (
                                  <p
                                    className="text-[10px] text-rose-600 truncate max-w-[150px] mt-0.5"
                                    title={req.rejectionReason}
                                  >
                                    "{req.rejectionReason}"
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Actions Column */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* If Pending: show Approve and Reject */}
                              {req.status === "pending" && (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={isUpdatingStatus}
                                    onClick={() => handleApproveRequest(req)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm px-2.5 py-1 h-7"
                                    title="Approve access & activate user account"
                                  >
                                    <Check size={13} />
                                    Approve
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={isUpdatingStatus}
                                    onClick={() => {
                                      setRejectingRequest(req);
                                      setRejectionReasonInput("");
                                    }}
                                    className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold px-2.5 py-1 h-7"
                                    title="Reject franchise access request"
                                  >
                                    <X size={13} />
                                    Reject
                                  </Button>
                                </>
                              )}

                              {/* If Approved: show Revoke/Reject button */}
                              {req.status === "approved" && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={isUpdatingStatus}
                                  onClick={() => {
                                    setRejectingRequest(req);
                                    setRejectionReasonInput("");
                                  }}
                                  className="border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs px-2.5 py-1 h-7"
                                  title="Revoke access and set status to rejected"
                                >
                                  <XCircle size={13} />
                                  Revoke
                                </Button>
                              )}

                              {/* If Rejected: show Re-Approve button */}
                              {req.status === "rejected" && (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={isUpdatingStatus}
                                    onClick={() => handleApproveRequest(req)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 h-7"
                                    title="Re-approve user request"
                                  >
                                    <Check size={13} />
                                    Approve
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={isUpdatingStatus}
                                    onClick={() => handleResetPending(req)}
                                    className="text-slate-600 text-xs px-2 py-1 h-7"
                                    title="Revert status to Pending"
                                  >
                                    <Clock size={12} />
                                    Pending
                                  </Button>
                                </>
                              )}

                              {/* View detail button */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setViewingRequest(req)}
                                className="text-slate-400 hover:text-slate-700 h-7 w-7"
                                title="View full request details"
                              >
                                <Eye size={14} />
                              </Button>
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
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REJECT FRANCHISE ACCESS REQUEST                         */}
      {/* ============================================================== */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 my-auto border border-rose-200 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Reject Franchise Request
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    User will be informed of rejection on next login.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setRejectingRequest(null)}
                className="text-slate-400 hover:text-slate-700 h-7 w-7"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Target info */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">User:</span>
                <strong className="text-slate-900">
                  {rejectingRequest.userName || "User"} (
                  {rejectingRequest.userEmail})
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">
                  Requested Franchise:
                </span>
                <strong className="text-slate-900">
                  {rejectingRequest.franchiseName}
                </strong>
              </div>
            </div>

            {/* Reason Presets */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Quick Reason Presets:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Duplicate account registration",
                  "Incorrect franchise selected",
                  "Account verification incomplete",
                  "Unauthorized branch membership",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionReasonInput(preset)}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-medium transition"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <Label
                htmlFor="rejection-reason"
                className="text-xs font-bold text-slate-700"
              >
                Rejection Reason (Optional):
              </Label>
              <Textarea
                id="rejection-reason"
                rows={3}
                placeholder="Explain why this request is being rejected..."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                disabled={isUpdatingStatus}
                onClick={() => setRejectingRequest(null)}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                type="button"
                disabled={isUpdatingStatus}
                onClick={handleRejectSubmit}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle size={13} />
                    Confirm Rejection
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: VIEW REQUEST DETAILS                                    */}
      {/* ============================================================== */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 my-auto border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Request Details
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Application #{viewingRequest.id}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setViewingRequest(null)}
                className="text-slate-400 hover:text-slate-700 h-7 w-7"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <p className="flex justify-between">
                  <span className="text-slate-400">Applicant:</span>
                  <strong className="text-slate-900">
                    {viewingRequest.userName}
                  </strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Email Address:</span>
                  <strong className="text-slate-900">
                    {viewingRequest.userEmail}
                  </strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">User ID:</span>
                  <strong className="text-slate-700">
                    #{viewingRequest.userId}
                  </strong>
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <p className="flex justify-between">
                  <span className="text-slate-400">Franchise:</span>
                  <strong className="text-slate-900">
                    {viewingRequest.franchiseName}
                  </strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Franchise ID:</span>
                  <strong className="text-slate-700">
                    #{viewingRequest.franchiseId}
                  </strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <strong className="uppercase font-extrabold text-slate-900">
                    {viewingRequest.status}
                  </strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Submitted:</span>
                  <span className="text-slate-700">
                    {viewingRequest.createdAt
                      ? new Date(viewingRequest.createdAt).toLocaleString()
                      : "—"}
                  </span>
                </p>
                {viewingRequest.approvedAt && (
                  <p className="flex justify-between">
                    <span className="text-slate-400">Approved At:</span>
                    <span className="text-slate-700">
                      {new Date(viewingRequest.approvedAt).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>

              {viewingRequest.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 space-y-1">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-rose-600">
                    Rejection Reason
                  </span>
                  <p className="font-medium">
                    {viewingRequest.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewingRequest(null)}
                className="text-xs"
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {viewingRequest.status !== "approved" && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => {
                      const target = viewingRequest;
                      setViewingRequest(null);
                      handleApproveRequest(target);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    <Check size={13} />
                    Approve Request
                  </Button>
                )}

                {viewingRequest.status !== "rejected" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isUpdatingStatus}
                    onClick={() => {
                      const target = viewingRequest;
                      setViewingRequest(null);
                      setRejectingRequest(target);
                      setRejectionReasonInput("");
                    }}
                    className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold"
                  >
                    <XCircle size={13} />
                    Reject Request
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT FRANCHISE FORM                              */}
      {/* ============================================================== */}
      {formMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 my-auto max-h-[92vh] flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {formMode === "create"
                      ? "Add New Franchise"
                      : `Edit Franchise: ${formData.name || "Details"}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formMode === "create"
                      ? "Create a new franchise with custom branding"
                      : "Update franchise details or upload a replacement logo"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={closeFormModal}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Error in modal */}
            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle
                  size={16}
                  className="text-rose-600 flex-shrink-0 mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-bold">Operation failed</p>
                  <p className="mt-0.5">{formError}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleFormSubmit}
              className="overflow-y-auto flex-1 py-4 space-y-4 pr-1"
            >
              {/* Franchise Name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="franchise-name"
                  className="text-xs font-bold text-slate-700"
                >
                  Franchise Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="franchise-name"
                  type="text"
                  required
                  placeholder="Enter Franchise Name.."
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name: newName,
                    }));
                    if (formErrors.name) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }
                  }}
                  className={`text-xs h-10 ${formErrors.name ? "border-rose-400 focus:ring-rose-200" : ""
                    }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Branding Logo Upload */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Branding Logo{" "}
                  {formMode === "create" ? (
                    <span className="text-rose-500">*</span>
                  ) : (
                    <span className="text-slate-400 font-normal">
                      (Optional: upload only to replace)
                    </span>
                  )}
                </Label>

                {logoPreviewUrl ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative p-3 bg-slate-50 border rounded-xl flex items-center justify-between gap-3 transition-all ${
                      isDragging
                        ? "border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-400/40"
                        : "border-slate-200"
                    }`}
                  >
                    {isDragging && (
                      <div className="absolute inset-0 z-10 bg-indigo-600/90 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-xs shadow-lg animate-in fade-in duration-150">
                        <Upload size={18} className="animate-bounce" />
                        Drop new image to replace logo
                      </div>
                    )}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                        <img
                          src={logoPreviewUrl}
                          alt="Logo Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {formData.logoFile
                            ? formData.logoFile.name
                            : "Current Franchise Logo"}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formData.logoFile
                            ? `${(formData.logoFile.size / 1024).toFixed(0)} KB · Ready to upload`
                            : "Preserved on backend"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <label
                        htmlFor="replace-logo-input"
                        className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition shadow-sm"
                      >
                        Change
                      </label>
                      <input
                        id="replace-logo-input"
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      {formData.logoFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={handleRemoveSelectedLogo}
                          className="text-rose-600 hover:bg-rose-50"
                          title="Remove selected file"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="logo-file-input"
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 text-center ${
                      isDragging
                        ? "border-indigo-600 bg-indigo-50/70 scale-[1.01] shadow-md shadow-indigo-100 ring-2 ring-indigo-400/40"
                        : formErrors.logo
                        ? "border-rose-300 bg-rose-50/50 hover:bg-rose-50"
                        : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/20 bg-slate-50/40"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isDragging
                          ? "bg-indigo-600 text-white scale-110 shadow-md shadow-indigo-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Upload
                        size={20}
                        className={isDragging ? "animate-bounce" : ""}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {isDragging ? (
                          <span className="text-indigo-600">
                            Drop logo image here
                          </span>
                        ) : (
                          <>
                            <span className="text-indigo-600 underline decoration-indigo-300 underline-offset-2">
                              Click to upload logo
                            </span>{" "}
                            or drag and drop
                          </>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG, JPEG, or WebP (max 5MB)
                      </p>
                    </div>
                    <input
                      id="logo-file-input"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </label>
                )}

                {formErrors.logo && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    {formErrors.logo}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="franchise-desc"
                  className="text-xs font-bold text-slate-700"
                >
                  Description
                </Label>
                <Textarea
                  id="franchise-desc"
                  rows={3}
                  placeholder="Enter details, territory coverage, or contact specifications for this franchise..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="text-xs resize-none"
                />
              </div>

              {/* Franchise Status Toggle (Enable / Disable) */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <Label
                    htmlFor="franchise-status-toggle"
                    className="text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    Franchise Status
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    {formData.isActive
                      ? "Enabled (Active in registration & login)"
                      : "Disabled (Inactive / Hidden)"}
                  </p>
                </div>
                <button
                  type="button"
                  id="franchise-status-toggle"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: !prev.isActive,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${formData.isActive ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={closeFormModal}
                  className="text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {formMode === "create" ? "Creating..." : "Saving..."}
                    </>
                  ) : formMode === "create" ? (
                    "Create Franchise"
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: VIEW FRANCHISE DETAILS                                 */}
      {/* ============================================================== */}
      {viewingFranchise && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 my-auto border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Franchise Details
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setViewingFranchise(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Logo Display */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
              {viewingFranchise.brandingLogoUrl ? (
                <div className="w-28 h-28 bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                  <img
                    src={resolveImageUrl(viewingFranchise.brandingLogoUrl)}
                    alt={viewingFranchise.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center border border-indigo-100">
                  <Building2 size={36} />
                </div>
              )}
              <h2 className="text-lg font-black text-slate-900 mt-3 text-center">
                {viewingFranchise.name}
              </h2>
            </div>

            {/* Metadata Fields */}
            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex justify-between items-center">
                <span className="font-bold text-slate-500">Status</span>
                <Badge
                  variant={viewingFranchise.isActive ? "success" : "secondary"}
                  className="capitalize font-semibold text-xs"
                >
                  {viewingFranchise.status ||
                    (viewingFranchise.isActive ? "Active" : "Inactive")}
                </Badge>
              </div>

              <div className="pt-2">
                <span className="font-bold text-slate-500 block mb-1">
                  Description
                </span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {viewingFranchise.description || "No description provided."}
                </p>
              </div>

              {viewingFranchise.createdAt && (
                <div className="pt-2 flex justify-between items-center text-slate-500">
                  <span className="font-bold">Created Date</span>
                  <span>
                    {new Date(viewingFranchise.createdAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewingFranchise(null)}
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white"
                onClick={() => {
                  const target = viewingFranchise;
                  setViewingFranchise(null);
                  openEditModal(target);
                }}
              >
                <Edit size={14} />
                Edit Franchise
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DELETION BLOCKED — LINKED RECORDS                       */}
      {/* ============================================================== */}
      {deletionError && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200 border border-amber-200 overflow-hidden">
            {/* Colored top bar */}
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />

            <div className="p-6 space-y-4">
              {/* Icon + Title */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Cannot Delete Franchise
                  </h3>
                  <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
                    Linked records exist
                  </p>
                </div>
              </div>

              {/* Backend message */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed">
                {deletionError}
              </div>

              {/* Action */}
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  onClick={() => setDeletionError(null)}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow shadow-amber-500/20"
                >
                  Understood
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DELETE CONFIRMATION DIALOG                              */}
      {/* ============================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 my-auto border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Delete Franchise
                </h3>
                <p className="text-[11px] text-rose-600 font-semibold">
                  Permanent Action Confirmation
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              Are you sure you want to delete the franchise{" "}
              <strong className="text-slate-900 font-bold">
                "{deleteTarget.name}"
              </strong>
              ? All records, branding references, and associated data will be
              removed.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs shadow-md shadow-rose-600/20"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete Permanently
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FranchiseManagement;