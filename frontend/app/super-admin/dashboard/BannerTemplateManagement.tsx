"use client";

import {
  useState,
  useEffect,
  useMemo,
  FormEvent,
  ChangeEvent,
  DragEvent,
} from "react";
import {
  bannerTemplateApi,
  resolveImageUrl,
  getCandidateImageUrls,
  type BannerTemplateModel,
  type FranchiseOption,
  type CreateBannerTemplatePayload,
  type BannerTemplateField,
  type BannerFieldType,
} from "@/app/lib/client/banner-template-api";
import {
  Button,
  Card,
  Input,
  Textarea,
  Label,
  Badge,
} from "@/app/Components/ui";
import {
  FileImage,
  Layers,
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
  Building2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Info,
  Maximize2,
  Copy,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";

interface FormImageItem {
  id?: number;
  imageUrl: string;
  file?: File | null;
  previewUrl?: string | null;
  sortOrder: number;
}

interface TemplateFormData {
  name: string;
  franchise_id: number | "";
  description: string;
  orientation: "landscape" | "portrait";
  width_px: number;
  height_px: number;
  is_active: boolean;
  images: FormImageItem[];
  fields: BannerTemplateField[];
}

const defaultFormData: TemplateFormData = {
  name: "",
  franchise_id: "",
  description: "",
  orientation: "landscape",
  width_px: 1920,
  height_px: 1080,
  is_active: true,
  images: [],
  fields: [],
};

const FIELD_TYPE_OPTIONS: { value: BannerFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Textarea" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown/Select" },
  { value: "radio", label: "Radio Button" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File Upload" },
];

/**
 * Stateful Image Preview Component with Loading Indicators and Fallback Candidates.
 * Prevents DOM-mutation bugs, guarantees visible rendering, and displays helpful error states.
 */
function ImagePreviewWithFallback({
  src,
  alt,
  className = "w-full h-full object-contain",
  containerClassName = "w-full h-48 rounded-xl bg-slate-50 border border-slate-200/80 overflow-hidden flex items-center justify-center relative",
  rawPath,
  compact = false,
}: {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  rawPath?: string;
  compact?: boolean;
}) {
  const candidates = useMemo(() => {
    if (!src && !rawPath) return [];
    if (src.startsWith("blob:") || src.startsWith("data:")) {
      return [src];
    }
    const list = getCandidateImageUrls(rawPath || src);
    if (!list.includes(src) && src) {
      list.unshift(src);
    }
    return list;
  }, [src, rawPath]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [loadStatus, setLoadStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const [retryKey, setRetryKey] = useState(0);

  const currentAttemptUrl = candidates[candidateIndex] || src;

  // Reset when source or retry key changes
  useEffect(() => {
    setCandidateIndex(0);
    setLoadStatus("loading");
    if (process.env.NODE_ENV !== "production") {
      console.log("[ImagePreview] Target image URL:", src);
    }
  }, [src, retryKey]);

  function handleLoadSuccess() {
    setLoadStatus("loaded");
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[ImagePreview] Image loaded successfully from:",
        currentAttemptUrl,
      );
    }
  }

  function handleLoadError() {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[ImagePreview] Attempt failed for candidate #${candidateIndex + 1}:`,
        currentAttemptUrl,
      );
    }
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1);
      setLoadStatus("loading");
    } else {
      setLoadStatus("error");
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "[ImagePreview] All candidates failed to load for:",
          rawPath || src,
        );
      }
    }
  }

  if (!src) {
    return (
      <div className={containerClassName}>
        <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-2 text-center w-full h-full">
          <ImageIcon size={compact ? 16 : 28} className="text-slate-300" />
          {!compact && <span className="text-xs font-semibold">No image selected</span>}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={containerClassName}>
        {loadStatus === "loading" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50">
            <Loader2 size={13} className="animate-spin text-slate-400" />
          </div>
        )}
        {loadStatus === "error" && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50 text-slate-300"
            title="Image could not be loaded"
          >
            <ImageIcon size={16} />
          </div>
        )}
        <img
          key={`${currentAttemptUrl}-${retryKey}`}
          src={currentAttemptUrl}
          alt={alt}
          className={className}
          style={{
            display: loadStatus === "loaded" ? "block" : "none",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          onLoad={handleLoadSuccess}
          onError={handleLoadError}
        />
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {/* 1. Loading Indicator Overlay */}
      {loadStatus === "loading" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-2xs gap-2 p-3 text-slate-500">
          <Loader2 size={22} className="animate-spin text-slate-700" />
          <span className="text-xs font-medium">Loading image preview...</span>
        </div>
      )}

      {/* 2. Error Fallback UI */}
      {loadStatus === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
          <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-1.5">
            <AlertCircle size={18} />
          </div>
          <p className="text-xs font-bold text-slate-800">
            Image could not be loaded
          </p>
          <p className="text-[11px] text-slate-500 font-mono mt-1 max-w-xs truncate px-2">
            {rawPath || src}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRetryKey((k) => k + 1)}
            className="mt-2.5 h-7 text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:bg-white"
          >
            <RotateCcw size={12} /> Retry
          </Button>
        </div>
      )}

      {/* 3. Actual Image Element */}
      <img
        key={`${currentAttemptUrl}-${retryKey}`}
        src={currentAttemptUrl}
        alt={alt}
        className={className}
        style={{
          display: loadStatus === "loaded" ? "block" : "none",
          objectFit: "contain",
        }}
        onLoad={handleLoadSuccess}
        onError={handleLoadError}
      />
    </div>
  );
}

