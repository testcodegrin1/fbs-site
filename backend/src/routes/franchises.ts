import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { getErrorResponse } from "../lib/errors.js";
import { requireAuth, requirePermission } from "../lib/auth.js";
import { UPLOADS_DIR } from "../lib/canvas/watermark.js";
import {
  listFranchises,
  getFranchiseById,
  createFranchise,
  updateFranchise,
  deleteFranchise,
} from "../lib/franchises.js";

export const franchisesRouter = Router();

// Setup franchise uploads directory
const FRANCHISES_UPLOAD_DIR = path.join(UPLOADS_DIR, "franchises");
void fs.mkdir(FRANCHISES_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, FRANCHISES_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `franchise-logo-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

function getUploadedLogoUrl(req: any): string | undefined {
  if (req.file) {
    return `/uploads/franchises/${req.file.filename}`;
  }
  if (Array.isArray(req.files) && req.files.length > 0) {
    return `/uploads/franchises/${req.files[0].filename}`;
  }
  return req.body?.brandingLogoUrl;
}

// GET /api/franchises/getFranchises - List all franchises
franchisesRouter.get("/getFranchises", async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive !== "false";
    const franchises = await listFranchises(includeInactive);
    res.json({ franchises });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

// GET /api/franchises/getFranchise/:id - Get franchise by ID
franchisesRouter.get("/getFranchises/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const franchise = await getFranchiseById(id);
    if (!franchise) {
      res.status(404).json({ message: "Franchise not found." });
      return;
    }
    res.json({ franchise });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

// POST /api/franchises/createFranchise - Create new franchise
franchisesRouter.post(
  "/createFranchise",
  upload.any(),
  requireAuth(),
  async (req, res) => {
    try {
      await requirePermission(req, "franchises:manage");
      const { name, description, isActive } = req.body;
      const brandingLogoUrl = getUploadedLogoUrl(req);
      const is_active =
        isActive != null
          ? String(isActive) === "true" || isActive === true || isActive === 1 || isActive === "1"
          : true;
      await createFranchise({
        name,
        brandingLogoUrl,
        description,
        isActive: is_active,
      });
      res.status(201).json({ message: "Franchise created successfully" });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// PUT /api/franchises/updateFranchise/:id - Update franchise
franchisesRouter.put(
  "/updateFranchise/:id",
  upload.any(),
  requireAuth(),
  async (req, res) => {
    try {
      await requirePermission(req, "franchises:manage");
      const id = Number(req.params.id);
      const { name, description, isActive } = req.body;
      const brandingLogoUrl = getUploadedLogoUrl(req);
      await updateFranchise(id, {
        name,
        brandingLogoUrl,
        description,
        isActive:
          isActive != null
            ? String(isActive) === "true" || isActive === true || isActive === 1
            : undefined,
      });
      res.json({ message: "Franchise updated successfully" });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// DELETE /api/franchises/deleteFranchise/:id - Delete franchise
franchisesRouter.delete(
  "/deleteFranchise/:id",
  requireAuth(),
  async (req, res) => {
    try {
      await requirePermission(req, "franchises:manage");
      const id = Number(req.params.id);
      await deleteFranchise(id);
      res.json({ message: "Franchise deleted successfully" });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);
