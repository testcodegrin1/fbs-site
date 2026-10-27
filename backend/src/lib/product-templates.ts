import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { query, execute, withTransaction } from "./db.js";
import { AuthError } from "./errors.js";
import type {
  ProductOrientation,
  ProductTemplateFieldModel,
  ProductTemplateImageModel,
  ProductTemplateModel,
  ProductSubmissionDetailModel,
  ProductSubmissionFileModel,
  ProductSubmissionMessageModel,
  ProductSubmissionThreadModel,
} from "./types.js";

function mapProductTemplateImage(row: any): ProductTemplateImageModel {
  return {
    id: Number(row.id),
    templateId: Number(row.template_id),
    imageUrl: row.image_url,
    imageName: row.image_name || null,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    title: row.title || row.image_name || null,
    imageType: row.image_type || "product",
    isActive: row.is_active != null ? Boolean(row.is_active) : true,
  };
}

function mapTemplate(row: any): ProductTemplateModel {
  return {
    id: Number(row.id),
    name: row.name,
    description: row.description,
    widthPx: Number(row.width_px),
    heightPx: Number(row.height_px),
    dimensionsLabel: `${row.width_px}x${row.height_px}`,
    orientation: row.orientation,
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    images: [],
  };
}

function mapField(row: any): ProductTemplateFieldModel {
  let parsedOptions: string[] | null = null;
  if (row.options) {
    if (typeof row.options === "string") {
      try {
        parsedOptions = JSON.parse(row.options);
      } catch {
        parsedOptions = null;
      }
    } else if (Array.isArray(row.options)) {
      parsedOptions = row.options;
    }
  }

  const label = String(row.label || row.field_label || row.field_key || "");

  return {
    id: Number(row.id),
    templateId: Number(row.template_id),
    label,
    fieldLabel: label,
    fieldKey: row.field_key || `field_${row.id}`,
    fieldType: (row.field_type || "text").toLowerCase(),
    placeholder: row.placeholder || null,
    options: parsedOptions,
    isRequired: Boolean(row.is_required),
    isEditable: row.is_editable !== undefined ? Boolean(row.is_editable) : true,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export async function listProductTemplates(
  includeInactive = false,
): Promise<ProductTemplateModel[]> {
  let sql = `SELECT pt.* FROM product_templates pt WHERE 1=1`;
  const params: any[] = [];
  if (!includeInactive) {
    sql += ` AND pt.is_active = 1`;
  }
  sql += ` ORDER BY pt.id DESC`;

  const [rows] = await query<RowDataPacket[]>(sql, params);
  const templates = rows.map(mapTemplate);
  if (templates.length === 0) {
    return [];
  }

  const templateIds = templates.map((t) => t.id);
  const placeholders = templateIds.map(() => "?").join(",");

  let imageRows: RowDataPacket[] = [];
  try {
    const [res] = await query<RowDataPacket[]>(
      `SELECT * FROM product_template_images WHERE template_id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`,
      templateIds,
    );
    imageRows = res;
  } catch {
    imageRows = [];
  }

  const imagesByTemplateId = new Map<number, ProductTemplateImageModel[]>();
  for (const imgRow of imageRows) {
    const tId = Number(imgRow.template_id);
    if (!imagesByTemplateId.has(tId)) {
      imagesByTemplateId.set(tId, []);
    }
    imagesByTemplateId.get(tId)!.push(mapProductTemplateImage(imgRow));
  }

  for (const t of templates) {
    t.images = imagesByTemplateId.get(t.id) || [];
  }

  // Load custom input fields
  try {
    const [fieldRows] = await query<RowDataPacket[]>(
      `SELECT * FROM product_template_fields WHERE template_id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`,
      templateIds,
    );
    const fieldsByTemplateId = new Map<number, ProductTemplateFieldModel[]>();
    for (const fRow of fieldRows) {
      const tId = Number(fRow.template_id);
      if (!fieldsByTemplateId.has(tId)) {
        fieldsByTemplateId.set(tId, []);
      }
      fieldsByTemplateId.get(tId)!.push(mapField(fRow));
    }
    for (const t of templates) {
      t.fields = fieldsByTemplateId.get(t.id) || [];
    }
  } catch {
    try {
      const [fieldRows] = await query<RowDataPacket[]>(
        `SELECT * FROM product_template_fields WHERE template_id IN (${placeholders}) ORDER BY id ASC`,
        templateIds,
      );
      const fieldsByTemplateId = new Map<number, ProductTemplateFieldModel[]>();
      for (const fRow of fieldRows) {
        const tId = Number(fRow.template_id);
        if (!fieldsByTemplateId.has(tId)) {
          fieldsByTemplateId.set(tId, []);
        }
        fieldsByTemplateId.get(tId)!.push(mapField(fRow));
      }
      for (const t of templates) {
        t.fields = fieldsByTemplateId.get(t.id) || [];
      }
    } catch {
      for (const t of templates) {
        t.fields = [];
      }
    }
  }

  return templates;
}

export async function getProductTemplateFields(
  templateId: number,
): Promise<ProductTemplateFieldModel[]> {
  try {
    const [rows] = await query<RowDataPacket[]>(
      `SELECT * FROM product_template_fields WHERE template_id = ? ORDER BY sort_order ASC, id ASC`,
      [templateId],
    );
    return rows.map(mapField);
  } catch {
    try {
      const [rows] = await query<RowDataPacket[]>(
        `SELECT * FROM product_template_fields WHERE template_id = ? ORDER BY id ASC`,
        [templateId],
      );
      return rows.map(mapField);
    } catch {
      return [];
    }
  }
}

export async function listProductImages(filter: {
  templateId?: number;
}): Promise<ProductTemplateImageModel[]> {
  let sql = `SELECT pti.* FROM product_template_images pti`;
  const params: any[] = [];
  if (filter.templateId) {
    sql += ` WHERE pti.template_id = ?`;
    params.push(filter.templateId);
  }
  sql += ` ORDER BY pti.sort_order ASC, pti.id ASC`;
  const [rows] = await query<RowDataPacket[]>(sql, params);
  return rows.map((r) => mapProductTemplateImage(r));
}

export async function saveProductTemplateImages(
  templateId: number,
  images: Array<{
    imageUrl: string;
    imageName?: string | null;
    sortOrder?: number;
  }>,
): Promise<ProductTemplateImageModel[]> {
  await withTransaction(async (conn) => {
    await conn.execute(
      `DELETE FROM product_template_images WHERE template_id = ?`,
      [templateId],
    );

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img.imageUrl?.trim()) continue;

      const imageName =
        img.imageName?.trim() ||
        (img as any).image_name?.trim() ||
        (img as any).name?.trim() ||
        img.imageUrl.trim().split("/").pop() ||
        null;

      await conn.execute(
        `INSERT INTO product_template_images (template_id, image_url, image_name, sort_order)
         VALUES (?, ?, ?, ?)`,
        [templateId, img.imageUrl.trim(), imageName, img.sortOrder ?? i],
      );
    }
  });

  return listProductImages({ templateId });
}