export function BannerTemplateManagement() {
  const [templates, setTemplates] = useState<BannerTemplateModel[]>([]);
  const [franchises, setFranchises] = useState<FranchiseOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFranchiseFilter, setSelectedFranchiseFilter] =
    useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Global notice toast
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<BannerTemplateModel | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formServerError, setFormServerError] = useState<string | null>(null);

  // Uploaded files and temporary client preview URLs
  const [masterImageFile, setMasterImageFile] = useState<File | null>(null);
  const [masterImagePreview, setMasterImagePreview] = useState<string | null>(
    null,
  );
  const [previewImageFile, setPreviewImageFile] = useState<File | null>(null);
  const [previewImagePreview, setPreviewImagePreview] = useState<string | null>(
    null,
  );

  // View modal state
  const [viewingTemplate, setViewingTemplate] =
    useState<BannerTemplateModel | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<BannerTemplateModel | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-dismiss notice after 6 seconds
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => {
      setNotice(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Clean up blob preview URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (masterImagePreview && masterImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(masterImagePreview);
      }
      if (previewImagePreview && previewImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(previewImagePreview);
      }
    };
  }, [masterImagePreview, previewImagePreview]);

  // Load templates & franchises from backend
  async function loadData(silent = false) {
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setLoadError(null);

    try {
      const [tData, fData] = await Promise.all([
        bannerTemplateApi.getBannerTemplates(),
        bannerTemplateApi.getFranchises().catch((err) => {
          console.warn("Could not load franchises:", err);
          return [] as FranchiseOption[];
        }),
      ]);
      setTemplates(tData);
      setFranchises(fData);
    } catch (err: any) {
      console.error("Failed to load banner templates:", err);
      setLoadError(
        err?.message ||
          "Failed to load banner templates. Please verify the backend connection.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (item.franchiseName &&
          item.franchiseName
            .toLowerCase()
            .includes(searchQuery.toLowerCase().trim())) ||
        (item.dimensionsLabel &&
          item.dimensionsLabel
            .toLowerCase()
            .includes(searchQuery.toLowerCase().trim()));

      const matchesFranchise =
        selectedFranchiseFilter === "all" ||
        String(item.franchiseId) === selectedFranchiseFilter;

      return matchesSearch && matchesFranchise;
    });
  }, [templates, searchQuery, selectedFranchiseFilter]);

  // Open Create Modal
  function handleOpenCreateModal() {
    const firstFranchiseId = franchises.length > 0 ? franchises[0].id : "";

    setMasterImageFile(null);
    setMasterImagePreview(null);
    setPreviewImageFile(null);
    setPreviewImagePreview(null);

    setFormData({
      ...defaultFormData,
      franchise_id: firstFranchiseId,
      images: [],
      fields: [],
    });
    setFormErrors({});
    setFormServerError(null);
    setShowAddModal(true);
  }

  // Open Edit Modal
  async function handleOpenEditModal(template: BannerTemplateModel) {
    setEditingTemplate(template);

    setFormData({
      name: template.name,
      franchise_id: template.franchiseId,
      description: template.description || "",
      orientation: template.orientation || "landscape",
      width_px: template.widthPx || 1920,
      height_px: template.heightPx || 1080,
      is_active: template.isActive,
      images:
        template.images && template.images.length > 0
          ? template.images.map((img, i) => ({
              id: img.id,
              imageUrl: img.imageUrl,
              file: null,
              previewUrl: null,
              sortOrder: img.sortOrder ?? i,
            }))
          : [],
      fields: template.fields && template.fields.length > 0 ? [...template.fields] : [],
    });

    setFormErrors({});
    setFormServerError(null);
    setShowEditModal(true);

    // Fetch fresh single template record in background to ensure all fields are up to date
    try {
      const fresh = await bannerTemplateApi.getBannerTemplate(template.id);
      if (fresh) {
        setFormData((prev) => ({
          ...prev,
          name: fresh.name || prev.name,
          images:
            fresh.images && fresh.images.length > 0
              ? fresh.images.map((img, i) => ({
                  id: img.id,
                  imageUrl: img.imageUrl,
                  file: null,
                  previewUrl: null,
                  sortOrder: img.sortOrder ?? i,
                }))
              : prev.images,
          fields:
            fresh.fields && fresh.fields.length > 0
              ? [...fresh.fields]
              : prev.fields,
        }));
      }
    } catch {
      // Keep existing data if fresh fetch fails
    }
  }

  // Master image file upload handler
  function handleMasterImageFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormServerError("Please upload a valid image (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setFormServerError("Image size must be under 25MB.");
      return;
    }

    if (masterImagePreview && masterImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(masterImagePreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setMasterImageFile(file);
    setMasterImagePreview(objectUrl);
  }

  // Preview image file upload handler
  function handlePreviewImageFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormServerError("Please upload a valid image (PNG, JPG, WebP).");
      return;
    }

    if (previewImagePreview && previewImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(previewImagePreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewImageFile(file);
    setPreviewImagePreview(objectUrl);

    setFormData((prev) => ({
      ...prev,
      preview_image_url: `/uploads/banners/${file.name}`,
    }));
  }

  // Add additional image slot
  function handleAddImageSlot(file?: File) {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          {
            imageUrl: `/uploads/banners/${file.name}`,
            file,
            previewUrl: objectUrl,
            sortOrder: prev.images.length,
          },
        ],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          {
            imageUrl: "",
            file: null,
            previewUrl: null,
            sortOrder: prev.images.length,
          },
        ],
      }));
    }
  }

  // Handle file change on an additional image slot
  function handleAdditionalImageFileChange(
    index: number,
    e: ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setFormData((prev) => {
      const next = [...prev.images];
      next[index] = {
        ...next[index],
        imageUrl: `/uploads/banners/${file.name}`,
        file,
        previewUrl: objectUrl,
      };
      return { ...prev, images: next };
    });
  }

  // Remove additional image slot
  function handleRemoveImageSlot(index: number) {
    setFormData((prev) => {
      const next = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: next.map((img, i) => ({ ...img, sortOrder: i })),
      };
    });
  }

  // Move additional image up
  function handleMoveImageUp(index: number) {
    if (index === 0) return;
    setFormData((prev) => {
      const next = [...prev.images];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return {
        ...prev,
        images: next.map((img, i) => ({ ...img, sortOrder: i })),
      };
    });
  }

  // Move additional image down
  function handleMoveImageDown(index: number) {
    if (index >= formData.images.length - 1) return;
    setFormData((prev) => {
      const next = [...prev.images];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return {
        ...prev,
        images: next.map((img, i) => ({ ...img, sortOrder: i })),
      };
    });
  }

  // Update additional image URL directly
  function handleUpdateImageUrl(index: number, val: string) {
    setFormData((prev) => {
      const next = [...prev.images];
      next[index] = {
        ...next[index],
        imageUrl: val,
        previewUrl: null,
      };
      return { ...prev, images: next };
    });
  }

  // Validate form
  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Template name is required.";
    }

    if (!formData.franchise_id) {
      errors.franchise_id = "Please select a franchise.";
    }

    if (!formData.width_px || Number(formData.width_px) <= 0) {
      errors.width_px = "Width must be a positive number.";
    }

    if (!formData.height_px || Number(formData.height_px) <= 0) {
      errors.height_px = "Height must be a positive number.";
    }

    if (formData.fields && formData.fields.length > 0) {
      for (let i = 0; i < formData.fields.length; i++) {
        const f = formData.fields[i];
        if (!f.label.trim()) {
          errors[`field_${i}`] = `Field #${i + 1} label is required.`;
          setFormServerError(`Field #${i + 1} label cannot be empty.`);
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Handle Create Submit
  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormServerError(null);

    try {
      // 1. Upload any new image files to backend /api/uploadBannerImage
      const uploadedImages = await Promise.all(
        formData.images.map(async (img, idx) => {
          let finalUrl = img.imageUrl.trim();
          let finalName = img.file?.name;
          if (img.file) {
            const uploadRes = await bannerTemplateApi.uploadBannerImage(img.file);
            finalUrl = uploadRes.imageUrl;
            finalName = uploadRes.originalName || uploadRes.filename || img.file.name;
          }
          return {
            imageUrl: finalUrl,
            imageName: finalName || (finalUrl ? finalUrl.split("/").pop() : undefined),
            sortOrder: idx,
          };
        }),
      );

      const validImages = uploadedImages.filter((img) => img.imageUrl !== "");

      // 2. Submit template payload with actual uploaded image URLs
      const payload: CreateBannerTemplatePayload = {
        name: formData.name.trim(),
        franchise_id: Number(formData.franchise_id),
        franchiseId: Number(formData.franchise_id),
        description: formData.description.trim(),
        orientation: formData.orientation,
        width_px: Number(formData.width_px),
        widthPx: Number(formData.width_px),
        height_px: Number(formData.height_px),
        heightPx: Number(formData.height_px),
        is_active: formData.is_active,
        isActive: formData.is_active,
        images: validImages,
        fields: (formData.fields || []).filter((f) => f.label.trim() !== ""),
      };

      await bannerTemplateApi.createBannerTemplate(payload);
      setShowAddModal(false);
      setNotice({
        type: "success",
        message: `Banner template "${formData.name}" created successfully!`,
      });
      await loadData(true);
    } catch (err: any) {
      console.error("Failed to create banner template:", err);
      setFormServerError(
        err?.message ||
          "Failed to create banner template. Please check the backend response.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Edit Submit
  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editingTemplate || !validateForm()) return;

    setIsSubmitting(true);
    setFormServerError(null);

    try {
      // 1. Upload any new image files to backend /api/uploadBannerImage
      const uploadedImages = await Promise.all(
        formData.images.map(async (img, idx) => {
          let finalUrl = img.imageUrl.trim();
          let finalName = img.file?.name;
          if (img.file) {
            const uploadRes = await bannerTemplateApi.uploadBannerImage(img.file);
            finalUrl = uploadRes.imageUrl;
            finalName = uploadRes.originalName || uploadRes.filename || img.file.name;
          }
          return {
            imageUrl: finalUrl,
            imageName: finalName || (finalUrl ? finalUrl.split("/").pop() : undefined),
            sortOrder: idx,
          };
        }),
      );

      const validImages = uploadedImages.filter((img) => img.imageUrl !== "");

      // 2. Submit update payload with actual uploaded image URLs
      const payload: Partial<CreateBannerTemplatePayload> = {
        name: formData.name.trim(),
        franchise_id: Number(formData.franchise_id),
        franchiseId: Number(formData.franchise_id),
        description: formData.description.trim(),
        orientation: formData.orientation,
        width_px: Number(formData.width_px),
        widthPx: Number(formData.width_px),
        height_px: Number(formData.height_px),
        heightPx: Number(formData.height_px),
        is_active: formData.is_active,
        isActive: formData.is_active,
        images: validImages,
        fields: (formData.fields || []).filter((f) => f.label.trim() !== ""),
      };

      await bannerTemplateApi.updateBannerTemplate(editingTemplate.id, payload);
      setShowEditModal(false);
      setNotice({
        type: "success",
        message: `Banner template "${formData.name}" updated successfully!`,
      });
      await loadData(true);
    } catch (err: any) {
      console.error("Failed to update banner template:", err);
      setFormServerError(err?.message || "Failed to update banner template.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Delete Confirmation
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await bannerTemplateApi.deleteBannerTemplate(deleteTarget.id);
      setNotice({
        type: "success",
        message: `Banner template "${deleteTarget.name}" deleted successfully.`,
      });
      setDeleteTarget(null);
      await loadData(true);
    } catch (err: any) {
      console.error("Failed to delete banner template:", err);
      setNotice({
        type: "error",
        message:
          err?.message ||
          "Failed to delete banner template. Endpoint may not be implemented.",
      });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  // Render Image Configuration UI for Add and Edit Modals
  function renderImageUploadSection(mode: "create" | "edit") {
    const inputIdPrefix = mode === "create" ? "create" : "edit";

    return (
      <div className="space-y-5">
        {/* ================================================= */}
        {/* Main Image (MULTI-IMAGE LIST)  */}
        {/* ================================================= */}
        <div className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Layers size={15} className="text-emerald-600" />
                Main Image ({formData.images.length})
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor={`${inputIdPrefix}-add-multi-file`}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 flex items-center gap-1.5 shadow-2xs"
              >
                <Upload size={12} />
                <span>Upload File</span>
              </label>
              <input
                id={`${inputIdPrefix}-add-multi-file`}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAddImageSlot(file);
                }}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddImageSlot()}
                className="h-8 text-xs gap-1 border-slate-200 font-semibold bg-white text-slate-700"
              >
                <Plus size={13} /> Add Path
              </Button>
            </div>
          </div>

          {formData.images.length === 0 ? (
            <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">
              No additional images attached to this template.
            </div>
          ) : (
            <div className="space-y-3">
              {formData.images.map((img, idx) => {
                const effectiveSlotSrc =
                  img.previewUrl ||
                  (img.imageUrl ? resolveImageUrl(img.imageUrl) : "");

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs"
                  >
                    <span className="text-[11px] font-extrabold text-slate-400 w-5 text-center flex-shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Thumbnail Preview */}
                    <div className="w-14 h-12 flex-shrink-0">
                      <ImagePreviewWithFallback
                        src={effectiveSlotSrc}
                        rawPath={img.imageUrl}
                        alt={`Attachment ${idx}`}
                        containerClassName="w-14 h-12 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center relative"
                      />
                    </div>

                    {/* Path Input */}
                    <div className="flex-1 min-w-0">
                      <Input
                        type="text"
                        placeholder="/uploads/banners/..."
                        value={img.imageUrl}
                        onChange={(e) =>
                          handleUpdateImageUrl(idx, e.target.value)
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    {/* Upload file directly to slot */}
                    <label
                      htmlFor={`${inputIdPrefix}-slot-${idx}`}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer flex-shrink-0"
                      title="Upload / Replace image file"
                    >
                      <Upload size={14} />
                    </label>
                    <input
                      id={`${inputIdPrefix}-slot-${idx}`}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                      onChange={(e) => handleAdditionalImageFileChange(idx, e)}
                    />

                    {/* Sort Controls */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveImageUp(idx)}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                        title="Move Up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveImageDown(idx)}
                        disabled={idx === formData.images.length - 1}
                        className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                        title="Move Down"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImageSlot(idx)}
                        className="p-1.5 text-red-400 hover:text-red-600 rounded ml-1"
                        title="Remove Image"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // DYNAMIC CUSTOM INPUT FIELDS: Handlers & UI Builder
  // =========================================================================
  function handleAddField() {
    setFormData((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          label: "",
          fieldType: "text",
          placeholder: "",
          options: [],
          isRequired: false,
          isEditable: true,
          sortOrder: prev.fields.length,
        },
      ],
    }));
  }

  function handleRemoveField(index: number) {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields
        .filter((_, idx) => idx !== index)
        .map((f, idx) => ({ ...f, sortOrder: idx })),
    }));
  }

  function handleMoveField(index: number, direction: "up" | "down") {
    setFormData((prev) => {
      const nextFields = [...prev.fields];
      const targetIdx = direction === "up" ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= nextFields.length) return prev;
      const temp = nextFields[index];
      nextFields[index] = nextFields[targetIdx];
      nextFields[targetIdx] = temp;
      return {
        ...prev,
        fields: nextFields.map((f, idx) => ({ ...f, sortOrder: idx })),
      };
    });
  }

  function handleFieldChange(
    index: number,
    patch: Partial<BannerTemplateField>,
  ) {
    setFormData((prev) => {
      const nextFields = [...prev.fields];
      const current = nextFields[index];
      if (!current) return prev;
      const updated = { ...current, ...patch };

      // Initialize default options when switching to select or radio
      if (
        (patch.fieldType === "select" || patch.fieldType === "radio") &&
        (!updated.options || updated.options.length === 0)
      ) {
        updated.options = ["Option 1", "Option 2"];
      }

      nextFields[index] = updated;
      return { ...prev, fields: nextFields };
    });
  }

  function handleAddOption(fieldIndex: number) {
    setFormData((prev) => {
      const nextFields = [...prev.fields];
      const field = nextFields[fieldIndex];
      if (!field) return prev;
      const curOptions = Array.isArray(field.options) ? [...field.options] : [];
      curOptions.push(`Option ${curOptions.length + 1}`);
      nextFields[fieldIndex] = { ...field, options: curOptions };
      return { ...prev, fields: nextFields };
    });
  }

  function handleOptionChange(
    fieldIndex: number,
    optionIndex: number,
    value: string,
  ) {
    setFormData((prev) => {
      const nextFields = [...prev.fields];
      const field = nextFields[fieldIndex];
      if (!field) return prev;
      const curOptions = Array.isArray(field.options) ? [...field.options] : [];
      curOptions[optionIndex] = value;
      nextFields[fieldIndex] = { ...field, options: curOptions };
      return { ...prev, fields: nextFields };
    });
  }

  function handleRemoveOption(fieldIndex: number, optionIndex: number) {
    setFormData((prev) => {
      const nextFields = [...prev.fields];
      const field = nextFields[fieldIndex];
      if (!field) return prev;
      const curOptions = Array.isArray(field.options) ? [...field.options] : [];
      curOptions.splice(optionIndex, 1);
      nextFields[fieldIndex] = { ...field, options: curOptions };
      return { ...prev, fields: nextFields };
    });
  }

  function handleMoveOption(
    fieldIndex: number,
    optionIndex: number,
    direction: "up" | "down",
  ) {
    setFormData((prev) => {
      const nextFields = [...prev.fields];
      const field = nextFields[fieldIndex];
      if (!field) return prev;
      const curOptions = Array.isArray(field.options) ? [...field.options] : [];
      const targetIdx = direction === "up" ? optionIndex - 1 : optionIndex + 1;
      if (targetIdx < 0 || targetIdx >= curOptions.length) return prev;
      const temp = curOptions[optionIndex];
      curOptions[optionIndex] = curOptions[targetIdx];
      curOptions[targetIdx] = temp;
      nextFields[fieldIndex] = { ...field, options: curOptions };
      return { ...prev, fields: nextFields };
    });
  }

  function renderCustomInputFieldsSection() {
    return (
      <div className="p-5 bg-white border border-slate-200/90 rounded-2xl space-y-4 shadow-xs">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
                CUSTOM INPUT FIELDS
              </h4>
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 bg-slate-50 font-semibold"
              >
                {formData.fields.length}{" "}
                {formData.fields.length === 1 ? "Field" : "Fields"}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configure the fields users can fill for this banner template.
            </p>
          </div>
        </div>

        {/* Empty State */}
        {formData.fields.length === 0 ? (
          <div className="py-8 px-4 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-1.5 bg-slate-50/50">
            <p className="text-xs font-semibold text-slate-600">
              No custom input fields configured yet.
            </p>
            <p className="text-[11px] text-slate-400">
              Click "+ Add Input Field" below to configure dynamic inputs for this template.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.fields.map((field, fIdx) => {
              const hasOptions =
                field.fieldType === "select" || field.fieldType === "radio";
              const showPlaceholder = !["checkbox", "file"].includes(
                field.fieldType,
              );

              return (
                <div
                  key={field.id ? `f-${field.id}` : `f-idx-${fIdx}`}
                  className="p-4 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl space-y-3 transition-colors"
                >
                  {/* Top Bar: Field Number and Actions */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold">
                        #{fIdx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {field.label.trim() ? field.label : `Field #${fIdx + 1}`}
                      </span>
                      {/* Temporarily hidden: Input Type badge */}
                      {/* <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-mono px-1.5 py-0 bg-white"
                      >
                        {field.fieldType}
                      </Badge> */}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveField(fIdx, "up")}
                        disabled={fIdx === 0}
                        className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                        title="Move Up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveField(fIdx, "down")}
                        disabled={fIdx === formData.fields.length - 1}
                        className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                        title="Move Down"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(fIdx)}
                        className="p-1.5 text-red-400 hover:text-red-600 rounded ml-1"
                        title="Delete Field"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* A. Field Label */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">
                      Field Label <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g. Full Name, Email Address, Company Name, Offer Title..."
                      value={field.label}
                      onChange={(e) =>
                        handleFieldChange(fIdx, { label: e.target.value })
                      }
                      className="h-8 text-xs bg-white"
                      required
                    />
                  </div>

                  {/*
                    ===================================================================
                    TEMPORARILY HIDDEN (Can be re-enabled anytime without schema change):
                    1. Input Type dropdown
                    2. Placeholder input
                    ===================================================================
                  */}
                  {/*
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700">
                        Input Type
                      </Label>
                      <select
                        value={field.fieldType}
                        onChange={(e) =>
                          handleFieldChange(fIdx, {
                            fieldType: e.target.value as BannerFieldType,
                          })
                        }
                        className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        {FIELD_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {showPlaceholder && (
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-[11px] font-bold text-slate-700">
                          Placeholder (Optional)
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g. Enter here..."
                          value={field.placeholder || ""}
                          onChange={(e) =>
                            handleFieldChange(fIdx, {
                              placeholder: e.target.value,
                            })
                          }
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    )}
                  </div>
                  */}

                  {/* Checkboxes: Required & Editable */}
                  <div className="flex flex-wrap items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(field.isRequired)}
                        onChange={(e) =>
                          handleFieldChange(fIdx, {
                            isRequired: e.target.checked,
                          })
                        }
                        className="w-3.5 h-3.5 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
                      />
                      <span className="text-xs font-medium text-slate-700">
                        Required Field
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={field.isEditable !== false}
                        onChange={(e) =>
                          handleFieldChange(fIdx, {
                            isEditable: e.target.checked,
                          })
                        }
                        className="w-3.5 h-3.5 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
                      />
                      <span className="text-xs font-medium text-slate-700">
                        Editable by User
                      </span>
                    </label>
                  </div>

                  {/* Options Editor (Temporarily hidden with Input Type dropdown) */}
                  {/*
                  {hasOptions && (
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">
                          Options List ({field.options?.length || 0})
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOption(fIdx)}
                          className="h-6 text-[10px] px-2 font-semibold gap-1 bg-slate-50 border-slate-200"
                        >
                          <Plus size={11} /> Add Option
                        </Button>
                      </div>

                      {!field.options || field.options.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">
                          No options added. Click "+ Add Option" to add selectable options.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {field.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-400 w-4 text-center">
                                {oIdx + 1}.
                              </span>
                              <Input
                                type="text"
                                value={opt}
                                onChange={(e) =>
                                  handleOptionChange(fIdx, oIdx, e.target.value)
                                }
                                placeholder={`Option ${oIdx + 1}`}
                                className="h-7 text-xs bg-slate-50/50 flex-1"
                              />
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMoveOption(fIdx, oIdx, "up")
                                  }
                                  disabled={oIdx === 0}
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                                  title="Move Up"
                                >
                                  <ArrowUp size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMoveOption(fIdx, oIdx, "down")
                                  }
                                  disabled={
                                    oIdx === (field.options?.length || 1) - 1
                                  }
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                                  title="Move Down"
                                >
                                  <ArrowDown size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveOption(fIdx, oIdx)
                                  }
                                  className="p-1 text-red-400 hover:text-red-600 rounded"
                                  title="Remove Option"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  */}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Input Field Button */}
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddField}
            className="w-full h-9 text-xs font-semibold gap-1.5 border-dashed border-slate-300 hover:border-slate-400 text-slate-700 bg-slate-50/50 hover:bg-slate-100"
          >
            <Plus size={14} />
            + Add Input Field
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div
          className={`flex items-start justify-between p-4 rounded-xl border transition-all shadow-sm ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : notice.type === "info"
                ? "bg-blue-50 border-blue-200 text-blue-800"
                : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {notice.type === "success" ? (
              <CheckCircle2
                size={18}
                className="text-emerald-600 flex-shrink-0"
              />
            ) : notice.type === "info" ? (
              <Info size={18} className="text-blue-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
            )}
            <p className="text-sm font-semibold">{notice.message}</p>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-600 ml-4 p-1 rounded-md"
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Page Header Card */}
      <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                <FileImage size={22} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Banner Template Management
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Manage technical banner blueprints, dimension specifications,
                  and multi-image templates.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={isRefreshing || isLoading}
              className="h-10 text-xs font-semibold gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin" : ""}
              />
              <span>Refresh</span>
            </Button>

            <Button
              size="sm"
              onClick={handleOpenCreateModal}
              className="h-10 text-xs font-semibold gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm shadow-slate-900/10"
            >
              <Plus size={15} />
              <span>Add Banner Template</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Filter & Search Toolbar */}
      <Card className="p-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full min-w-0">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <Input
              type="text"
              placeholder="Search by template name, franchise, or dimensions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 h-10 bg-slate-50/50 border-slate-200 text-sm focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Franchise filter dropdown */}
          <div className="w-full md:w-64 flex-shrink-0">
            <select
              value={selectedFranchiseFilter}
              onChange={(e) => setSelectedFranchiseFilter(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            >
              <option value="all">All Franchises ({franchises.length})</option>
              {franchises.map((f) => (
                <option key={f.id} value={String(f.id)}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Active templates count badge */}
          <div className="hidden lg:flex items-center text-xs font-semibold text-slate-500 whitespace-nowrap px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/60">
            <span>
              Showing{" "}
              <strong className="text-slate-900 font-bold">
                {filteredTemplates.length}
              </strong>{" "}
              of {templates.length}
            </span>
          </div>
        </div>
      </Card>

      {/* Main Content: Table / Cards */}
      {isLoading ? (
        <Card className="p-16 flex flex-col items-center justify-center text-center bg-white border border-slate-200/80 rounded-2xl">
          <Loader2 size={36} className="animate-spin text-slate-400 mb-3" />
          <p className="text-sm font-bold text-slate-700">
            Loading banner templates...
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Connecting to backend APIs...
          </p>
        </Card>
      ) : loadError ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center bg-red-50/50 border border-red-200 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Failed to Load Templates
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-md">{loadError}</p>
          </div>
          <Button
            size="sm"
            onClick={() => loadData(false)}
            className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <RefreshCw size={14} /> Retry Connection
          </Button>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card className="p-16 flex flex-col items-center justify-center text-center bg-white border border-slate-200/80 rounded-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <FileImage size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {searchQuery || selectedFranchiseFilter !== "all"
                ? "No Matching Banner Templates"
                : "No Banner Templates Yet"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {searchQuery || selectedFranchiseFilter !== "all"
                ? "Try adjusting your search query or franchise filter."
                : "Get started by adding your first system-wide banner blueprint template."}
            </p>
          </div>
          {searchQuery || selectedFranchiseFilter !== "all" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedFranchiseFilter("all");
              }}
              className="text-xs font-semibold"
            >
              Clear Filters
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleOpenCreateModal}
              className="gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
            >
              <Plus size={14} /> Add First Template
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          {/* Desktop Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Preview</th>
                  <th className="px-5 py-3.5">Template Name</th>
                  <th className="px-5 py-3.5">Franchise</th>
                  <th className="px-5 py-3.5">Dimensions</th>
                  <th className="px-5 py-3.5">Images</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTemplates.map((template) => {
                  return (
                    <tr
                      key={template.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Preview Image Thumbnail */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div
                          onClick={() => setViewingTemplate(template)}
                          className="w-16 h-12 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden relative cursor-pointer group/img flex-shrink-0"
                          title="Click to view details"
                        >
                          <ImagePreviewWithFallback
                            src={
                              template.images &&
                              template.images.length > 0 &&
                              template.images[0].imageUrl
                                ? resolveImageUrl(template.images[0].imageUrl)
                                : ""
                            }
                            rawPath={template.images?.[0]?.imageUrl}
                            alt={template.name}
                            compact={true}
                            containerClassName="w-full h-full relative"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white z-20 pointer-events-none">
                            <Eye size={14} />
                          </div>
                        </div>
                      </td>

                      {/* Template Name & Description */}
                      <td className="px-5 py-3.5">
                        <div className="max-w-xs">
                          <p className="font-bold text-slate-900 text-sm truncate">
                            {template.name}
                          </p>
                          {template.description ? (
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {template.description}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 italic mt-0.5">
                              No description
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Franchise Name */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building2
                            size={13}
                            className="text-slate-400 flex-shrink-0"
                          />
                          <span className="text-xs font-semibold text-slate-700">
                            {template.franchiseName ||
                              `Franchise #${template.franchiseId}`}
                          </span>
                        </div>
                      </td>

                      {/* Dimensions & Orientation */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-800">
                            {template.dimensionsLabel ||
                              `${template.widthPx} x ${template.heightPx} px`}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            {template.orientation}
                          </span>
                        </div>
                      </td>

                      {/* Additional Images Count */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                          <Layers size={13} className="text-slate-400" />
                          <span>
                            {template.images ? template.images.length : 0}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {template.isActive ? (
                          <Badge
                            variant="success"
                            className="text-[11px] font-bold"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[11px] font-bold"
                          >
                            Inactive
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingTemplate(template)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                            title="View Template Details"
                          >
                            <Eye size={15} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(template)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit Template"
                          >
                            <Edit size={15} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(template)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete Template"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: ADD BANNER TEMPLATE                         */}
      {/* ==================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150 my-auto flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                  <FileImage size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Add Banner Template
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define specifications, dimensions, and upload template
                    images.
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSubmitting && setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form
              onSubmit={handleCreateSubmit}
              className="flex-1 overflow-y-auto py-5 pr-1 space-y-5"
            >
              {formServerError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle
                    size={16}
                    className="text-red-600 flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1">{formServerError}</div>
                </div>
              )}

              {/* Row 1: Name & Franchise */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="create-tpl-name"
                    className="text-xs font-bold text-slate-800"
                  >
                    Template Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="create-tpl-name"
                    type="text"
                    required
                    placeholder="e.g. Diwali Mega Sale Banner 2026"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="h-10 text-sm"
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-red-500 font-medium">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="create-tpl-franchise"
                    className="text-xs font-bold text-slate-800"
                  >
                    Franchise <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="create-tpl-franchise"
                    required
                    value={formData.franchise_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        franchise_id: e.target.value
                          ? Number(e.target.value)
                          : "",
                      })
                    }
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  >
                    <option value="">Select a franchise...</option>
                    {franchises.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.franchise_id && (
                    <p className="text-[11px] text-red-500 font-medium">
                      {formErrors.franchise_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Description */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="create-tpl-desc"
                  className="text-xs font-bold text-slate-800"
                >
                  Description
                </Label>
                <Textarea
                  id="create-tpl-desc"
                  rows={2}
                  placeholder="Enter banner template details, promotional context..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="text-sm"
                />
              </div>

              {/* Row 3: Dimensions & Specification */}
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Dimensions & Specification
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">
                      Width (px)
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.width_px}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          width_px: Number(e.target.value),
                        }))
                      }
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">
                      Height (px)
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.height_px}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          height_px: Number(e.target.value),
                        }))
                      }
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">
                      Orientation
                    </Label>
                    <select
                      value={formData.orientation}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          orientation: e.target.value as "landscape" | "portrait",
                        }))
                      }
                      className="w-full h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    >
                      <option value="landscape">Landscape</option>
                      <option value="portrait">Portrait</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 4: Image Management & Upload Section */}
              {renderImageUploadSection("create")}

              {/* Row 4.5: Custom Input Fields Builder */}
              {renderCustomInputFieldsSection()}

              {/* Row 5: Active Status */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  id="create-tpl-active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
                />
                <Label
                  htmlFor="create-tpl-active"
                  className="text-xs font-bold text-slate-800 cursor-pointer"
                >
                  Active Banner Template
                </Label>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="h-10 text-xs font-semibold"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 text-xs font-semibold gap-2 bg-slate-900 hover:bg-slate-800 text-white min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Create Template</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: EDIT BANNER TEMPLATE                        */}
      {/* ==================================================== */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150 my-auto flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Edit size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Edit Banner Template #{editingTemplate.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update template specifications, replace images, and
                    configure attachments.
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSubmitting && setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form
              onSubmit={handleEditSubmit}
              className="flex-1 overflow-y-auto py-5 pr-1 space-y-5"
            >
              {formServerError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle
                    size={16}
                    className="text-red-600 flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1">{formServerError}</div>
                </div>
              )}

              {/* Name & Franchise */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-tpl-name"
                    className="text-xs font-bold text-slate-800"
                  >
                    Template Name
                  </Label>
                  <Input
                    id="edit-tpl-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-tpl-franchise"
                    className="text-xs font-bold text-slate-800"
                  >
                    Franchise
                  </Label>
                  <select
                    id="edit-tpl-franchise"
                    value={formData.franchise_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        franchise_id: e.target.value
                          ? Number(e.target.value)
                          : "",
                      })
                    }
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
                  >
                    {franchises.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-tpl-desc"
                  className="text-xs font-bold text-slate-800"
                >
                  Description
                </Label>
                <Textarea
                  id="edit-tpl-desc"
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="text-sm"
                />
              </div>

              {/* Dimensions */}
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Dimensions & Specification
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">
                      Width (px)
                    </Label>
                    <Input
                      type="number"
                      value={formData.width_px}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          width_px: Number(e.target.value),
                        })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">
                      Height (px)
                    </Label>
                    <Input
                      type="number"
                      value={formData.height_px}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          height_px: Number(e.target.value),
                        })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">
                      Orientation
                    </Label>
                    <select
                      value={formData.orientation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          orientation: e.target.value as
                            | "landscape"
                            | "portrait",
                        })
                      }
                      className="w-full h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="landscape">Landscape</option>
                      <option value="portrait">Portrait</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Image Upload & Edit Section */}
              {renderImageUploadSection("edit")}

              {/* Custom Input Fields Builder */}
              {renderCustomInputFieldsSection()}

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  id="tpl-edit-active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-slate-900 border-slate-300"
                />
                <Label
                  htmlFor="tpl-edit-active"
                  className="text-xs font-bold text-slate-800 cursor-pointer"
                >
                  Active Banner Template
                </Label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSubmitting}
                  className="h-10 text-xs font-semibold"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 text-xs font-semibold gap-2 bg-slate-900 hover:bg-slate-800 text-white min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Edit size={14} />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: VIEW BANNER TEMPLATE DETAILS                */}
      {/* ==================================================== */}
      {viewingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150 my-auto flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Eye size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {viewingTemplate.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Template #{viewingTemplate.id} •{" "}
                    {viewingTemplate.franchiseName ||
                      `Franchise #${viewingTemplate.franchiseId}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingTemplate(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="flex-1 overflow-y-auto py-5 space-y-5">
              {/* Key Specifications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Dimensions
                  </span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block">
                    {viewingTemplate.widthPx} × {viewingTemplate.heightPx} px
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Orientation
                  </span>
                  <span className="text-xs font-bold text-slate-800 capitalize mt-1 block">
                    {viewingTemplate.orientation}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Status
                  </span>
                  <span className="text-xs font-bold mt-1 block">
                    {viewingTemplate.isActive ? (
                      <span className="text-emerald-600">Active</span>
                    ) : (
                      <span className="text-slate-400">Inactive</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Description */}
              {viewingTemplate.description && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700">
                    Description
                  </span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    {viewingTemplate.description}
                  </p>
                </div>
              )}

              {/* Additional Images Gallery */}
              {viewingTemplate.images && viewingTemplate.images.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">
                    Main Image ({viewingTemplate.images.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {viewingTemplate.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 group relative"
                      >
                        <div className="w-full h-28 relative">
                          <ImagePreviewWithFallback
                            src={resolveImageUrl(img.imageUrl)}
                            rawPath={img.imageUrl}
                            alt={`Image #${img.sortOrder ?? idx}`}
                            containerClassName="w-full h-28 bg-white overflow-hidden flex items-center justify-center relative"
                          />
                        </div>
                        <div className="p-2 bg-white text-[10px] font-semibold text-slate-600 truncate border-t">
                          Order #{img.sortOrder ?? idx}: {img.imageUrl}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Input Fields Summary */}
              {viewingTemplate.fields && viewingTemplate.fields.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Configured Custom Fields ({viewingTemplate.fields.length})</span>
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                    {viewingTemplate.fields.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-5 text-center text-slate-400 font-bold text-[11px]">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {f.label}
                          </span>
                          {/* Temporarily hidden: fieldType badge */}
                          {/* <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-mono px-1.5 py-0"
                          >
                            {f.fieldType}
                          </Badge> */}
                          {f.isRequired ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                              Required
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Optional
                            </span>
                          )}
                          {f.isEditable === false && (
                            <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                              Read-Only
                            </Badge>
                          )}
                        </div>
                        {/* Temporarily hidden: Placeholder display */}
                        {/* {f.placeholder && (
                          <span className="text-[11px] text-slate-400 italic">
                            Placeholder: "{f.placeholder}"
                          </span>
                        )} */}
                        {(f.fieldType === "select" || f.fieldType === "radio") &&
                          f.options &&
                          f.options.length > 0 && (
                            <span className="text-[11px] text-slate-500">
                              Options: {f.options.join(", ")}
                            </span>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingTemplate(null)}
                className="text-xs font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: DELETE CONFIRMATION                         */}
      {/* ==================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 size={22} />
            </div>

            <h3 className="font-extrabold text-base text-slate-900">
              Delete Banner Template?
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 font-bold">
                "{deleteTarget.name}"
              </strong>
              ? This action will remove the template record from the database.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="text-xs font-semibold gap-2 min-w-[100px]"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Delete</span>
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
