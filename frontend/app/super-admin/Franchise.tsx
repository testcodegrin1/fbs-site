"use client";

import { useState, useEffect, useMemo, ChangeEvent, FormEvent } from "react";
import {
  franchiseApi,
  resolveImageUrl,
  type FranchiseModel,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // View modal state
  const [viewingFranchise, setViewingFranchise] = useState<FranchiseModel | null>(
    null,
  );

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<FranchiseModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        err instanceof Error ? err.message : "Unable to load franchise records.";
      setLoadError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadFranchises();
  }, []);

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
      isActive: franchise.isActive !== undefined ? Boolean(franchise.isActive) : true,
    });
    setFormErrors({});
    setLogoPreviewUrl(
      franchise.brandingLogoUrl
        ? resolveImageUrl(franchise.brandingLogoUrl)
        : null,
    );
    setEditingId(franchise.id);
    setFormError(null);
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
  }

  // Handle Logo File Selection
  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFormErrors((prev) => ({
        ...prev,
        logo: "Please upload a PNG, JPG, JPEG, or WebP image.",
      }));
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors((prev) => ({
        ...prev,
        logo: "Logo file size must be less than 5MB.",
      }));
      return;
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
      setNotice({
        type: "error",
        message: msg,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Top Banner Notice */}
      {notice && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border animate-in fade-in slide-in-from-top duration-200 ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
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
            <Loader2 size={36} className="mx-auto text-indigo-600 animate-spin" />
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
            <p className="text-xs text-slate-500 max-w-md mx-auto">{loadError}</p>
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
              {searchQuery ? "No matching franchises found" : "No franchises yet"}
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
                  <th className="px-5 py-3.5 font-semibold w-52">Franchise Name</th>
                  <th className="px-5 py-3.5 font-semibold w-64 md:w-80">Description</th>
                  <th className="px-5 py-3.5 font-semibold w-32">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
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
                                (e.target as HTMLElement).style.display = "none";
                                const parent = (e.target as HTMLElement).parentElement;
                                if (parent && !parent.querySelector(".fallback-icon")) {
                                  const span = document.createElement("span");
                                  span.className =
                                    "fallback-icon text-slate-400 font-bold text-xs";
                                  span.textContent = f.name.slice(0, 2).toUpperCase();
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
                <AlertCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
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
                <Label htmlFor="franchise-name" className="text-xs font-bold text-slate-700">
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
                  className={`text-xs h-10 ${
                    formErrors.name ? "border-rose-400 focus:ring-rose-200" : ""
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
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
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
                    className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center ${formErrors.logo
                      ? "border-rose-300 bg-rose-50/50 hover:bg-rose-50"
                      : "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20"
                      }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                      <Upload size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Click to upload logo or drag and drop
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
                <Label htmlFor="franchise-desc" className="text-xs font-bold text-slate-700">
                  Description
                </Label>
                <Textarea
                  id="franchise-desc"
                  rows={3}
                  placeholder="Enter details, territory coverage, or contact specifications for this franchise..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="text-xs resize-none"
                />
              </div>

              {/* Franchise Status Toggle (Enable / Disable) */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <Label htmlFor="franchise-status-toggle" className="text-xs font-bold text-slate-800 cursor-pointer">
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
                    setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    formData.isActive ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? "translate-x-6" : "translate-x-1"
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
                  <span>{new Date(viewingFranchise.createdAt).toLocaleString()}</span>
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
              </strong>?
              All records, branding references, and associated data will be removed.
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