export async function addOrUpdateProductImage(data: {
  id?: number;
  templateId: number;
  imageUrl: string;
  imageName?: string | null;
  sortOrder?: number;
}): Promise<ProductTemplateImageModel> {
  const imageName =
    data.imageName?.trim() ||
    (data as any).image_name?.trim() ||
    data.imageUrl.trim().split("/").pop() ||
    null;

  if (data.id) {
    await execute(
      `UPDATE product_template_images
       SET template_id = ?, image_url = ?, image_name = ?, sort_order = ?
       WHERE id = ?`,
      [data.templateId, data.imageUrl.trim(), imageName, data.sortOrder ?? 0, data.id],
    );
    const [rows] = await query<RowDataPacket[]>(
      `SELECT * FROM product_template_images WHERE id = ?`,
      [data.id],
    );
    return mapProductTemplateImage(rows[0]);
  } else {
    const [res] = await execute<ResultSetHeader>(
      `INSERT INTO product_template_images (template_id, image_url, image_name, sort_order)
       VALUES (?, ?, ?, ?)`,
      [data.templateId, data.imageUrl.trim(), imageName, data.sortOrder ?? 0],
    );
    const [rows] = await query<RowDataPacket[]>(
      `SELECT * FROM product_template_images WHERE id = ?`,
      [res.insertId],
    );
    return mapProductTemplateImage(rows[0]);
  }
}

export async function deleteProductImage(id: number): Promise<boolean> {
  await execute(`DELETE FROM product_template_images WHERE id = ?`, [id]);
  return true;
}

