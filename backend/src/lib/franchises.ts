import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { query, execute } from "./db.js";
import { AuthError } from "./errors.js";
import type {
  FranchiseModel,
} from "./types.js";

function mapFranchise(row: any): FranchiseModel {
  return {
    id: row.id,
    name: row.name,
    brandingLogoUrl: row.branding_logo_url,
    description: row.description,
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function listFranchises(
  includeInactive = false,
): Promise<FranchiseModel[]> {
  const sql = includeInactive
    ? `SELECT * FROM franchises ORDER BY name ASC`
    : `SELECT * FROM franchises WHERE is_active = 1 ORDER BY name ASC`;
  const [rows] = await query<RowDataPacket[]>(sql);
  return rows.map(mapFranchise);
}

export async function getFranchiseById(
  id: number,
): Promise<FranchiseModel | null> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT * FROM franchises WHERE id = ?`,
    [id],
  );
  return rows[0] ? mapFranchise(rows[0]) : null;
}

export async function createFranchise(data: {
  name: string;
  brandingLogoUrl?: string | null;
  description?: string | null;
  isActive?: boolean;
}): Promise<FranchiseModel> {
  if (!data.name?.trim())
    throw new AuthError("Franchise name is required.", 400);

  const [res] = await execute<ResultSetHeader>(
    `INSERT INTO franchises (name, branding_logo_url, description, is_active) VALUES (?, ?, ?, ?)`,
    [
      data.name.trim(),
      data.brandingLogoUrl || null,
      data.description || null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
    ],
  );

  return (await getFranchiseById(res.insertId))!;
}

export async function updateFranchise(
  id: number,
  data: {
    name?: string;
    brandingLogoUrl?: string | null;
    description?: string | null;
    isActive?: boolean;
  },
): Promise<FranchiseModel> {
  const existing = await getFranchiseById(id);
  if (!existing) throw new AuthError("Franchise not found.", 404);

  await execute(
    `UPDATE franchises SET name = COALESCE(?, name), branding_logo_url = COALESCE(?, branding_logo_url), description = COALESCE(?, description), is_active = COALESCE(?, is_active) WHERE id = ?`,
    [
      data.name?.trim() || null,
      data.brandingLogoUrl !== undefined ? data.brandingLogoUrl : null,
      data.description !== undefined ? data.description : null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
      id,
    ],
  );

  return (await getFranchiseById(id))!;
}

export async function deactivateFranchise(id: number): Promise<void> {
  const [result] = await execute(
    `UPDATE franchises
     SET is_active = 0
     WHERE id = ?`,
    [id],
  );

  if (result.affectedRows === 0) {
    throw new AuthError("Franchise not found.");
  }
}

export async function deleteFranchise(id: number): Promise<void> {
  const [result] = await execute(`DELETE FROM franchises WHERE id = ?`, [id]);

  if (result.affectedRows === 0) {
    throw new AuthError("Franchise not found.");
  }
}
