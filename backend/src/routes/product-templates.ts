import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { getErrorResponse } from "../lib/errors.js";
import { requireAuth, requirePermission, getCurrentUser } from "../lib/auth.js";
import { UPLOADS_DIR } from "../lib/canvas/watermark.js";
import {
  listProductTemplates,
  getProductTemplateById,
  saveProductTemplate,
  deleteProductTemplate,
  listProductImages,
  saveProductTemplateImages,
  addOrUpdateProductImage,
  deleteProductImage,
  getProductTemplateFields,
  saveProductCustomization,
  getProductCustomization,
  listProductSubmissions,
  getProductSubmissionById,
  updateProductSubmissionStatus,
  getProductSubmissionThread,
  addProductSubmissionMessage,
  addProductSubmissionFile,
  replaceProductSubmissionFile,
} from "../lib/product-templates.js";

export const productTemplatesRouter = Router();

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Public catalog uses active product templates managed in the admin panel.
productTemplatesRouter.get("/printing-products", async (_req, res) => {
  try {
    const templates = await listProductTemplates(false);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      products: templates.map((template) => ({
        id: template.id,
        name: template.name,
        slug: slugify(template.name) || String(template.id),
        description: template.description,
        widthPx: template.widthPx,
        heightPx: template.heightPx,
        orientation: template.orientation,
        images: (template.images || [])
          .filter((image) => image.isActive !== false)
          .map((image) => ({ id: image.id, imageUrl: image.imageUrl })),
      })),
    });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

// Public product detail (by ID or slug)
productTemplatesRouter.get("/printing-products/:id", async (req, res) => {
  try {
    const rawParam = String(req.params.id || "").trim();
    if (!rawParam) {
      res.status(400).json({ message: "Valid product ID or slug is required." });
      return;
    }

    let template: any = null;
    const numId = Number(rawParam);
    if (Number.isSafeInteger(numId) && numId > 0) {
      template = await getProductTemplateById(numId);
    }

    if (!template || !template.isActive) {
      const allTemplates = await listProductTemplates(false);
      const targetSlug = slugify(rawParam);
      template =
        allTemplates.find(
          (t) =>
            t.isActive &&
            (slugify(t.name) === targetSlug ||
              t.name.toLowerCase().trim() === rawParam.toLowerCase().trim()),
        ) || null;
    }

    if (!template || !template.isActive) {
      res.status(404).json({ message: "Printing product not found." });
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.json({
      product: {
        id: template.id,
        name: template.name,
        slug: slugify(template.name) || String(template.id),
        description: template.description,
        widthPx: template.widthPx,
        heightPx: template.heightPx,
        orientation: template.orientation,
        images: (template.images || [])
          .filter((image: any) => image.isActive !== false)
          .map((image: any) => ({ id: image.id, imageUrl: image.imageUrl })),
        fields: (template.fields || []).map((field: any) => ({
          id: field.id,
          label: field.label,
          fieldType: field.fieldType,
          placeholder: field.placeholder,
          options: field.options,
          isRequired: field.isRequired,
          isEditable: field.isEditable,
        })),
      },
    });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

// Setup product uploads directory
const PRODUCTS_UPLOAD_DIR = path.join(UPLOADS_DIR, "products");
void fs.mkdir(PRODUCTS_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PRODUCTS_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});

// Upload Product Image File
const handleUploadImage = async (req: any, res: any) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No image file provided." });
      return;
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
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
};

productTemplatesRouter.post(
  "/uploadProductImage",
  requireAuth(),
  upload.single("image"),
  handleUploadImage,
);

// List Product Templates
const handleListTemplates = async (req: any, res: any) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const templates = await listProductTemplates(includeInactive);
    res.json({ templates });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
};

productTemplatesRouter.get("/getProductTemplates", handleListTemplates);

// Get Product Template by ID
const handleGetTemplateById = async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ message: "Valid template ID is required." });
      return;
    }
    const template = await getProductTemplateById(id);
    if (!template) {
      res.status(404).json({ message: "Product template not found." });
      return;
    }
    res.json({ template });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
};

productTemplatesRouter.get("/getProductTemplate/:id", handleGetTemplateById);