export async function getProductTemplateById(
  id: number,
): Promise<ProductTemplateModel | null> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT pt.* FROM product_templates pt WHERE pt.id = ?`,
    [id],
  );
  if (!rows[0]) return null;
  const template = mapTemplate(rows[0]);
  template.fields = await getProductTemplateFields(id);

  try {
    const [imgRows] = await query<RowDataPacket[]>(
      `SELECT * FROM product_template_images WHERE template_id = ? ORDER BY sort_order ASC, id ASC`,
      [id],
    );
    template.images = imgRows.map((r) => mapProductTemplateImage(r));
  } catch {
    template.images = [];
  }

  return template;
}

export type ProductImageInput =
  | string
  | {
      imageUrl?: string;
      image_url?: string;
      imageName?: string | null;
      image_name?: string | null;
      name?: string | null;
      sortOrder?: number;
      sort_order?: number;
      title?: string | null;
      imageType?: string;
    };

function normalizeImages(
  images: unknown,
): Array<{ imageUrl: string; imageName?: string | null; sortOrder: number }> | undefined {
  if (images === undefined) return undefined;
  if (!Array.isArray(images)) {
    throw new AuthError("Images must be an array.", 400);
  }

  const normalized: Array<{
    imageUrl: string;
    imageName?: string | null;
    sortOrder: number;
  }> = [];
  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    if (typeof item === "string") {
      const url = item.trim();
      if (url) {
        const filename = url.split("/").pop() || null;
        normalized.push({ imageUrl: url, imageName: filename, sortOrder: i });
      }
    } else if (item && typeof item === "object") {
      const url = String(
        (item as any).imageUrl || (item as any).image_url || "",
      ).trim();
      if (url) {
        const rawName =
          (item as any).imageName ??
          (item as any).image_name ??
          (item as any).name ??
          (item as any).title ??
          url.split("/").pop();
        const order =
          (item as any).sortOrder ?? (item as any).sort_order ?? i;
        normalized.push({
          imageUrl: url,
          imageName: rawName ? String(rawName).trim() : null,
          sortOrder: Number(order),
        });
      }
    }
  }
  return normalized;
}

export async function saveProductTemplate(data: {
  id?: number;
  name?: string;
  description?: string | null;
  width_px?: number;
  widthPx?: number;
  height_px?: number;
  heightPx?: number;
  dimensions_label?: string | null;
  dimensionsLabel?: string | null;
  orientation?: ProductOrientation;
  is_active?: boolean | number;
  isActive?: boolean | number;
  fields?: Partial<ProductTemplateFieldModel>[];
  images?: ProductImageInput[];
}): Promise<ProductTemplateModel> {
  const normalizedImages = normalizeImages(data.images);

  const templateId = await withTransaction(async (conn) => {
    let currentId = data.id ? Number(data.id) : undefined;

    if (currentId) {
      // 1. UPDATE EXISTING TEMPLATE
      const [existingRows] = await conn.execute<RowDataPacket[]>(
        `SELECT * FROM product_templates WHERE id = ? FOR UPDATE`,
        [currentId],
      );

      if (!existingRows[0]) {
        throw new AuthError("Product template not found.", 404);
      }
      const existing = existingRows[0];

      const name =
        data.name !== undefined ? data.name.trim() : String(existing.name);
      if (!name) {
        throw new AuthError("Template name is required.", 400);
      }

      const description =
        data.description !== undefined
          ? data.description || null
          : existing.description;

      const widthPx =
        data.widthPx != null
          ? Number(data.widthPx)
          : data.width_px != null
            ? Number(data.width_px)
            : Number(existing.width_px);

      const heightPx =
        data.heightPx != null
          ? Number(data.heightPx)
          : data.height_px != null
            ? Number(data.height_px)
            : Number(existing.height_px);

      const orientation =
        data.orientation || existing.orientation || "landscape";

      const isActive =
        data.isActive !== undefined
          ? data.isActive
            ? 1
            : 0
          : data.is_active !== undefined
            ? data.is_active
              ? 1
              : 0
            : existing.is_active
              ? 1
              : 0;

      await conn.execute(
        `UPDATE product_templates SET 
          name = ?, description = ?, 
          width_px = ?, height_px = ?, 
          orientation = ?, is_active = ?
         WHERE id = ?`,
        [
          name,
          description,
          widthPx,
          heightPx,
          orientation,
          isActive,
          currentId,
        ],
      );

      // Synchronize images in transaction if provided
      if (normalizedImages !== undefined) {
        await conn.execute(
          `DELETE FROM product_template_images WHERE template_id = ?`,
          [currentId],
        );

        for (let i = 0; i < normalizedImages.length; i++) {
          const img = normalizedImages[i];
          await conn.execute(
            `INSERT INTO product_template_images (template_id, image_url, image_name, sort_order)
             VALUES (?, ?, ?, ?)`,
            [currentId, img.imageUrl, img.imageName || null, img.sortOrder ?? i],
          );
        }
      }

      // Synchronize fields in transaction if provided
      if (data.fields !== undefined) {
        await saveFieldsInTx(conn, currentId, data.fields);
      }

      return currentId;
    } else {
      // 2. CREATE NEW TEMPLATE
      const name = (data.name ?? "").trim();
      if (!name) {
        throw new AuthError("Template name is required.", 400);
      }

      const widthPx = Number(data.widthPx || data.width_px || 1080);
      const heightPx = Number(data.heightPx || data.height_px || 1080);
      const orientation = data.orientation || "landscape";
      const description = data.description || null;
      const isActive =
        data.isActive !== undefined
          ? data.isActive
            ? 1
            : 0
          : data.is_active !== undefined
            ? data.is_active
              ? 1
              : 0
            : 1;

      const [insertRes] = await conn.execute<ResultSetHeader>(
        `INSERT INTO product_templates (
          name, description,
          width_px, height_px, orientation, is_active
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          name,
          description,
          widthPx,
          heightPx,
          orientation,
          isActive,
        ],
      );

      currentId = insertRes.insertId;

      if (normalizedImages && normalizedImages.length > 0) {
        for (let i = 0; i < normalizedImages.length; i++) {
          const img = normalizedImages[i];
          await conn.execute(
            `INSERT INTO product_template_images (template_id, image_url, image_name, sort_order)
             VALUES (?, ?, ?, ?)`,
            [currentId, img.imageUrl, img.imageName || null, img.sortOrder ?? i],
          );
        }
      }

      if (data.fields && data.fields.length > 0) {
        await saveFieldsInTx(conn, currentId, data.fields);
      }

      return currentId;
    }
  });

  return (await getProductTemplateById(templateId))!;
}

async function saveFieldsInTx(
  conn: any,
  templateId: number,
  fields: any[],
) {
  await conn.execute(`DELETE FROM product_template_fields WHERE template_id = ?`, [templateId]);

  if (!Array.isArray(fields) || fields.length === 0) return;

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const label = (f.label || f.fieldLabel || f.name || "").trim();
    if (!label) continue;
    const fieldType = (f.fieldType || f.type || "text").toLowerCase();
    const placeholder = f.placeholder ? String(f.placeholder).trim() : null;
    const optionsJson =
      Array.isArray(f.options) && f.options.length > 0
        ? JSON.stringify(
            f.options
              .map((opt: any) =>
                typeof opt === "string"
                  ? opt.trim()
                  : (opt?.label || opt?.value || String(opt)).trim(),
              )
              .filter(Boolean),
          )
        : null;
    const isRequired = f.isRequired || f.is_required ? 1 : 0;
    const isEditable = f.isEditable !== false && f.is_editable !== false ? 1 : 0;
    const sortOrder = f.sortOrder !== undefined ? Number(f.sortOrder) : i;

    try {
      await conn.execute(
        `INSERT INTO product_template_fields (
          template_id, label, field_type, placeholder, options, is_required, is_editable, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [templateId, label, fieldType, placeholder, optionsJson, isRequired, isEditable, sortOrder],
      );
    } catch (insertErr: any) {
      if (
        insertErr.code === "ER_BAD_FIELD_ERROR" ||
        String(insertErr.message).includes("Unknown column")
      ) {
        // Fallback for older table schema
        await conn.execute(
          `INSERT INTO product_template_fields (
            template_id, field_key, field_label, field_type, is_required, is_editable
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [templateId, `field_${i + 1}`, label, fieldType, isRequired, isEditable],
        );
      } else {
        throw insertErr;
      }
    }
  }
}

