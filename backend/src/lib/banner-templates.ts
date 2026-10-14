import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { query, execute, withTransaction } from "./db.js";
import { AuthError } from "./errors.js";
import { getFranchiseById } from "./franchises.js";
import type {
  BannerImageModel,
  BannerOrientation,
  BannerTemplateFieldModel,
  BannerTemplateImageModel,
  BannerTemplateModel,
  BannerSubmissionDetailModel,
} from "./types.js";

function mapBannerTemplateImage(
  row: any,
  franchiseId?: number,
): BannerTemplateImageModel {
  return {
    id: Number(row.id),
    templateId: Number(row.template_id),
    imageUrl: row.image_url,
    imageName: row.image_name || null,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    title: row.title || row.image_name || null,
    imageType: row.image_type || "banner",
    franchiseId:
      franchiseId ?? (row.franchise_id ? Number(row.franchise_id) : undefined),
    isActive: row.is_active != null ? Boolean(row.is_active) : true,
  };
}

function mapTemplate(row: any): BannerTemplateModel {
  return {
    id: Number(row.id),
    franchiseId: Number(row.franchise_id),
    franchiseName: row.franchise_name,
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

function mapField(row: any): BannerTemplateFieldModel {
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

export async function listBannerTemplates(
  franchiseId?: number,
  includeInactive = false,
): Promise<BannerTemplateModel[]> {
  let sql = `SELECT bt.*, f.name AS franchise_name FROM banner_templates bt JOIN franchises f ON bt.franchise_id = f.id WHERE 1=1`;
  const params: any[] = [];
  if (franchiseId) {
    sql += ` AND bt.franchise_id = ?`;
    params.push(franchiseId);
  }
  if (!includeInactive) {
    sql += ` AND bt.is_active = 1`;
  }
  sql += ` ORDER BY bt.id DESC`;

  const [rows] = await query<RowDataPacket[]>(sql, params);
  const templates = rows.map(mapTemplate);

  if (templates.length === 0) {
    return [];
  }

  const templateIds = templates.map((t) => t.id);
  const placeholders = templateIds.map(() => "?").join(",");
  const [imageRows] = await query<RowDataPacket[]>(
    `SELECT * FROM banner_template_images WHERE template_id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`,
    templateIds,
  );

  const imagesByTemplateId = new Map<number, BannerTemplateImageModel[]>();
  for (const imgRow of imageRows) {
    const tId = Number(imgRow.template_id);
    if (!imagesByTemplateId.has(tId)) {
      imagesByTemplateId.set(tId, []);
    }
    imagesByTemplateId.get(tId)!.push(mapBannerTemplateImage(imgRow));
  }

  for (const t of templates) {
    t.images = imagesByTemplateId.get(t.id) || [];
  }

  // Load custom input fields for all templates
  try {
    const [fieldRows] = await query<RowDataPacket[]>(
      `SELECT * FROM banner_template_fields WHERE template_id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`,
      templateIds,
    );
    const fieldsByTemplateId = new Map<number, BannerTemplateFieldModel[]>();
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
    // If fields query fails (e.g. sort_order not present yet), fallback
    try {
      const [fieldRows] = await query<RowDataPacket[]>(
        `SELECT * FROM banner_template_fields WHERE template_id IN (${placeholders}) ORDER BY id ASC`,
        templateIds,
      );
      const fieldsByTemplateId = new Map<number, BannerTemplateFieldModel[]>();
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

export async function getBannerTemplateFields(
  templateId: number,
): Promise<BannerTemplateFieldModel[]> {
  try {
    const [rows] = await query<RowDataPacket[]>(
      `SELECT * FROM banner_template_fields WHERE template_id = ? ORDER BY sort_order ASC, id ASC`,
      [templateId],
    );
    return rows.map(mapField);
  } catch {
    try {
      const [rows] = await query<RowDataPacket[]>(
        `SELECT * FROM banner_template_fields WHERE template_id = ? ORDER BY id ASC`,
        [templateId],
      );
      return rows.map(mapField);
    } catch {
      return [];
    }
  }
}

export async function listBannerImages(filter: {
  franchiseId?: number;
  templateId?: number;
}): Promise<BannerTemplateImageModel[]> {
  let sql = `SELECT bti.* FROM banner_template_images bti`;
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (filter.franchiseId) {
    sql += ` JOIN banner_templates bt ON bti.template_id = bt.id`;
    whereClauses.push(`bt.franchise_id = ?`);
    params.push(filter.franchiseId);
  }

  if (filter.templateId) {
    whereClauses.push(`bti.template_id = ?`);
    params.push(filter.templateId);
  }

  if (whereClauses.length > 0) {
    sql += ` WHERE ` + whereClauses.join(" AND ");
  }

  sql += ` ORDER BY bti.sort_order ASC, bti.id ASC`;

  const [rows] = await query<RowDataPacket[]>(sql, params);
  return rows.map((r) => mapBannerTemplateImage(r, filter.franchiseId));
}

export async function saveBannerTemplateImages(
  templateId: number,
  _franchiseId: number,
  images: Array<{
    imageUrl: string;
    imageName?: string | null;
    sortOrder?: number;
  }>,
): Promise<BannerTemplateImageModel[]> {
  await withTransaction(async (conn) => {
    await conn.execute(
      `DELETE FROM banner_template_images WHERE template_id = ?`,
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
        `INSERT INTO banner_template_images (template_id, image_url, image_name, sort_order)
         VALUES (?, ?, ?, ?)`,
        [templateId, img.imageUrl.trim(), imageName, img.sortOrder ?? i],
      );
    }
  });

  return listBannerImages({ templateId });
}

export async function addOrUpdateBannerImage(data: {
  id?: number;
  templateId: number;
  imageUrl: string;
  imageName?: string | null;
  sortOrder?: number;
}): Promise<BannerTemplateImageModel> {
  const imageName =
    data.imageName?.trim() ||
    (data as any).image_name?.trim() ||
    data.imageUrl.trim().split("/").pop() ||
    null;

  if (data.id) {
    await execute(
      `UPDATE banner_template_images
       SET template_id = ?, image_url = ?, image_name = ?, sort_order = ?
       WHERE id = ?`,
      [data.templateId, data.imageUrl.trim(), imageName, data.sortOrder ?? 0, data.id],
    );
    const [rows] = await query<RowDataPacket[]>(
      `SELECT * FROM banner_template_images WHERE id = ?`,
      [data.id],
    );
    return mapBannerTemplateImage(rows[0]);
  } else {
    const [res] = await execute<ResultSetHeader>(
      `INSERT INTO banner_template_images (template_id, image_url, image_name, sort_order)
       VALUES (?, ?, ?, ?)`,
      [data.templateId, data.imageUrl.trim(), imageName, data.sortOrder ?? 0],
    );
    const [rows] = await query<RowDataPacket[]>(
      `SELECT * FROM banner_template_images WHERE id = ?`,
      [res.insertId],
    );
    return mapBannerTemplateImage(rows[0]);
  }
}

export async function deleteBannerImage(id: number): Promise<boolean> {
  await execute(`DELETE FROM banner_template_images WHERE id = ?`, [id]);
  return true;
}

export async function getBannerTemplateById(
  id: number,
): Promise<BannerTemplateModel | null> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT bt.*, f.name AS franchise_name FROM banner_templates bt JOIN franchises f ON bt.franchise_id = f.id WHERE bt.id = ?`,
    [id],
  );
  if (!rows[0]) return null;
  const template = mapTemplate(rows[0]);
  template.fields = await getBannerTemplateFields(id);

  const [imgRows] = await query<RowDataPacket[]>(
    `SELECT * FROM banner_template_images WHERE template_id = ? ORDER BY sort_order ASC, id ASC`,
    [id],
  );
  template.images = imgRows.map((r) =>
    mapBannerTemplateImage(r, template.franchiseId),
  );
  return template;
}

export type BannerImageInput =
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

export async function saveBannerTemplate(data: {
  id?: number;
  franchise_id?: number;
  franchiseId?: number;
  name?: string;
  description?: string | null;
  width_px?: number;
  widthPx?: number;
  height_px?: number;
  heightPx?: number;
  dimensions_label?: string | null;
  dimensionsLabel?: string | null;
  orientation?: BannerOrientation;
  is_active?: boolean | number;
  isActive?: boolean | number;
  fields?: Partial<BannerTemplateFieldModel>[];
  images?: BannerImageInput[];
}): Promise<BannerTemplateModel> {
  const normalizedImages = normalizeImages(data.images);

  const templateId = await withTransaction(async (conn) => {
    let currentId = data.id ? Number(data.id) : undefined;

    if (currentId) {
      // 1. UPDATE EXISTING TEMPLATE
      const [existingRows] = await conn.execute<RowDataPacket[]>(
        `SELECT * FROM banner_templates WHERE id = ? FOR UPDATE`,
        [currentId],
      );
      if (!existingRows[0]) {
        throw new AuthError("Banner template not found.", 404);
      }
      const existing = existingRows[0];

      const franchiseId = Number(
        data.franchiseId ?? data.franchise_id ?? existing.franchise_id,
      );
      if (!franchiseId || isNaN(franchiseId)) {
        throw new AuthError("Franchise ID is required.", 400);
      }

      const franchise = await getFranchiseById(franchiseId);
      if (!franchise) {
        throw new AuthError("Franchise not found.", 404);
      }

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

      const dimensionsLabel =
        data.dimensionsLabel !== undefined
          ? data.dimensionsLabel || null
          : data.dimensions_label !== undefined
            ? data.dimensions_label || null
            : existing.dimensions_label;

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
        `UPDATE banner_templates SET 
          franchise_id = ?, name = ?, description = ?, 
          width_px = ?, height_px = ?, 
          orientation = ?, is_active = ?
         WHERE id = ?`,
        [
          franchiseId,
          name,
          description,
          widthPx,
          heightPx,
          orientation,
          isActive,
          currentId,
        ],
      );

      // Synchronize images in the same transaction if provided
      if (normalizedImages !== undefined) {
        await conn.execute(
          `DELETE FROM banner_template_images WHERE template_id = ?`,
          [currentId],
        );

        for (let i = 0; i < normalizedImages.length; i++) {
          const img = normalizedImages[i];
          await conn.execute(
            `INSERT INTO banner_template_images (template_id, image_url, image_name, sort_order)
             VALUES (?, ?, ?, ?)`,
            [currentId, img.imageUrl, img.imageName || null, img.sortOrder ?? i],
          );
        }
      }

      // Synchronize fields in the same transaction if provided
      if (data.fields !== undefined) {
        await saveFieldsInTx(conn, currentId, data.fields);
      }

      return currentId;
    } else {
      // 2. CREATE NEW TEMPLATE
      const franchiseId = Number(data.franchiseId ?? data.franchise_id);
      if (!franchiseId || isNaN(franchiseId)) {
        throw new AuthError("Franchise ID is required.", 400);
      }

      const franchise = await getFranchiseById(franchiseId);
      if (!franchise) {
        throw new AuthError("Franchise not found.", 404);
      }

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

      const [res] = await conn.execute<ResultSetHeader>(
        `INSERT INTO banner_templates (
          franchise_id, name, description,
          width_px, height_px, orientation, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          franchiseId,
          name,
          description,
          widthPx,
          heightPx,
          orientation,
          isActive,
        ],
      );

      currentId = res.insertId;

      if (normalizedImages && normalizedImages.length > 0) {
        for (let i = 0; i < normalizedImages.length; i++) {
          const img = normalizedImages[i];
          await conn.execute(
            `INSERT INTO banner_template_images (template_id, image_url, image_name, sort_order)
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

  return (await getBannerTemplateById(templateId))!;
}

async function saveFieldsInTx(conn: any, templateId: number, fields: any[]) {
  await conn.execute(`DELETE FROM banner_template_fields WHERE template_id = ?`, [templateId]);

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
        `INSERT INTO banner_template_fields (
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
          `INSERT INTO banner_template_fields (
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

export async function saveBannerTemplateFields(
  templateId: number,
  fields: Partial<BannerTemplateFieldModel>[],
): Promise<BannerTemplateFieldModel[]> {
  await withTransaction(async (conn) => {
    await saveFieldsInTx(conn, templateId, fields);
  });

  return getBannerTemplateFields(templateId);
}

export async function deleteBannerTemplate(id: number): Promise<boolean> {
  await execute(`DELETE FROM banner_templates WHERE id = ?`, [id]);
  return true;
}

// User-side Banner Customization Helpers
export async function saveBannerCustomization(
  templateId: number,
  userId: number,
  customizationValues: Record<string, any>,
  franchiseId?: number,
  isNewSubmission = false,
): Promise<any> {
  const template = await getBannerTemplateById(templateId);
  if (!template) {
    throw new AuthError("Banner template not found.", 404);
  }

  // Validate required fields
  if (template.fields && template.fields.length > 0) {
    for (const f of template.fields) {
      if (f.isRequired) {
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
      // Check options for dropdown or radio
      if (
        (f.fieldType === "dropdown" || f.fieldType === "radio") &&
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

  const valuesJson = JSON.stringify(customizationValues);
  const fId = franchiseId || template.franchiseId || null;

  try {
    let custId: number;

    if (!isNewSubmission) {
      const [existing] = await query<RowDataPacket[]>(
        `SELECT id FROM banner_customizations WHERE template_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1`,
        [templateId, userId],
      );

      if (existing.length > 0) {
        custId = Number(existing[0].id);
        try {
          await execute(
            `UPDATE banner_customizations SET customization_values = ?, franchise_id = ?, status = 'Pending', updated_at = NOW() WHERE id = ?`,
            [valuesJson, fId, custId],
          );
        } catch (colErr: any) {
          if (colErr.code === "ER_BAD_FIELD_ERROR" || String(colErr.message).includes("Unknown column")) {
            await execute(
              `UPDATE banner_customizations SET customization_values = ?, franchise_id = ?, updated_at = NOW() WHERE id = ?`,
              [valuesJson, fId, custId],
            );
          } else {
            throw colErr;
          }
        }

        return {
          id: custId,
          templateId,
          userId,
          franchiseId: fId,
          customizationValues,
          status: "Pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    }

    // Insert new submission record
    try {
      const [res] = await execute<ResultSetHeader>(
        `INSERT INTO banner_customizations (template_id, user_id, franchise_id, customization_values, status) VALUES (?, ?, ?, ?, 'Pending')`,
        [templateId, userId, fId, valuesJson],
      );
      custId = res.insertId;
    } catch (colErr: any) {
      if (colErr.code === "ER_BAD_FIELD_ERROR" || String(colErr.message).includes("Unknown column")) {
        const [res] = await execute<ResultSetHeader>(
          `INSERT INTO banner_customizations (template_id, user_id, franchise_id, customization_values) VALUES (?, ?, ?, ?)`,
          [templateId, userId, fId, valuesJson],
        );
        custId = res.insertId;
      } else {
        throw colErr;
      }
    }

    return {
      id: custId,
      templateId,
      userId,
      franchiseId: fId,
      customizationValues,
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    if (err.code === "ER_NO_SUCH_TABLE" || String(err.message).includes("doesn't exist")) {
      return {
        id: Date.now(),
        templateId,
        userId,
        franchiseId: fId,
        customizationValues,
        status: "Pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    throw err;
  }
}

export async function getBannerCustomization(
  templateId: number,
  userId: number,
): Promise<any | null> {
  try {
    const [rows] = await query<RowDataPacket[]>(
      `SELECT * FROM banner_customizations WHERE template_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1`,
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
      franchiseId: r.franchise_id ? Number(r.franchise_id) : null,
      customizationValues: vals,
      status: r.status || "Pending",
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  } catch {
    return null;
  }
}

export async function listBannerSubmissions(filter?: {
  search?: string;
  status?: string;
  franchiseId?: number;
  userId?: number;
}): Promise<any[]> {
  try {
    let sql = `
      SELECT 
        bc.*,
        bt.name AS template_name,
        bt.width_px,
        bt.height_px,
        bt.orientation,
        u.name AS user_name,
        u.email AS user_email,
        f.name AS franchise_name
      FROM banner_customizations bc
      LEFT JOIN banner_templates bt ON bc.template_id = bt.id
      LEFT JOIN users u ON bc.user_id = u.id
      LEFT JOIN franchises f ON bc.franchise_id = f.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.userId) {
      sql += ` AND bc.user_id = ?`;
      params.push(filter.userId);
    }

    if (filter?.franchiseId) {
      sql += ` AND (bc.franchise_id = ? OR bt.franchise_id = ?)`;
      params.push(filter.franchiseId, filter.franchiseId);
    }

    if (filter?.status && filter.status.toLowerCase() !== "all") {
      sql += ` AND LOWER(COALESCE(bc.status, 'Pending')) = LOWER(?)`;
      params.push(filter.status);
    }

    if (filter?.search) {
      const q = `%${filter.search.trim()}%`;
      sql += ` AND (
        CAST(bc.id AS CHAR) LIKE ? OR
        bt.name LIKE ? OR
        u.name LIKE ? OR
        u.email LIKE ? OR
        f.name LIKE ?
      )`;
      params.push(q, q, q, q, q);
    }

    sql += ` ORDER BY bc.id DESC`;

    const [rows] = await query<RowDataPacket[]>(sql, params);
    if (rows.length === 0) return [];

    const templateIds = [...new Set(rows.map((r) => Number(r.template_id)).filter((id) => !isNaN(id) && id > 0))];
    let imageRows: any[] = [];
    if (templateIds.length > 0) {
      const placeholders = templateIds.map(() => "?").join(",");
      const [imgs] = await query<RowDataPacket[]>(
        `SELECT * FROM banner_template_images WHERE template_id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`,
        templateIds,
      );
      imageRows = imgs;
    }

    const imagesByTemplateId = new Map<number, any[]>();
    for (const img of imageRows) {
      const tId = Number(img.template_id);
      if (!imagesByTemplateId.has(tId)) imagesByTemplateId.set(tId, []);
      imagesByTemplateId.get(tId)!.push(mapBannerTemplateImage(img));
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
        vals._selectedImageUrl ||
        (vals._selectedImageIndex !== undefined && tImages[Number(vals._selectedImageIndex)]
          ? tImages[Number(vals._selectedImageIndex)].imageUrl
          : tImages[0]?.imageUrl || null);

      const templateName =
        vals._bannerTitle ||
        (vals._selectedImageIndex !== undefined && tImages.length > 1
          ? `${r.template_name} (#${Number(vals._selectedImageIndex) + 1})`
          : r.template_name || `Template #${tId}`);

      return {
        id: Number(r.id),
        templateId: tId,
        templateName,
        widthPx: Number(r.width_px || 1920),
        heightPx: Number(r.height_px || 1080),
        orientation: r.orientation || "landscape",
        previewImageUrl,
        userId: Number(r.user_id),
        userName: r.user_name || "Unknown User",
        userEmail: r.user_email || "",
        franchiseId: r.franchise_id ? Number(r.franchise_id) : null,
        franchiseName: r.franchise_name || null,
        status: r.status || "Pending",
        customizationValues: vals,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      };
    });
  } catch (err: any) {
    if (err.code === "ER_NO_SUCH_TABLE" || String(err.message).includes("doesn't exist")) {
      return [];
    }
    throw err;
  }
}

export async function getBannerSubmissionById(
  submissionId: number,
): Promise<BannerSubmissionDetailModel | null> {
  try {
    const [rows] = await query<RowDataPacket[]>(
      `
      SELECT 
        bc.*,
        bt.name AS template_name,
        bt.width_px,
        bt.height_px,
        bt.orientation,
        u.name AS user_name,
        u.email AS user_email,
        f.name AS franchise_name
      FROM banner_customizations bc
      LEFT JOIN banner_templates bt ON bc.template_id = bt.id
      LEFT JOIN users u ON bc.user_id = u.id
      LEFT JOIN franchises f ON bc.franchise_id = f.id
      WHERE bc.id = ?
      LIMIT 1
      `,
      [submissionId],
    );

    if (rows.length === 0) return null;
    const r = rows[0];
    const templateId = Number(r.template_id);

    const fields = await getBannerTemplateFields(templateId);

    const [imageRows] = await query<RowDataPacket[]>(
      `SELECT * FROM banner_template_images WHERE template_id = ? ORDER BY sort_order ASC, id ASC`,
      [templateId],
    );
    const images = imageRows.map(mapBannerTemplateImage);

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
      if (!matchedKeys.has(key) && key !== "templateId" && key !== "franchiseId" && !key.startsWith("_")) {
        submittedFields.push({
          id: key,
          label: key,
          fieldType: typeof val === "boolean" ? "checkbox" : "text",
          value: val,
        });
      }
    }

    const templateName =
      vals._bannerTitle ||
      (vals._selectedImageIndex !== undefined && images.length > 1
        ? `${r.template_name} (#${Number(vals._selectedImageIndex) + 1})`
        : r.template_name || `Template #${templateId}`);

    const previewImageUrl =
      vals._selectedImageUrl ||
      (vals._selectedImageIndex !== undefined && images[Number(vals._selectedImageIndex)]
        ? images[Number(vals._selectedImageIndex)].imageUrl
        : images[0]?.imageUrl || null);

    return {
      id: Number(r.id),
      templateId,
      templateName,
      widthPx: Number(r.width_px || 1920),
      heightPx: Number(r.height_px || 1080),
      dimensionsLabel: `${r.width_px || 1920} × ${r.height_px || 1080} px`,
      previewImageUrl,
      images,
      userId: Number(r.user_id),
      userName: r.user_name || "Unknown User",
      userEmail: r.user_email || "",
      franchiseId: r.franchise_id ? Number(r.franchise_id) : null,
      franchiseName: r.franchise_name || null,
      status: r.status || "Pending",
      customizationValues: vals,
      submittedFields,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    };
  } catch (err: any) {
    if (err.code === "ER_NO_SUCH_TABLE" || String(err.message).includes("doesn't exist")) {
      return null;
    }
    throw err;
  }
}

export async function updateBannerSubmissionStatus(
  submissionId: number,
  status: string,
): Promise<{ id: number; status: string }> {
  const allowed = ["Pending", "In Review", "Approved", "Rejected", "Completed"];
  const normalized =
    allowed.find((s) => s.toLowerCase() === status.trim().toLowerCase()) ||
    status.trim();

  try {
    await execute(
      `UPDATE banner_customizations SET status = ?, updated_at = NOW() WHERE id = ?`,
      [normalized, submissionId],
    );
  } catch (err: any) {
    if (err.code === "ER_BAD_FIELD_ERROR" || String(err.message).includes("Unknown column")) {
      console.warn("status column not in banner_customizations table yet.");
    } else {
      throw err;
    }
  }

  return { id: submissionId, status: normalized };
}

