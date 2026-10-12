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
    dimensionsLabel: row.dimensions_label,
    orientation: row.orientation,
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    images: [],
  };
}

function mapField(row: any): BannerTemplateFieldModel {
  return {
    id: Number(row.id),
    templateId: Number(row.template_id),
    fieldKey: row.field_key,
    fieldLabel: row.field_label,
    fieldType: row.field_type,
    positionX: Number(row.position_x),
    positionY: Number(row.position_y),
    fontSize: row.font_size ? Number(row.font_size) : null,
    fontColor: row.font_color,
    fontFamily: row.font_family,
    textAlign: row.text_align || "left",
    maxLength: row.max_length ? Number(row.max_length) : null,
    isRequired: Boolean(row.is_required),
    isEditable: Boolean(row.is_editable),
    defaultValue: row.default_value,
    createdAt: new Date(row.created_at).toISOString(),
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

  return templates;
}

export async function getBannerTemplateFields(
  templateId: number,
): Promise<BannerTemplateFieldModel[]> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT * FROM banner_template_fields WHERE template_id = ? ORDER BY id ASC`,
    [templateId],
  );
  return rows.map(mapField);
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
          width_px = ?, height_px = ?, dimensions_label = ?, 
          orientation = ?, is_active = ?
         WHERE id = ?`,
        [
          franchiseId,
          name,
          description,
          widthPx,
          heightPx,
          dimensionsLabel,
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
        await conn.execute(
          `DELETE FROM banner_template_fields WHERE template_id = ?`,
          [currentId],
        );

        for (let i = 0; i < data.fields.length; i++) {
          const f = data.fields[i];
          await conn.execute(
            `INSERT INTO banner_template_fields (
              template_id, field_key, field_label, field_type, position_x, position_y,
              font_size, font_color, font_family, text_align, max_length, is_required,
              is_editable, default_value
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              currentId,
              f.fieldKey || `field_${i + 1}`,
              f.fieldLabel || f.fieldKey || `Field ${i + 1}`,
              f.fieldType || "text",
              f.positionX ?? 0,
              f.positionY ?? 0,
              f.fontSize ?? 32,
              f.fontColor || "#000000",
              f.fontFamily || "Arial",
              f.textAlign || "left",
              f.maxLength ?? null,
              f.isRequired ? 1 : 0,
              f.isEditable !== false ? 1 : 0,
              f.defaultValue || null,
            ],
          );
        }
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
      const dimensionsLabel =
        data.dimensionsLabel ||
        data.dimensions_label ||
        `${widthPx}x${heightPx}`;
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
          width_px, height_px, dimensions_label, orientation, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          franchiseId,
          name,
          description,
          widthPx,
          heightPx,
          dimensionsLabel,
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
        for (let i = 0; i < data.fields.length; i++) {
          const f = data.fields[i];
          await conn.execute(
            `INSERT INTO banner_template_fields (
              template_id, field_key, field_label, field_type, position_x, position_y,
              font_size, font_color, font_family, text_align, max_length, is_required,
              is_editable, default_value
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              currentId,
              f.fieldKey || `field_${i + 1}`,
              f.fieldLabel || f.fieldKey || `Field ${i + 1}`,
              f.fieldType || "text",
              f.positionX ?? 0,
              f.positionY ?? 0,
              f.fontSize ?? 32,
              f.fontColor || "#000000",
              f.fontFamily || "Arial",
              f.textAlign || "left",
              f.maxLength ?? null,
              f.isRequired ? 1 : 0,
              f.isEditable !== false ? 1 : 0,
              f.defaultValue || null,
            ],
          );
        }
      }

      return currentId;
    }
  });

  return (await getBannerTemplateById(templateId))!;
}

export async function saveBannerTemplateFields(
  templateId: number,
  fields: Partial<BannerTemplateFieldModel>[],
): Promise<BannerTemplateFieldModel[]> {
  await withTransaction(async (conn) => {
    await conn.execute(
      `DELETE FROM banner_template_fields WHERE template_id = ?`,
      [templateId],
    );

    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      await conn.execute(
        `INSERT INTO banner_template_fields (
          template_id,
          field_key,
          field_label,
          field_type,
          position_x,
          position_y,
          font_size,
          font_color,
          font_family,
          text_align,
          max_length,
          is_required,
          is_editable,
          default_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          templateId,
          f.fieldKey || `field_${i + 1}`,
          f.fieldLabel || f.fieldKey || `Field ${i + 1}`,
          f.fieldType || "text",
          f.positionX ?? 0,
          f.positionY ?? 0,
          f.fontSize ?? 32,
          f.fontColor || "#000000",
          f.fontFamily || "Arial",
          f.textAlign || "left",
          f.maxLength ?? null,
          f.isRequired ? 1 : 0,
          f.isEditable !== false ? 1 : 0,
          f.defaultValue || null,
        ],
      );
    }
  });

  return getBannerTemplateFields(templateId);
}

export async function deleteBannerTemplate(id: number): Promise<boolean> {
  await execute(`DELETE FROM banner_templates WHERE id = ?`, [id]);
  return true;
}