export async function saveProductTemplateFields(
  templateId: number,
  fields: Partial<ProductTemplateFieldModel>[],
): Promise<ProductTemplateFieldModel[]> {
  await withTransaction(async (conn) => {
    await saveFieldsInTx(conn, templateId, fields);
  });

  return getProductTemplateFields(templateId);
}

export async function deleteProductTemplate(id: number): Promise<boolean> {
  await execute(`DELETE FROM product_templates WHERE id = ?`, [id]);
  return true;
}

// User-side Product Customization Helpers
export async function saveProductCustomization(
  templateId: number,
  userId: number,
  customizationValues: Record<string, any>,
  isNewSubmission = false,
): Promise<any> {
  const template = await getProductTemplateById(templateId);
  if (!template) {
    throw new AuthError("Product template not found.", 404);
  }
  if (!template.isActive) {
    throw new AuthError("This printing product is no longer available.", 400);
  }

  // Validate required fields
  if (template.fields && template.fields.length > 0) {
    for (const f of template.fields) {
      if (f.isRequired && f.isEditable) {
        const val = customizationValues[f.id] ?? customizationValues[f.label];
        if (
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0)
        ) {
          throw new AuthError(`Field "${f.label}" is required.`, 400);
        }
      }
      if (
        f.isEditable &&
        (f.fieldType === "dropdown" || f.fieldType === "radio" || f.fieldType === "select") &&
        Array.isArray(f.options) &&
        f.options.length > 0
      ) {
        const val = customizationValues[f.id] ?? customizationValues[f.label];
        if (val && !f.options.includes(val)) {
          throw new AuthError(`Invalid value "${val}" for field "${f.label}".`, 400);
        }
      }
    }
  }

  const qty = Math.max(
    1,
    Number(
      customizationValues.quantity ??
        customizationValues._quantity ??
        customizationValues.qty ??
        1,
    ),
  );
  customizationValues.quantity = qty;
  customizationValues._quantity = qty;

  const valuesJson = JSON.stringify(customizationValues);

  let custId: number;

  if (!isNewSubmission) {
    const [existing] = await query<RowDataPacket[]>(
      `SELECT id FROM product_customizations WHERE template_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1`,
      [templateId, userId],
    );

    if (existing.length > 0) {
      custId = Number(existing[0].id);
      try {
        await execute(
          `UPDATE product_customizations SET customization_values = ?, status = 'Pending', quantity = ?, updated_at = NOW() WHERE id = ?`,
          [valuesJson, qty, custId],
        );
      } catch (colErr: any) {
        if (
          colErr.code === "ER_BAD_FIELD_ERROR" ||
          String(colErr.message).includes("Unknown column")
        ) {
          try {
            await execute(
              `UPDATE product_customizations SET customization_values = ?, status = 'Pending', updated_at = NOW() WHERE id = ?`,
              [valuesJson, custId],
            );
          } catch {
            await execute(
              `UPDATE product_customizations SET customization_values = ?, updated_at = NOW() WHERE id = ?`,
              [valuesJson, custId],
            );
          }
        } else {
          throw colErr;
        }
      }

      return {
        id: custId,
        templateId,
        userId,
        quantity: qty,
        customizationValues,
        status: "Pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  try {
    const [res] = await execute<ResultSetHeader>(
      `INSERT INTO product_customizations (template_id, user_id, customization_values, status, quantity) VALUES (?, ?, ?, 'Pending', ?)`,
      [templateId, userId, valuesJson, qty],
    );
    custId = res.insertId;
  } catch (colErr: any) {
    if (
      colErr.code === "ER_BAD_FIELD_ERROR" ||
      String(colErr.message).includes("Unknown column")
    ) {
      try {
        const [res] = await execute<ResultSetHeader>(
          `INSERT INTO product_customizations (template_id, user_id, customization_values, status) VALUES (?, ?, ?, 'Pending')`,
          [templateId, userId, valuesJson],
        );
        custId = res.insertId;
      } catch {
        const [res] = await execute<ResultSetHeader>(
          `INSERT INTO product_customizations (template_id, user_id, customization_values) VALUES (?, ?, ?)`,
          [templateId, userId, valuesJson],
        );
        custId = res.insertId;
      }
    } else {
      throw colErr;
    }
  }

  return {
    id: custId,
    templateId,
    userId,
    quantity: qty,
    customizationValues,
    status: "Pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getProductCustomization(
  templateId: number,
  userId: number,
): Promise<any | null> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT * FROM product_customizations WHERE template_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1`,
    [templateId, userId],
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  let vals: Record<string, any> = {};
  try {
    vals =
      typeof r.customization_values === "string"
        ? JSON.parse(r.customization_values)
        : r.customization_values || {};
  } catch {
    vals = {};
  }
  return {
    id: Number(r.id),
    templateId: Number(r.template_id),
    userId: Number(r.user_id),
    customizationValues: vals,
    status: r.status || "Pending",
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  };
}

export async function listProductSubmissions(filter?: {
  search?: string;
  status?: string;
  userId?: number;
}): Promise<any[]> {
  let sql = `
    SELECT 
      pc.*,
      pt.name AS template_name,
      pt.width_px,
      pt.height_px,
      pt.orientation,
      u.name AS user_name,
      u.email AS user_email
    FROM product_customizations pc
    LEFT JOIN product_templates pt ON pc.template_id = pt.id
    LEFT JOIN users u ON pc.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filter?.userId) {
    sql += ` AND pc.user_id = ?`;
    params.push(filter.userId);
  }

  if (filter?.status && filter.status.toLowerCase() !== "all") {
    sql += ` AND LOWER(COALESCE(pc.status, 'Pending')) = LOWER(?)`;
    params.push(filter.status);
  }

  if (filter?.search) {
    const q = `%${filter.search.trim()}%`;
    sql += ` AND (
      CAST(pc.id AS CHAR) LIKE ? OR
      pt.name LIKE ? OR
      u.name LIKE ? OR
      u.email LIKE ?
    )`;
    params.push(q, q, q, q);
  }

  sql += ` ORDER BY pc.id DESC`;

  const [rows] = await query<RowDataPacket[]>(sql, params);
  if (rows.length === 0) return [];

  const templateIds = [
    ...new Set(
      rows.map((r) => Number(r.template_id)).filter((id) => !isNaN(id) && id > 0),
    ),
  ];
  let imageRows: any[] = [];
  if (templateIds.length > 0) {
    const placeholders = templateIds.map(() => "?").join(",");
    try {
      const [imgs] = await query<RowDataPacket[]>(
        `SELECT * FROM product_template_images WHERE template_id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`,
        templateIds,
      );
      imageRows = imgs;
    } catch {
      imageRows = [];
    }
  }

  const imagesByTemplateId = new Map<number, any[]>();
  for (const img of imageRows) {
    const tId = Number(img.template_id);
    if (!imagesByTemplateId.has(tId)) imagesByTemplateId.set(tId, []);
    imagesByTemplateId.get(tId)!.push(mapProductTemplateImage(img));
  }

  const submissionIds = rows.map((r) => Number(r.id)).filter((id) => !isNaN(id) && id > 0);
  const activeFileBySubId = new Map<number, string>();
  if (submissionIds.length > 0) {
    const subPlaceholders = submissionIds.map(() => "?").join(",");
    try {
      const [allFiles] = await query<RowDataPacket[]>(
        `SELECT id, submission_id, file_url, replaced_file_id, sort_order 
         FROM product_submission_files 
         WHERE submission_id IN (${subPlaceholders})
         ORDER BY sort_order ASC, id ASC`,
        submissionIds,
      );
      const replacedSet = new Set<number>();
      for (const f of allFiles) {
        if (f.replaced_file_id) replacedSet.add(Number(f.replaced_file_id));
      }
      for (const f of allFiles) {
        const subId = Number(f.submission_id);
        if (!activeFileBySubId.has(subId) && !replacedSet.has(Number(f.id)) && f.file_url) {
          activeFileBySubId.set(subId, f.file_url);
        }
      }
    } catch {
      // product_submission_files might not be present or populated
    }
  }

  return rows.map((r) => {
    let vals: Record<string, any> = {};
    try {
      vals =
        typeof r.customization_values === "string"
          ? JSON.parse(r.customization_values)
          : r.customization_values || {};
    } catch {
      vals = {};
    }

    const tId = Number(r.template_id);
    const tImages = imagesByTemplateId.get(tId) || [];
    const previewImageUrl =
      activeFileBySubId.get(Number(r.id)) ||
      vals._selectedImageUrl ||
      (vals._selectedImageIndex !== undefined && tImages[Number(vals._selectedImageIndex)]
        ? tImages[Number(vals._selectedImageIndex)].imageUrl
        : tImages[0]?.imageUrl || null);

    const templateName =
      vals._productTitle ||
      (vals._selectedImageIndex !== undefined && tImages.length > 1
        ? `${r.template_name} (#${Number(vals._selectedImageIndex) + 1})`
        : r.template_name || `Product #${tId}`);

    return {
      id: Number(r.id),
      templateId: tId,
      templateName,
      widthPx: Number(r.width_px || 1920),
      heightPx: Number(r.height_px || 1080),
      orientation: r.orientation || "landscape",
      previewImageUrl,
      quantity: Number(
        r.quantity ?? vals.quantity ?? vals._quantity ?? vals.qty ?? 1,
      ),
      userId: Number(r.user_id),
      userName: r.user_name || "Unknown User",
      userEmail: r.user_email || "",
      status: r.status || "Pending",
      customizationValues: vals,
      createdAt: r.created_at
        ? new Date(r.created_at).toISOString()
        : new Date().toISOString(),
      updatedAt: r.updated_at
        ? new Date(r.updated_at).toISOString()
        : new Date().toISOString(),
    };
  });
}

