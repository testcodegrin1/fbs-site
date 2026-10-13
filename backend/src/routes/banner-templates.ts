import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { getErrorResponse } from "../lib/errors.js";
import { requireAuth, requirePermission } from "../lib/auth.js";
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