// Create Product Template
const handleCreateTemplate = async (req: any, res: any) => {
  try {
    await requirePermission(req, "product_templates:manage");

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
          imageUrl: `/uploads/products/${file.filename}`,
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

    const created = await saveProductTemplate(req.body);
    res.status(201).json({
      message: "Product template created successfully",
      template: created,
    });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
};

productTemplatesRouter.post(
  "/createProductTemplate",
  upload.any(),
  requireAuth(),
  handleCreateTemplate,
);

// Update Product Template
const handleUpdateTemplate = async (req: any, res: any) => {
  try {
    await requirePermission(req, "product_templates:manage");
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ message: "Valid template ID is required." });
      return;
    }

    const existing = await getProductTemplateById(id);
    if (!existing) {
      res.status(404).json({ message: "Product template not found." });
      return;
    }

    const files = Array.isArray(req.files) ? req.files : [];
    let updatedImages = req.body.images;
    if (typeof updatedImages === "string") {
      try {
        updatedImages = JSON.parse(updatedImages);
      } catch {
        updatedImages = undefined;
      }
    }

    if (files.length > 0) {
      const imgArray = Array.isArray(updatedImages)
        ? [...updatedImages]
        : existing.images
          ? [...existing.images]
          : [];
      for (const file of files) {
        imgArray.push({
          imageUrl: `/uploads/products/${file.filename}`,
          imageName: file.originalname,
          sortOrder: imgArray.length,
        });
      }
      req.body.images = imgArray;
    } else if (updatedImages !== undefined) {
      req.body.images = updatedImages;
    }

    if (typeof req.body.fields === "string") {
      try {
        req.body.fields = JSON.parse(req.body.fields);
      } catch {
        req.body.fields = [];
      }
    }

    const template = await saveProductTemplate({
      ...req.body,
      id,
    });

    res.json({
      message: "Product template updated successfully",
      template,
    });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
};

productTemplatesRouter.put(
  "/updateProductTemplate/:id",
  upload.any(),
  requireAuth(),
  handleUpdateTemplate,
);
productTemplatesRouter.post(
  "/updateProductTemplate/:id",
  upload.any(),
  requireAuth(),
  handleUpdateTemplate,
);

// Delete Product Template
const handleDeleteTemplate = async (req: any, res: any) => {
  try {
    await requirePermission(req, "product_templates:manage");
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ message: "Valid template ID is required." });
      return;
    }

    const existing = await getProductTemplateById(id);
    if (!existing) {
      res.status(404).json({ message: "Product template not found." });
      return;
    }

    await deleteProductTemplate(id);
    res.json({ message: "Product template deleted successfully" });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
};

productTemplatesRouter.delete(
  "/deleteProductTemplate/:id",
  requireAuth(),
  handleDeleteTemplate,
);
productTemplatesRouter.post(
  "/deleteProductTemplate/:id",
  requireAuth(),
  handleDeleteTemplate,
);