export async function getProductSubmissionById(
  submissionId: number,
): Promise<ProductSubmissionDetailModel | null> {
  const [rows] = await query<RowDataPacket[]>(
    `
    SELECT 
      pc.*,
      pt.name AS template_name,
      pt.width_px,
      pt.height_px,
      pt.orientation,
      u.name AS user_name,
      u.email AS user_email
    FROM product_customizations pc
    LEFT JOIN product_templates pt ON pc.template_id = pt.id
    LEFT JOIN users u ON pc.user_id = u.id
    WHERE pc.id = ?
    LIMIT 1
    `,
    [submissionId],
  );

  if (rows.length === 0) return null;
  const r = rows[0];
  const templateId = Number(r.template_id);

  const fields = await getProductTemplateFields(templateId);

  let imageRows: RowDataPacket[] = [];
  try {
    const [imgs] = await query<RowDataPacket[]>(
      `SELECT * FROM product_template_images WHERE template_id = ? ORDER BY sort_order ASC, id ASC`,
      [templateId],
    );
    imageRows = imgs;
  } catch {
    imageRows = [];
  }
  const images = imageRows.map(mapProductTemplateImage);

  let vals: Record<string, any> = {};
  try {
    vals =
      typeof r.customization_values === "string"
        ? JSON.parse(r.customization_values)
        : r.customization_values || {};
  } catch {
    vals = {};
  }

  const submittedFields: Array<{
    id: number | string;
    label: string;
    fieldType: string;
    value: any;
  }> = [];

  const matchedKeys = new Set<string>();

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const strId = String(f.id);
    const strIndex = String(i);

    let foundVal =
      vals[f.id] ??
      vals[strId] ??
      vals[f.label] ??
      (f.fieldKey ? vals[f.fieldKey] : undefined) ??
      vals[f.label.toLowerCase()] ??
      vals[strIndex];

    if (foundVal !== undefined) {
      matchedKeys.add(strId);
      matchedKeys.add(f.label);
      if (f.fieldKey) matchedKeys.add(f.fieldKey);
      matchedKeys.add(strIndex);
    }

    submittedFields.push({
      id: f.id,
      label: f.label,
      fieldType: f.fieldType || "text",
      value: foundVal !== undefined ? foundVal : "-",
    });
  }

  for (const [key, val] of Object.entries(vals)) {
    if (!matchedKeys.has(key) && key !== "templateId" && !key.startsWith("_")) {
      submittedFields.push({
        id: key,
        label: key,
        fieldType: typeof val === "boolean" ? "checkbox" : "text",
        value: val,
      });
    }
  }

  const templateName =
    vals._productTitle ||
    (vals._selectedImageIndex !== undefined && images.length > 1
      ? `${r.template_name} (#${Number(vals._selectedImageIndex) + 1})`
      : r.template_name || `Product #${templateId}`);

  let previewImageUrl =
    vals._selectedImageUrl ||
    (vals._selectedImageIndex !== undefined && images[Number(vals._selectedImageIndex)]
      ? images[Number(vals._selectedImageIndex)].imageUrl
      : images[0]?.imageUrl || null);

  try {
    const [subFiles] = await query<RowDataPacket[]>(
      `SELECT id, file_url, replaced_file_id FROM product_submission_files WHERE submission_id = ? ORDER BY sort_order ASC, id ASC`,
      [Number(r.id)],
    );
    if (subFiles.length > 0) {
      const rep = new Set<number>();
      for (const f of subFiles) {
        if (f.replaced_file_id) rep.add(Number(f.replaced_file_id));
      }
      const active = subFiles.filter((f) => !rep.has(Number(f.id)));
      if (active.length > 0 && active[0].file_url) {
        previewImageUrl = active[0].file_url;
      }
    }
  } catch {}

  return {
    id: Number(r.id),
    templateId,
    templateName,
    widthPx: Number(r.width_px || 1920),
    heightPx: Number(r.height_px || 1080),
    dimensionsLabel: `${r.width_px || 1920} × ${r.height_px || 1080} px`,
    previewImageUrl,
    images,
    quantity: Number(
      r.quantity ?? vals.quantity ?? vals._quantity ?? vals.qty ?? 1,
    ),
    userId: Number(r.user_id),
    userName: r.user_name || "Unknown User",
    userEmail: r.user_email || "",
    status: r.status || "Pending",
    customizationValues: vals,
    submittedFields,
    createdAt: r.created_at
      ? new Date(r.created_at).toISOString()
      : new Date().toISOString(),
    updatedAt: r.updated_at
      ? new Date(r.updated_at).toISOString()
      : new Date().toISOString(),
  };
}

