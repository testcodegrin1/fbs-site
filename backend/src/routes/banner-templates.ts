import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { getErrorResponse } from "../lib/errors.js";
import { requireAuth, requirePermission, getCurrentUser } from "../lib/auth.js";
import { UPLOADS_DIR } from "../lib/canvas/watermark.js";
import {
  listBannerTemplates,
  getBannerTemplateById,
  saveBannerTemplate,
  deleteBannerTemplate,
  listBannerImages,
  saveBannerTemplateImages,
  addOrUpdateBannerImage,
  deleteBannerImage,
  getBannerTemplateFields,
  saveBannerCustomization,
  getBannerCustomization,
  listBannerSubmissions,
  getBannerSubmissionById,
  updateBannerSubmissionStatus,
  getBannerSubmissionThread,
  addBannerSubmissionMessage,
  addBannerSubmissionFile,
  replaceBannerSubmissionFile,
} from "../lib/banner-templates.js";

export const bannerTemplatesRouter = Router();

// Setup banner uploads directory
const BANNERS_UPLOAD_DIR = path.join(UPLOADS_DIR, "banners");
void fs.mkdir(BANNERS_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, BANNERS_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `banner-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});

// POST /api/uploadBannerImage - Upload an image file for banners/templates
bannerTemplatesRouter.post(
  "/uploadBannerImage",
  requireAuth(),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No image file provided." });
        return;
      }

      const imageUrl = `/uploads/banners/${req.file.filename}`;
      res.json({
        imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// GET /api/getBannerTemplates - List templates (filter by franchiseId)
bannerTemplatesRouter.get("/getBannerTemplates", async (req, res) => {
  try {
    const franchiseId = req.query.franchiseId
      ? Number(req.query.franchiseId)
      : undefined;
    const includeInactive = req.query.includeInactive === "true";
    const templates = await listBannerTemplates(franchiseId, includeInactive);
    res.json({ templates });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

// GET /api/getBannerTemplate/:id - Get template by ID with fields and images
bannerTemplatesRouter.get("/getBannerTemplate/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ message: "Valid template ID is required." });
      return;
    }
    const template = await getBannerTemplateById(id);
    if (!template) {
      res.status(404).json({ message: "Banner template not found." });
      return;
    }
    res.json({ template });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

// POST /api/createBannerTemplate - Create new template
bannerTemplatesRouter.post(
  "/createBannerTemplate",
  upload.any(),
  requireAuth(),
  async (req, res) => {
    try {
      const user = await requirePermission(req, "banner_templates:manage");
      const franchiseId = Number(req.body.franchise_id ?? req.body.franchiseId);
      if (!franchiseId || isNaN(franchiseId)) {
        res.status(400).json({ message: "Franchise ID is required." });
        return;
      }

      if (
        !user.roles.includes("super_admin") &&
        user.franchiseId &&
        user.franchiseId !== franchiseId
      ) {
        res.status(403).json({
          message:
            "You do not have permission to create templates for this franchise.",
        });
        return;
      }

      const files = Array.isArray(req.files) ? req.files : [];
      if (files.length > 0) {
        let existingImages = req.body.images;
        if (typeof existingImages === "string") {
          try {
            existingImages = JSON.parse(existingImages);
          } catch {
            existingImages = [];
          }
        }
        if (!Array.isArray(existingImages)) {
          existingImages = [];
        }
        for (const file of files) {
          existingImages.push({
            imageUrl: `/uploads/banners/${file.filename}`,
            imageName: file.originalname,
            sortOrder: existingImages.length,
          });
        }
        req.body.images = existingImages;
      }

      if (typeof req.body.fields === "string") {
        try {
          req.body.fields = JSON.parse(req.body.fields);
        } catch {
          req.body.fields = [];
        }
      }

      await saveBannerTemplate(req.body);
      res.status(201).json({
        message: "Banner template created successfully",
      });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// PUT /api/updateBannerTemplate/:id - Update existing template
bannerTemplatesRouter.put(
  "/updateBannerTemplate/:id",
  upload.any(),
  requireAuth(),
  async (req, res) => {
    try {
      const user = await requirePermission(req, "banner_templates:manage");
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res.status(400).json({ message: "Valid template ID is required." });
        return;
      }

      const existing = await getBannerTemplateById(id);
      if (!existing) {
        res.status(404).json({ message: "Banner template not found." });
        return;
      }

      const franchiseId = Number(
        req.body.franchise_id ?? req.body.franchiseId ?? existing.franchiseId,
      );

      if (!user.roles.includes("super_admin") && user.franchiseId) {
        if (
          user.franchiseId !== existing.franchiseId ||
          user.franchiseId !== franchiseId
        ) {
          res.status(403).json({
            message:
              "You do not have permission to modify templates for this franchise.",
          });
          return;
        }
      }

      const files = Array.isArray(req.files) ? req.files : [];
      if (files.length > 0) {
        let existingImages = req.body.images;
        if (typeof existingImages === "string") {
          try {
            existingImages = JSON.parse(existingImages);
          } catch {
            existingImages = [];
          }
        }
        if (!Array.isArray(existingImages)) {
          existingImages = [];
        }
        for (const file of files) {
          existingImages.push({
            imageUrl: `/uploads/banners/${file.filename}`,
            imageName: file.originalname,
            sortOrder: existingImages.length,
          });
        }
        req.body.images = existingImages;
      }

      if (typeof req.body.fields === "string") {
        try {
          req.body.fields = JSON.parse(req.body.fields);
        } catch {
          req.body.fields = [];
        }
      }

      await saveBannerTemplate({ ...req.body, id, franchiseId });
      res.json({
        message: "Banner template updated successfully",
      });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// DELETE /api/deleteBannerTemplate/:id - Delete template
bannerTemplatesRouter.delete(
  "/deleteBannerTemplate/:id",
  requireAuth(),
  async (req, res) => {
    try {
      const user = await requirePermission(req, "banner_templates:manage");
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res.status(400).json({ message: "Valid template ID is required." });
        return;
      }

      const existing = await getBannerTemplateById(id);
      if (!existing) {
        res.status(404).json({ message: "Banner template not found." });
        return;
      }

      if (
        !user.roles.includes("super_admin") &&
        user.franchiseId &&
        user.franchiseId !== existing.franchiseId
      ) {
        res.status(403).json({
          message: "You do not have permission to delete this template.",
        });
        return;
      }

      await deleteBannerTemplate(id);
      res.json({ message: "Banner template deleted successfully" });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// GET /api/getBannerTemplateImages/:id - List images for a template
bannerTemplatesRouter.get("/getBannerTemplateImages/:id", async (req, res) => {
  try {
    const templateId = Number(req.params.id);
    if (!templateId || isNaN(templateId)) {
      res.status(400).json({ message: "Valid template ID is required." });
      return;
    }
    const images = await listBannerImages({ templateId });
    res.json({ images });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

// POST /api/saveBannerTemplateImages/:id - Batch save/replace images for a template
bannerTemplatesRouter.post(
  "/saveBannerTemplateImages/:id",
  requireAuth(),
  async (req, res) => {
    try {
      await requirePermission(req, "banner_templates:manage");
      const templateId = Number(req.params.id);
      const { franchiseId, images } = req.body;
      if (!franchiseId || !Array.isArray(images)) {
        res
          .status(400)
          .json({ message: "franchiseId and images array are required." });
        return;
      }
      await saveBannerTemplateImages(templateId, franchiseId, images);
      res.json({ message: "Banner images saved successfully" });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// DELETE /api/deleteBannerImage/:imageId - Delete a single banner image
bannerTemplatesRouter.delete(
  "/deleteBannerImage/:imageId",
  requireAuth(),
  async (req, res) => {
    try {
      await requirePermission(req, "banner_templates:manage");
      const imageId = Number(req.params.imageId);
      await deleteBannerImage(imageId);
      res.json({ message: "Banner image deleted successfully" });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// GET /api/getBannerTemplateFields/:id - Get fields for a template
bannerTemplatesRouter.get("/getBannerTemplateFields/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ message: "Valid template ID is required." });
      return;
    }
    const fields = await getBannerTemplateFields(id);
    res.json({ fields });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

// POST /api/saveBannerCustomization - Save user-entered dynamic field values
bannerTemplatesRouter.post(
  "/saveBannerCustomization",
  upload.any(),
  requireAuth(),
  async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }

      const templateId = Number(req.body.templateId ?? req.body.template_id);
      if (!templateId || isNaN(templateId)) {
        res.status(400).json({ message: "Valid templateId is required." });
        return;
      }

      let values: Record<string, any> = {};
      if (req.body.customizationValues) {
        values =
          typeof req.body.customizationValues === "string"
            ? JSON.parse(req.body.customizationValues)
            : req.body.customizationValues;
      } else if (req.body.values) {
        values =
          typeof req.body.values === "string"
            ? JSON.parse(req.body.values)
            : req.body.values;
      } else {
        const {
          templateId: _t,
          template_id: _t2,
          franchiseId: _f,
          franchise_id: _f2,
          ...rest
        } = req.body;
        values = rest;
      }

      // Handle file uploads
      const files = Array.isArray(req.files) ? req.files : [];
      for (const file of files) {
        values[file.fieldname] = `/uploads/banners/${file.filename}`;
      }

      const franchiseId = Number(
        req.body.franchiseId ?? req.body.franchise_id ?? user.franchiseId,
      );
      const quantity = Math.max(
        1,
        Number(
          req.body.quantity ??
            req.body.qty ??
            values.quantity ??
            values._quantity ??
            values.qty ??
            1,
        ),
      );
      values.quantity = quantity;
      values._quantity = quantity;

      const result = await saveBannerCustomization(
        templateId,
        user.id,
        values,
        franchiseId || undefined,
      );

      res.json({
        message: "Banner customization saved successfully",
        customization: result,
      });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// GET /api/getBannerCustomization/:id - Get user saved customization
bannerTemplatesRouter.get(
  "/getBannerCustomization/:id",
  requireAuth(),
  async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }
      const templateId = Number(req.params.id);
      if (!templateId || isNaN(templateId)) {
        res.status(400).json({ message: "Valid template ID is required." });
        return;
      }
      const customization = await getBannerCustomization(templateId, user.id);
      res.json({ customization });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// POST /api/submitBannerCustomization - Alias for submitting customization
bannerTemplatesRouter.post(
  "/submitBannerCustomization",
  upload.any(),
  requireAuth(),
  async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }

      const templateId = Number(req.body.templateId ?? req.body.template_id);
      if (!templateId || isNaN(templateId)) {
        res.status(400).json({ message: "Valid templateId is required." });
        return;
      }

      let values: Record<string, any> = {};
      if (req.body.customizationValues) {
        values =
          typeof req.body.customizationValues === "string"
            ? JSON.parse(req.body.customizationValues)
            : req.body.customizationValues;
      } else if (req.body.values) {
        values =
          typeof req.body.values === "string"
            ? JSON.parse(req.body.values)
            : req.body.values;
      } else {
        const {
          templateId: _t,
          template_id: _t2,
          franchiseId: _f,
          franchise_id: _f2,
          ...rest
        } = req.body;
        values = rest;
      }

      const files = Array.isArray(req.files) ? req.files : [];
      for (const file of files) {
        values[file.fieldname] = `/uploads/banners/${file.filename}`;
      }

      const franchiseId = Number(
        req.body.franchiseId ?? req.body.franchise_id ?? user.franchiseId,
      );
      const quantity = Math.max(
        1,
        Number(
          req.body.quantity ??
            req.body.qty ??
            values.quantity ??
            values._quantity ??
            values.qty ??
            1,
        ),
      );
      values.quantity = quantity;
      values._quantity = quantity;

      const result = await saveBannerCustomization(
        templateId,
        user.id,
        values,
        franchiseId || undefined,
        true,
      );

      res.json({
        message: "Banner customization submitted successfully",
        submissionId: result.id,
        submission: result,
      });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// GET /api/bannerSubmissions - List submissions for Super Admin & Franchise Managers
bannerTemplatesRouter.get(
  "/bannerSubmissions",
  requireAuth(),
  async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }

      const isSuperAdmin = user.roles?.includes("super_admin");
      let franchiseId: number | undefined = undefined;

      if (!isSuperAdmin && user.franchiseId) {
        franchiseId = user.franchiseId;
      } else if (req.query.franchiseId) {
        franchiseId = Number(req.query.franchiseId);
      }

      const search = req.query.search ? String(req.query.search) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;

      const submissions = await listBannerSubmissions({
        search,
        status,
        franchiseId,
      });

      res.json({ submissions, total: submissions.length });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// GET /api/myBannerSubmissions - List submissions for the currently logged-in user
bannerTemplatesRouter.get(
  "/myBannerSubmissions",
  requireAuth(),
  async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }

      const search = req.query.search ? String(req.query.search) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;

      const submissions = await listBannerSubmissions({
        userId: user.id,
        search,
        status,
      });

      res.json({ submissions, total: submissions.length });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// GET /api/bannerSubmissions/:id - Get complete submission detail for Admin modal
bannerTemplatesRouter.get(
  "/bannerSubmissions/:id",
  requireAuth(),
  async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }

      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res.status(400).json({ message: "Valid submission ID is required." });
        return;
      }

      const submission = await getBannerSubmissionById(id);
      if (!submission) {
        res.status(404).json({ message: "Banner submission not found." });
        return;
      }

      // Check authorization if not super_admin
      const isSuperAdmin = user.roles?.includes("super_admin");
      if (
        !isSuperAdmin &&
        submission.userId !== user.id &&
        (!user.franchiseId || user.franchiseId !== submission.franchiseId)
      ) {
        res.status(403).json({
          message: "You do not have permission to view this submission.",
        });
        return;
      }

      res.json({ submission });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// PUT & PATCH /api/bannerSubmissions/:id/status - Update submission status
bannerTemplatesRouter.put(
  "/bannerSubmissions/:id/status",
  requireAuth(),
  async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }
      const id = Number(req.params.id);
      const { status } = req.body;

      if (!id || isNaN(id)) {
        res.status(400).json({ message: "Valid submission ID is required." });
        return;
      }
      if (!status || typeof status !== "string") {
        res.status(400).json({ message: "Valid status string is required." });
        return;
      }

      const submission = await getBannerSubmissionById(id);
      if (!submission) {
        res.status(404).json({ message: "Banner submission not found." });
        return;
      }

      const isStaff = user.roles?.includes("super_admin") || user.roles?.includes("designer");
      const isOwner = submission.userId === user.id;
      if (!isStaff && !isOwner) {
        res.status(403).json({ message: "You do not have permission to update this submission status." });
        return;
      }

      const result = await updateBannerSubmissionStatus(id, status);
      res.json({
        message: "Banner submission status updated successfully",
        ...result,
      });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

bannerTemplatesRouter.patch(
  "/bannerSubmissions/:id/status",
  requireAuth(),
  async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }
      const id = Number(req.params.id);
      const { status } = req.body;

      if (!id || isNaN(id)) {
        res.status(400).json({ message: "Valid submission ID is required." });
        return;
      }
      if (!status || typeof status !== "string") {
        res.status(400).json({ message: "Valid status string is required." });
        return;
      }

      const submission = await getBannerSubmissionById(id);
      if (!submission) {
        res.status(404).json({ message: "Banner submission not found." });
        return;
      }

      const isStaff = user.roles?.includes("super_admin") || user.roles?.includes("designer");
      const isOwner = submission.userId === user.id;
      if (!isStaff && !isOwner) {
        res.status(403).json({ message: "You do not have permission to update this submission status." });
        return;
      }

      const result = await updateBannerSubmissionStatus(id, status);
      res.json({
        message: "Banner submission status updated successfully",
        ...result,
      });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// =============================================================================
// BANNER SUBMISSION THREAD ENDPOINTS
// =============================================================================

// GET /api/bannerSubmissions/:id/thread - Get files and conversation messages together
bannerTemplatesRouter.get(
  "/bannerSubmissions/:id/thread",
  requireAuth(),
  async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }

      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res.status(400).json({ message: "Valid submission ID is required." });
        return;
      }

      const submission = await getBannerSubmissionById(id);
      if (!submission) {
        res.status(404).json({ message: "Banner submission not found." });
        return;
      }

      const isSuperAdmin = user.roles?.includes("super_admin");
      const isDesigner = user.roles?.includes("designer");
      const isStaff = isSuperAdmin || isDesigner;

      // Role check: If regular user, submission.userId MUST match user.id
      if (!isStaff && submission.userId !== user.id) {
        res.status(403).json({
          message: "You do not have permission to access this banner submission.",
        });
        return;
      }

      const viewerRole = isSuperAdmin
        ? "super_admin"
        : isDesigner
          ? "designer"
          : "user";

      const thread = await getBannerSubmissionThread(id, viewerRole);
      if (!thread) {
        res.status(404).json({ message: "Banner submission thread not found." });
        return;
      }

      res.json(thread);
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// POST /api/bannerSubmissions/:id/messages - Post thread reply (overall or per-image)
bannerTemplatesRouter.post(
  "/bannerSubmissions/:id/messages",
  requireAuth(),
  async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }

      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res.status(400).json({ message: "Valid submission ID is required." });
        return;
      }

      const submission = await getBannerSubmissionById(id);
      if (!submission) {
        res.status(404).json({ message: "Banner submission not found." });
        return;
      }

      const isSuperAdmin = user.roles?.includes("super_admin");
      const isDesigner = user.roles?.includes("designer");
      const isStaff = isSuperAdmin || isDesigner;

      // Role check: If regular user, submission.userId MUST match user.id
      if (!isStaff && submission.userId !== user.id) {
        res.status(403).json({
          message: "You do not have permission to post messages on this banner submission.",
        });
        return;
      }

      const { message, imageId, statusAction } = req.body;
      if (!message || typeof message !== "string" || !message.trim()) {
        res.status(400).json({ message: "Message text is required." });
        return;
      }

      const senderRole = isSuperAdmin
        ? "super_admin"
        : isDesigner
          ? "designer"
          : "user";

      const senderName = isSuperAdmin || isDesigner
        ? "FBS Admin"
        : user.name || "Vendor";

      const createdMessage = await addBannerSubmissionMessage({
        submissionId: id,
        senderUserId: user.id,
        senderRole,
        senderName,
        message,
        imageId: imageId ? Number(imageId) : null,
        statusAction: typeof statusAction === "string" ? statusAction : undefined,
      });

      res.status(201).json({
        message: "Message posted successfully.",
        data: createdMessage,
      });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// POST /api/bannerSubmissions/:id/files - Upload and append a new photo
bannerTemplatesRouter.post(
  "/bannerSubmissions/:id/files",
  requireAuth(),
  upload.single("file"),
  async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }

      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res.status(400).json({ message: "Valid submission ID is required." });
        return;
      }

      const submission = await getBannerSubmissionById(id);
      if (!submission) {
        res.status(404).json({ message: "Banner submission not found." });
        return;
      }

      const isSuperAdmin = user.roles?.includes("super_admin");
      const isDesigner = user.roles?.includes("designer");
      const isStaff = isSuperAdmin || isDesigner;

      // Role check: If regular user, submission.userId MUST match user.id
      if (!isStaff && submission.userId !== user.id) {
        res.status(403).json({
          message: "You do not have permission to add files to this banner submission.",
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({ message: "No photo file provided." });
        return;
      }

      const fileUrl = `/uploads/banners/${req.file.filename}`;
      const fileName = req.body.fileName || req.file.originalname;
      const uploadedByRole = isSuperAdmin
        ? "super_admin"
        : isDesigner
          ? "designer"
          : "user";

      const newFile = await addBannerSubmissionFile({
        submissionId: id,
        uploadedBy: user.id,
        uploadedByRole,
        fileUrl,
        fileName,
      });

      res.status(201).json({
        message: "Photo added successfully.",
        file: newFile,
      });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// PUT /api/bannerSubmissions/:id/files/:fileId - Replace an existing photo tile
bannerTemplatesRouter.put(
  "/bannerSubmissions/:id/files/:fileId",
  requireAuth(),
  upload.single("file"),
  async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }

      const id = Number(req.params.id);
      const fileId = Number(req.params.fileId);
      if (!id || isNaN(id) || !fileId || isNaN(fileId)) {
        res.status(400).json({
          message: "Valid submission ID and file ID are required.",
        });
        return;
      }

      const submission = await getBannerSubmissionById(id);
      if (!submission) {
        res.status(404).json({ message: "Banner submission not found." });
        return;
      }

      const isSuperAdmin = user.roles?.includes("super_admin");
      const isDesigner = user.roles?.includes("designer");
      const isStaff = isSuperAdmin || isDesigner;

      // Role check: If regular user, submission.userId MUST match user.id
      if (!isStaff && submission.userId !== user.id) {
        res.status(403).json({
          message: "You do not have permission to replace photos on this banner submission.",
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({ message: "No replacement file provided." });
        return;
      }

      const fileUrl = `/uploads/banners/${req.file.filename}`;
      const fileName = req.body.fileName || req.file.originalname;
      const uploadedByRole = isSuperAdmin
        ? "super_admin"
        : isDesigner
          ? "designer"
          : "user";

      const replaced = await replaceBannerSubmissionFile({
        submissionId: id,
        fileId,
        uploadedBy: user.id,
        uploadedByRole,
        fileUrl,
        fileName,
      });

      res.json({
        message: "Photo replaced successfully.",
        file: replaced,
      });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

