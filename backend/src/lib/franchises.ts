import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { query, execute } from "./db.js";
import { AuthError } from "./errors.js";
import type {
  FranchiseModel,
  UserFranchiseRequestModel,
  FranchiseAccessStatus,
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
}): Promise<FranchiseModel> {
  if (!data.name?.trim())
    throw new AuthError("Franchise name is required.", 400);

  const [res] = await execute<ResultSetHeader>(
    `INSERT INTO franchises (name, branding_logo_url, description) VALUES (?, ?, ?)`,
    [
      data.name.trim(),
      data.brandingLogoUrl || null,
      data.description || null,
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

function mapFranchiseRequest(row: any): UserFranchiseRequestModel {
  return {
    id: row.id,
    userId: row.user_id,
    franchiseId: row.franchise_id,
    franchiseName: row.franchise_name,
    userEmail: row.user_email,
    userName: row.user_name,
    status: row.status,
    rejectionReason: row.rejection_reason,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at
      ? new Date(row.approved_at).toISOString()
      : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getFranchiseUserAccess(
  userId: number,
  franchiseId?: number,
): Promise<UserFranchiseRequestModel | null> {
  let sql = `
    SELECT vp.*, f.name AS franchise_name, u.email AS user_email, u.name AS user_name
    FROM vendor_profiles vp
    JOIN franchises f ON vp.franchise_id = f.id
    JOIN users u ON vp.user_id = u.id
    WHERE vp.user_id = ?
  `;
  const params: (number | string)[] = [userId];
  if (franchiseId) {
    sql += ` AND vp.franchise_id = ?`;
    params.push(franchiseId);
  }
  sql += ` ORDER BY vp.id DESC LIMIT 1`;
  const [rows] = await query<RowDataPacket[]>(sql, params);
  return rows[0] ? mapFranchiseRequest(rows[0]) : null;
}

export async function requestFranchiseAccess(
  userId: number,
  franchiseId: number,
): Promise<UserFranchiseRequestModel> {
  const [res] = await execute<ResultSetHeader>(
    `INSERT INTO vendor_profiles (user_id, franchise_id, phone, status)
     VALUES (?, ?, 'N/A', 'pending')`,
    [userId, franchiseId],
  );
  const [rows] = await query<RowDataPacket[]>(
    `SELECT vp.*, f.name AS franchise_name, u.email AS user_email, u.name AS user_name
     FROM vendor_profiles vp
     JOIN franchises f ON vp.franchise_id = f.id
     JOIN users u ON vp.user_id = u.id
     WHERE vp.id = ?`,
    [res.insertId],
  );
  return mapFranchiseRequest(rows[0]);
}

export async function listFranchiseUserRequests(
  status?: FranchiseAccessStatus,
  franchiseId?: number,
): Promise<UserFranchiseRequestModel[]> {
  let sql = `
    SELECT vp.*, f.name AS franchise_name, u.email AS user_email, u.name AS user_name
    FROM vendor_profiles vp
    JOIN franchises f ON vp.franchise_id = f.id
    JOIN users u ON vp.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (status) {
    sql += ` AND vp.status = ?`;
    params.push(status);
  }
  if (franchiseId) {
    sql += ` AND vp.franchise_id = ?`;
    params.push(franchiseId);
  }
  sql += ` ORDER BY vp.id DESC`;
  const [rows] = await query<RowDataPacket[]>(sql, params);
  return rows.map(mapFranchiseRequest);
}

export async function updateFranchiseAccessStatus(
  id: number,
  status: FranchiseAccessStatus,
  adminUserId: number,
  rejectionReason?: string,
): Promise<UserFranchiseRequestModel> {
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const approvedBy = isApproved ? adminUserId : null;
  const approvedAt = isApproved ? new Date() : null;
  const reason = isRejected ? rejectionReason?.trim() || null : null;

  await execute(
    `UPDATE vendor_profiles
     SET status = ?, approved_by = ?, approved_at = ?, rejection_reason = ?
     WHERE id = ?`,
    [status, approvedBy, approvedAt, reason, id],
  );

  const [rows] = await query<RowDataPacket[]>(
    `SELECT vp.*, f.name AS franchise_name, u.email AS user_email, u.name AS user_name
     FROM vendor_profiles vp
     JOIN franchises f ON vp.franchise_id = f.id
     JOIN users u ON vp.user_id = u.id
     WHERE vp.id = ?`,
    [id],
  );
  if (!rows[0]) throw new AuthError("Request not found.", 404);
  return mapFranchiseRequest(rows[0]);
}