export async function updateProductSubmissionStatus(
  submissionId: number,
  status: string,
): Promise<{ id: number; status: string }> {
  const allowed = [
    "Pending",
    "In Review",
    "Changes Requested",
    "Approved",
    "Rejected",
    "Completed",
  ];
  const normalized =
    allowed.find((s) => s.toLowerCase() === status.trim().toLowerCase()) ||
    status.trim();

  try {
    await execute(
      `UPDATE product_customizations SET status = ?, updated_at = NOW() WHERE id = ?`,
      [normalized, submissionId],
    );
  } catch (err: any) {
    if (
      err.code === "ER_BAD_FIELD_ERROR" ||
      String(err.message).includes("Unknown column")
    ) {
      console.warn("status column not in product_customizations table yet.");
    } else {
      throw err;
    }
  }

  return { id: submissionId, status: normalized };
}

/**
 * Get product submission thread: combines submission metadata, uploaded files (with versioning & history), and thread messages.
 */
export async function getProductSubmissionThread(
  submissionId: number,
  viewerRole?: string,
): Promise<ProductSubmissionThreadModel | null> {
  const submission = await getProductSubmissionById(submissionId);
  if (!submission) return null;

  // Status Flow: Admin/designer views a pending submission -> automatically mark as "In Review"
  if (
    (viewerRole === "super_admin" || viewerRole === "designer") &&
    submission.status === "Pending"
  ) {
    try {
      await updateProductSubmissionStatus(submissionId, "In Review");
      submission.status = "In Review";
    } catch {
      // Ignore if status column is not ready yet
    }
  }

  // 1. Fetch files from product_submission_files
  let rawFiles: any[] = [];
  try {
    const [fileRows] = await query<RowDataPacket[]>(
      `SELECT 
        psf.*,
        u.name AS uploaded_by_name
       FROM product_submission_files psf
       LEFT JOIN users u ON psf.uploaded_by = u.id
       WHERE psf.submission_id = ?
       ORDER BY psf.sort_order ASC, psf.id ASC`,
      [submissionId],
    );
    rawFiles = fileRows;
  } catch (err: any) {
    console.error("Error fetching product_submission_files:", err);
  }

  // If no rows yet, auto-populate from submission's uploaded photos or preview
  if (rawFiles.length === 0) {
    const initialFiles: Array<{ url: string; name: string }> = [];

    for (const f of submission.submittedFields || []) {
      const val = String(f.value || "");
      if (
        val.startsWith("/uploads/") &&
        val.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i)
      ) {
        initialFiles.push({ url: val, name: f.label || "Submitted Photo" });
      }
    }

    if (initialFiles.length === 0 && submission.previewImageUrl) {
      initialFiles.push({
        url: submission.previewImageUrl,
        name: submission.templateName || "Product Preview",
      });
    }

    if (initialFiles.length > 0) {
      try {
        for (let i = 0; i < initialFiles.length; i++) {
          await execute<ResultSetHeader>(
            `INSERT INTO product_submission_files (submission_id, version, file_url, file_name, uploaded_by, sort_order, replaced_file_id) VALUES (?, 1, ?, ?, ?, ?, NULL)`,
            [
              submissionId,
              initialFiles[i].url,
              initialFiles[i].name,
              submission.userId || 1,
              i,
            ],
          );
        }

        const [refetched] = await query<RowDataPacket[]>(
          `SELECT 
            sf.*,
            u.name AS uploaded_by_name
           FROM product_submission_files sf
           LEFT JOIN users u ON sf.uploaded_by = u.id
           WHERE sf.submission_id = ?
           ORDER BY sf.sort_order ASC, sf.id ASC`,
          [submissionId],
        );
        rawFiles = refetched;
      } catch {
        rawFiles = initialFiles.map((f, idx) => ({
          id: idx + 1,
          submission_id: submissionId,
          version: 1,
          file_url: f.url,
          file_name: f.name,
          uploaded_by: submission.userId,
          uploaded_by_name: submission.userName,
          sort_order: idx,
          replaced_file_id: null,
          created_at: submission.createdAt,
        }));
      }
    }
  }

  // Identify which files have been replaced
  const replacedIds = new Set<number>();
  for (const r of rawFiles) {
    if (r.replaced_file_id) {
      replacedIds.add(Number(r.replaced_file_id));
    }
  }

  const allFilesMap = new Map<number, ProductSubmissionFileModel>();
  for (const r of rawFiles) {
    const fId = Number(r.id);
    allFilesMap.set(fId, {
      id: fId,
      submissionId: Number(r.submission_id),
      version: Number(r.version || 1),
      fileUrl: r.file_url,
      fileName: r.file_name || null,
      uploadedBy: Number(r.uploaded_by),
      uploadedByName: r.uploaded_by_name || null,
      sortOrder: Number(r.sort_order || 0),
      replacedFileId: r.replaced_file_id ? Number(r.replaced_file_id) : null,
      createdAt: r.created_at
        ? new Date(r.created_at).toISOString()
        : new Date().toISOString(),
      isReplaced: replacedIds.has(fId),
      history: [],
    });
  }

  // Active files are those not replaced by newer versions. Attach their replacement history chain.
  const activeFiles: ProductSubmissionFileModel[] = [];
  for (const file of allFilesMap.values()) {
    if (!file.isReplaced) {
      const history: ProductSubmissionFileModel[] = [];
      let curReplacedId = file.replacedFileId;
      while (curReplacedId && allFilesMap.has(curReplacedId)) {
        const past = allFilesMap.get(curReplacedId)!;
        history.push(past);
        curReplacedId = past.replacedFileId;
      }
      file.history = history;
      activeFiles.push(file);
    }
  }

  // 2. Fetch messages from product_submission_messages
  let messages: ProductSubmissionMessageModel[] = [];
  try {
    const [msgRows] = await query<RowDataPacket[]>(
      `SELECT 
        sm.*,
        u.name AS sender_name,
        u.email AS sender_email
       FROM product_submission_messages sm
       LEFT JOIN users u ON sm.sender_user_id = u.id
       WHERE sm.submission_id = ?
       ORDER BY sm.id ASC`,
      [submissionId],
    );

    messages = msgRows.map((m) => ({
      id: Number(m.id),
      submissionId: Number(m.submission_id),
      imageId: m.image_id ? Number(m.image_id) : null,
      senderUserId: Number(m.sender_user_id),
      senderRole: m.sender_role,
      senderName:
        m.sender_name || (m.sender_role === "user" ? "Client" : "FBS Admin"),
      message: m.message,
      createdAt: m.created_at
        ? new Date(m.created_at).toISOString()
        : new Date().toISOString(),
    }));
  } catch (err: any) {
    console.error("Error fetching submission messages:", err);
  }

  if (activeFiles.length > 0 && activeFiles[0].fileUrl) {
    submission.previewImageUrl = activeFiles[0].fileUrl;
  }

  return {
    submission,
    files: activeFiles,
    messages,
  };
}