// Images management
productTemplatesRouter.get(
  "/getProductTemplateImages/:id",
  async (req, res) => {
    try {
      const templateId = Number(req.params.id);
      if (!templateId || isNaN(templateId)) {
        res.status(400).json({ message: "Valid template ID is required." });
        return;
      }
      const images = await listProductImages({ templateId });
      res.json({ images });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

productTemplatesRouter.post(
  "/saveProductTemplateImages/:id",
  requireAuth(),
  async (req, res) => {
    try {
      await requirePermission(req, "product_templates:manage");
      const templateId = Number(req.params.id);
      const { images } = req.body;
      if (!Array.isArray(images)) {
        res.status(400).json({ message: "images array is required." });
        return;
      }
      await saveProductTemplateImages(templateId, images);
      res.json({ message: "Product images saved successfully" });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

productTemplatesRouter.delete(
  "/deleteProductImage/:imageId",
  requireAuth(),
  async (req, res) => {
    try {
      await requirePermission(req, "product_templates:manage");
      const imageId = Number(req.params.imageId);
      await deleteProductImage(imageId);
      res.json({ message: "Product image deleted successfully" });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// Fields
productTemplatesRouter.get(
  "/getProductTemplateFields/:id",
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res.status(400).json({ message: "Valid template ID is required." });
        return;
      }
      const fields = await getProductTemplateFields(id);
      res.json({ fields });
    } catch (error) {
      const { message, status } = getErrorResponse(error);
      res.status(status).json({ message });
    }
  },
);

// Save Product Customization (draft / save)
const handleSaveCustomization = async (req: any, res: any) => {
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
      const { templateId: _t, template_id: _t2, ...rest } = req.body;
      values = rest;
    }

    const files = Array.isArray(req.files) ? req.files : [];
    for (const file of files) {
      values[file.fieldname] = `/uploads/products/${file.filename}`;
    }

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

    const result = await saveProductCustomization(
      templateId,
      user.id,
      values,
    );

    res.json({
      message: "Product customization saved successfully",
      customization: result,
    });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
};

productTemplatesRouter.post(
  "/saveProductCustomization",
  upload.any(),
  requireAuth(),
  handleSaveCustomization,
);

// Get Product Customization
const handleGetCustomization = async (req: any, res: any) => {
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
    const customization = await getProductCustomization(templateId, user.id);
    res.json({ customization });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
};

productTemplatesRouter.get(
  "/getProductCustomization/:id",
  requireAuth(),
  handleGetCustomization,
);

// Submit Product Customization
const handleSubmitCustomization = async (req: any, res: any) => {
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
      const { templateId: _t, template_id: _t2, ...rest } = req.body;
      values = rest;
    }

    const files = Array.isArray(req.files) ? req.files : [];
    for (const file of files) {
      values[file.fieldname] = `/uploads/products/${file.filename}`;
    }

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

    const result = await saveProductCustomization(
      templateId,
      user.id,
      values,
      true,
    );

    res.json({
      message: "Product customization submitted successfully",
      submissionId: result.id,
      submission: result,
    });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
};

productTemplatesRouter.post(
  "/submitProductCustomization",
  upload.any(),
  requireAuth(),
  handleSubmitCustomization,
);

// List Submissions for Admin/Staff
const handleListSubmissions = async (req: any, res: any) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    const search = req.query.search ? String(req.query.search) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;

    const submissions = await listProductSubmissions({
      search,
      status,
    });

    res.json({ submissions, total: submissions.length });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
};

productTemplatesRouter.get(
  "/productSubmissions",
  requireAuth(),
  handleListSubmissions,
);

// My Submissions
const handleMySubmissions = async (req: any, res: any) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    const search = req.query.search ? String(req.query.search) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;

    const submissions = await listProductSubmissions({
      userId: user.id,
      search,
      status,
    });

    res.json({ submissions, total: submissions.length });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
};

productTemplatesRouter.get(
  "/myProductSubmissions",
  requireAuth(),
  handleMySubmissions,
);

// Submission Details
const handleGetSubmissionById = async (req: any, res: any) => {
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

    const submission = await getProductSubmissionById(id);
    if (!submission) {
      res.status(404).json({ message: "Product submission not found." });
      return;
    }

    const isSuperAdmin = user.roles?.includes("super_admin");
    const isDesigner = user.roles?.includes("designer");
    if (!isSuperAdmin && !isDesigner && submission.userId !== user.id) {
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
};

productTemplatesRouter.get(
  "/productSubmissions/:id",
  requireAuth(),
  handleGetSubmissionById,
);

// Update Submission Status
const handleUpdateSubmissionStatus = async (req: any, res: any) => {
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

    const submission = await getProductSubmissionById(id);
    if (!submission) {
      res.status(404).json({ message: "Product submission not found." });
      return;
    }

    const isStaff =
      user.roles?.includes("super_admin") || user.roles?.includes("designer");
    const isOwner = submission.userId === user.id;
    if (!isStaff && !isOwner) {
      res.status(403).json({
        message: "You do not have permission to update this submission status.",
      });
      return;
    }

    const result = await updateProductSubmissionStatus(id, status);
    res.json({
      message: "Product submission status updated successfully",
      ...result,
    });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
};

productTemplatesRouter.put(
  "/productSubmissions/:id/status",
  requireAuth(),
  handleUpdateSubmissionStatus,
);
productTemplatesRouter.patch(
  "/productSubmissions/:id/status",
  requireAuth(),
  handleUpdateSubmissionStatus,
);

// Thread Endpoints
const handleGetSubmissionThread = async (req: any, res: any) => {
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

    const submission = await getProductSubmissionById(id);
    if (!submission) {
      res.status(404).json({ message: "Product submission not found." });
      return;
    }

    const isSuperAdmin = user.roles?.includes("super_admin");
    const isDesigner = user.roles?.includes("designer");
    const isStaff = isSuperAdmin || isDesigner;

    if (!isStaff && submission.userId !== user.id) {
      res.status(403).json({
        message: "You do not have permission to access this product submission.",
      });
      return;
    }

    const viewerRole = isSuperAdmin
      ? "super_admin"
      : isDesigner
        ? "designer"
        : "user";

    const thread = await getProductSubmissionThread(id, viewerRole);
    if (!thread) {
      res.status(404).json({ message: "Product submission thread not found." });
      return;
    }

    res.json(thread);
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
};

productTemplatesRouter.get(
  "/productSubmissions/:id/thread",
  requireAuth(),
  handleGetSubmissionThread,
);

// Thread Messages
const handlePostSubmissionMessage = async (req: any, res: any) => {
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

    const submission = await getProductSubmissionById(id);
    if (!submission) {
      res.status(404).json({ message: "Product submission not found." });
      return;
    }

    const isSuperAdmin = user.roles?.includes("super_admin");
    const isDesigner = user.roles?.includes("designer");
    const isStaff = isSuperAdmin || isDesigner;

    if (!isStaff && submission.userId !== user.id) {
      res.status(403).json({
        message: "You do not have permission to post messages on this product submission.",
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

    const senderName =
      isSuperAdmin || isDesigner ? "FBS Admin" : user.name || "Vendor";

    const createdMessage = await addProductSubmissionMessage({
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
};

productTemplatesRouter.post(
  "/productSubmissions/:id/messages",
  requireAuth(),
  handlePostSubmissionMessage,
);

// Add Submission File
const handleAddSubmissionFile = async (req: any, res: any) => {
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

    const submission = await getProductSubmissionById(id);
    if (!submission) {
      res.status(404).json({ message: "Product submission not found." });
      return;
    }

    const isSuperAdmin = user.roles?.includes("super_admin");
    const isDesigner = user.roles?.includes("designer");
    const isStaff = isSuperAdmin || isDesigner;

    if (!isStaff && submission.userId !== user.id) {
      res.status(403).json({
        message: "You do not have permission to add files to this product submission.",
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "No photo file provided." });
      return;
    }

    const fileUrl = `/uploads/products/${req.file.filename}`;
    const fileName = req.body.fileName || req.file.originalname;
    const uploadedByRole = isSuperAdmin
      ? "super_admin"
      : isDesigner
        ? "designer"
        : "user";

    const newFile = await addProductSubmissionFile({
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
};

productTemplatesRouter.post(
  "/productSubmissions/:id/files",
  requireAuth(),
  upload.single("file"),
  handleAddSubmissionFile,
);

// Replace Submission File
const handleReplaceSubmissionFile = async (req: any, res: any) => {
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

    const submission = await getProductSubmissionById(id);
    if (!submission) {
      res.status(404).json({ message: "Product submission not found." });
      return;
    }

    const isSuperAdmin = user.roles?.includes("super_admin");
    const isDesigner = user.roles?.includes("designer");
    const isStaff = isSuperAdmin || isDesigner;

    if (!isStaff && submission.userId !== user.id) {
      res.status(403).json({
        message: "You do not have permission to replace photos on this product submission.",
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "No replacement file provided." });
      return;
    }

    const fileUrl = `/uploads/products/${req.file.filename}`;
    const fileName = req.body.fileName || req.file.originalname;
    const uploadedByRole = isSuperAdmin
      ? "super_admin"
      : isDesigner
        ? "designer"
        : "user";

    const replaced = await replaceProductSubmissionFile({
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
};

productTemplatesRouter.put(
  "/productSubmissions/:id/files/:fileId",
  requireAuth(),
  upload.single("file"),
  handleReplaceSubmissionFile,
);