/**
 * Add a thread message (overall or photo-tile specific).
 */
export async function addProductSubmissionMessage(params: {
  submissionId: number;
  senderUserId: number;
  senderRole: string;
  senderName?: string;
  message: string;
  imageId?: number | null;
  statusAction?: string;
}): Promise<ProductSubmissionMessageModel> {
  const submission = await getProductSubmissionById(params.submissionId);
  if (!submission) {
    throw new AuthError("Product submission not found.", 404);
  }
  if (submission.status === "Approved" || submission.status === "Completed") {
    throw new AuthError(
      "This submission is already approved/completed and is read-only.",
      400,
    );
  }

  const [res] = await execute<ResultSetHeader>(
    `INSERT INTO product_submission_messages (submission_id, image_id, sender_user_id, sender_role, message) VALUES (?, ?, ?, ?, ?)`,
    [
      params.submissionId,
      params.imageId || null,
      params.senderUserId,
      params.senderRole,
      params.message.trim(),
    ],
  );

  // Status Flow
  const normAction = (params.statusAction || "").toLowerCase();
  if (normAction === "approved") {
    await execute(
      `UPDATE product_customizations SET status = 'Approved', updated_at = NOW() WHERE id = ?`,
      [params.submissionId],
    ).catch(() => {});
  } else if (normAction === "changes_requested" || normAction.includes("change")) {
    await execute(
      `UPDATE product_customizations SET status = 'Changes Requested', updated_at = NOW() WHERE id = ?`,
      [params.submissionId],
    ).catch(() => {});
  } else if (params.senderRole === "user") {
    await execute(
      `UPDATE product_customizations SET status = 'In Review', updated_at = NOW() WHERE id = ?`,
      [params.submissionId],
    ).catch(() => {});
  }

  return {
    id: res.insertId,
    submissionId: params.submissionId,
    imageId: params.imageId || null,
    senderUserId: params.senderUserId,
    senderRole: params.senderRole,
    senderName:
      params.senderName || (params.senderRole === "user" ? "Client" : "FBS Admin"),
    message: params.message.trim(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Add a new photo file to the product submission collage.
 */
export async function addProductSubmissionFile(params: {
  submissionId: number;
  uploadedBy: number;
  uploadedByRole: string;
  fileUrl: string;
  fileName?: string;
}): Promise<ProductSubmissionFileModel> {
  const submission = await getProductSubmissionById(params.submissionId);
  if (!submission) {
    throw new AuthError("Product submission not found.", 404);
  }
  if (submission.status === "Approved" || submission.status === "Completed") {
    throw new AuthError(
      "This submission is already approved/completed and is read-only.",
      400,
    );
  }

  let nextOrder = 0;
  try {
    const [orderRows] = await query<RowDataPacket[]>(
      `SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM product_submission_files WHERE submission_id = ?`,
      [params.submissionId],
    );
    nextOrder = Number(orderRows[0]?.max_order ?? -1) + 1;
  } catch {
    nextOrder = 0;
  }

  const [res] = await execute<ResultSetHeader>(
    `INSERT INTO product_submission_files (submission_id, version, file_url, file_name, uploaded_by, sort_order, replaced_file_id) VALUES (?, 1, ?, ?, ?, ?, NULL)`,
    [
      params.submissionId,
      params.fileUrl,
      params.fileName || "Uploaded Photo",
      params.uploadedBy,
      nextOrder,
    ],
  );

  // Status Flow
  if (params.uploadedByRole === "user" || submission.status === "Changes Requested") {
    await execute(
      `UPDATE product_customizations SET status = 'In Review', updated_at = NOW() WHERE id = ?`,
      [params.submissionId],
    ).catch(() => {});
  }

  return {
    id: res.insertId,
    submissionId: params.submissionId,
    version: 1,
    fileUrl: params.fileUrl,
    fileName: params.fileName || "Uploaded Photo",
    uploadedBy: params.uploadedBy,
    sortOrder: nextOrder,
    replacedFileId: null,
    createdAt: new Date().toISOString(),
    isReplaced: false,
    history: [],
  };
}

/**
 * Replace an existing photo tile: creates a new row with incremented version and replaced_file_id.
 */
export async function replaceProductSubmissionFile(params: {
  submissionId: number;
  fileId: number;
  uploadedBy: number;
  uploadedByRole: string;
  fileUrl: string;
  fileName?: string;
}): Promise<ProductSubmissionFileModel> {
  const submission = await getProductSubmissionById(params.submissionId);
  if (!submission) {
    throw new AuthError("Product submission not found.", 404);
  }
  if (submission.status === "Approved" || submission.status === "Completed") {
    throw new AuthError(
      "This submission is already approved/completed and is read-only.",
      400,
    );
  }

  const [existingRows] = await query<RowDataPacket[]>(
    `SELECT * FROM product_submission_files WHERE id = ? AND submission_id = ?`,
    [params.fileId, params.submissionId],
  );

  if (existingRows.length === 0) {
    throw new AuthError("Target photo file to replace not found.", 404);
  }

  const existing = existingRows[0];
  const nextVersion = Number(existing.version || 1) + 1;

  const [res] = await execute<ResultSetHeader>(
    `INSERT INTO product_submission_files (submission_id, version, file_url, file_name, uploaded_by, sort_order, replaced_file_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      params.submissionId,
      nextVersion,
      params.fileUrl,
      params.fileName || existing.file_name || "Updated Photo",
      params.uploadedBy,
      existing.sort_order,
      existing.id,
    ],
  );

  // Status Flow
  if (params.uploadedByRole === "user" || submission.status === "Changes Requested") {
    await execute(
      `UPDATE product_customizations SET status = 'In Review', updated_at = NOW() WHERE id = ?`,
      [params.submissionId],
    ).catch(() => {});
  }

  return {
    id: res.insertId,
    submissionId: params.submissionId,
    version: nextVersion,
    fileUrl: params.fileUrl,
    fileName: params.fileName || existing.file_name || "Updated Photo",
    uploadedBy: params.uploadedBy,
    sortOrder: Number(existing.sort_order || 0),
    replacedFileId: Number(existing.id),
    createdAt: new Date().toISOString(),
    isReplaced: false,
  };
}
