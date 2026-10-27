import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { initializeAuthDatabase, query, type SqlValue, withTransaction } from "./db.js";
import { AuthError } from "./errors.js";
import { ROLE_PERMISSIONS, isAuthRole } from "./roles.js";
import { hashPassword, validatePasswordStrength } from "./password.js";
import type { AuthRole, AuthUser, Permission, UserPayload } from "./types.js";
import { syncSingleUserToClient } from "./canvas/clients.js";

type UserRow = RowDataPacket & {
  id: number;
  email: string;
  name: string;
  password_hash?: string;
  is_active: 0 | 1 | boolean;
  roles: string | null;
  permissions: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type RoleRow = RowDataPacket & {
  slug: AuthRole;
  name: string;
  description: string | null;
  permissions: string | null;
};

type Queryable = {
  execute<T extends ResultSetHeader | RowDataPacket[]>(
    sql: string,
    params?: SqlValue[],
  ): Promise<[T, unknown]>;
};

function mapUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    isActive: Number(row.is_active) === 1,
    roles: splitCsv(row.roles).filter(isAuthRole),
    permissions: splitCsv(row.permissions) as Permission[],
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

function splitCsv(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthError("Enter a valid email address.");
  }
}

function assertName(name: string) {
  if (name.trim().length < 2) {
    throw new AuthError("Name must be at least 2 characters.");
  }
}

function assertRole(role: string): asserts role is AuthRole {
  if (!isAuthRole(role)) {
    throw new AuthError("Unsupported role.");
  }
}

async function audit(
  db: Queryable,
  action: string,
  actorUserId?: number,
  targetUserId?: number,
  metadata?: Record<string, unknown>,
) {
  await db.execute<ResultSetHeader>(
    `
      INSERT INTO audit_events (actor_user_id, action, target_user_id, metadata)
      VALUES (?, ?, ?, ?)
    `,
    [
      actorUserId ?? null,
      action,
      targetUserId ?? null,
      metadata ? JSON.stringify(metadata) : null,
    ],
  );
}

function isDuplicateEntryError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  );
}

export async function getUserByEmailWithPassword(
  email: string,
): Promise<(AuthUser & { passwordHash: string }) | null> {
  const [rows] = await query<UserRow[]>(
    `
      SELECT
        users.id,
        users.email,
        users.name,
        users.password_hash,
        users.is_active,
        users.created_at,
        users.updated_at,
        GROUP_CONCAT(DISTINCT roles.slug ORDER BY roles.slug SEPARATOR ',') AS roles,
        GROUP_CONCAT(DISTINCT permissions.slug ORDER BY permissions.slug SEPARATOR ',') AS permissions
      FROM users
      LEFT JOIN user_roles ON user_roles.user_id = users.id
      LEFT JOIN roles ON roles.id = user_roles.role_id
      LEFT JOIN role_permissions ON role_permissions.role_id = roles.id
      LEFT JOIN permissions ON permissions.id = role_permissions.permission_id
      WHERE users.email = ?
      GROUP BY users.id
    `,
    [normalizeEmail(email)],
  );

  const row = rows[0];

  if (!row || !row.password_hash) {
    return null;
  }

  return { ...mapUser(row), passwordHash: row.password_hash };
}

export async function getUserById(id: number): Promise<AuthUser | null> {
  const [rows] = await query<UserRow[]>(
    `
      SELECT
        users.id,
        users.email,
        users.name,
        users.is_active,
        users.created_at,
        users.updated_at,
        GROUP_CONCAT(DISTINCT roles.slug ORDER BY roles.slug SEPARATOR ',') AS roles,
        GROUP_CONCAT(DISTINCT permissions.slug ORDER BY permissions.slug SEPARATOR ',') AS permissions
      FROM users
      LEFT JOIN user_roles ON user_roles.user_id = users.id
      LEFT JOIN roles ON roles.id = user_roles.role_id
      LEFT JOIN role_permissions ON role_permissions.role_id = roles.id
      LEFT JOIN permissions ON permissions.id = role_permissions.permission_id
      WHERE users.id = ?
      GROUP BY users.id
    `,
    [id],
  );

  return rows[0] ? mapUser(rows[0]) : null;
}

export async function listUsers(): Promise<AuthUser[]> {
  const [rows] = await query<UserRow[]>(
    `
      SELECT
        users.id,
        users.email,
        users.name,
        users.is_active,
        users.created_at,
        users.updated_at,
        GROUP_CONCAT(DISTINCT roles.slug ORDER BY roles.slug SEPARATOR ',') AS roles,
        GROUP_CONCAT(DISTINCT permissions.slug ORDER BY permissions.slug SEPARATOR ',') AS permissions
      FROM users
      LEFT JOIN user_roles ON user_roles.user_id = users.id
      LEFT JOIN roles ON roles.id = user_roles.role_id
      LEFT JOIN role_permissions ON role_permissions.role_id = roles.id
      LEFT JOIN permissions ON permissions.id = role_permissions.permission_id
      GROUP BY users.id
      ORDER BY users.created_at DESC, users.id DESC
    `,
  );

  return rows.map(mapUser);
}

export async function listRoles() {
  await initializeAuthDatabase();

  const [rows] = await query<RoleRow[]>(
    `
      SELECT
        roles.slug,
        roles.name,
        roles.description,
        GROUP_CONCAT(DISTINCT permissions.slug ORDER BY permissions.slug SEPARATOR ',') AS permissions
      FROM roles
      LEFT JOIN role_permissions ON role_permissions.role_id = roles.id
      LEFT JOIN permissions ON permissions.id = role_permissions.permission_id
      GROUP BY roles.id, roles.slug, roles.name, roles.description
      ORDER BY roles.id
    `,
  );

  return rows.map((role) => ({
    ...role,
    permissions: splitCsv(role.permissions) as Permission[],
  }));
}

export async function listPermissions(): Promise<Permission[]> {
  await initializeAuthDatabase();

  const [rows] = await query<(RowDataPacket & { slug: Permission })[]>(
    "SELECT slug FROM permissions ORDER BY slug",
  );

  return rows.map((row) => row.slug);
}

export async function updateRolePermissions(
  role: AuthRole,
  permissions: Permission[],
  actorUserId?: number,
) {
  assertRole(role);

  const uniquePermissions = [...new Set(permissions)];
  const availablePermissions = new Set(await listPermissions());
  const invalidPermissions = uniquePermissions.filter(
    (permission) => !availablePermissions.has(permission),
  );

  if (invalidPermissions.length > 0) {
    throw new AuthError("One or more permissions are invalid.");
  }

  if (role === "super_admin") {
    const requiredSuperAdminPermissions = ROLE_PERMISSIONS.super_admin;
    const missingRequiredPermission = requiredSuperAdminPermissions.find(
      (permission) => !uniquePermissions.includes(permission),
    );

    if (missingRequiredPermission) {
      throw new AuthError(
        "Super Admin permissions must include full system access.",
      );
    }
  }

  await withTransaction(async (connection) => {
    const [roleRows] = await connection.execute<(RowDataPacket & { id: number })[]>(
      "SELECT id FROM roles WHERE slug = ?",
      [role],
    );
    const roleRow = roleRows[0];

    if (!roleRow) {
      throw new AuthError("Role not found.", 404);
    }

    await connection.execute<ResultSetHeader>(
      "DELETE FROM role_permissions WHERE role_id = ?",
      [roleRow.id],
    );

    for (const permission of uniquePermissions) {
      await connection.execute<ResultSetHeader>(
        `
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT ?, id FROM permissions WHERE slug = ?
        `,
        [roleRow.id, permission],
      );
    }

    await audit(connection, "update_role_permissions", actorUserId, undefined, {
      role,
      permissions: uniquePermissions,
    });
  });
}

async function assignUserRole(connection: PoolConnection, userId: number, role: AuthRole) {
  const [result] = await connection.execute<ResultSetHeader>(
    `
      INSERT INTO user_roles (user_id, role_id)
      SELECT ?, id FROM roles WHERE slug = ?
    `,
    [userId, role],
  );

  if (result.affectedRows === 0) {
    throw new AuthError("Role not found.", 404);
  }
}

export async function createUser(
  payload: UserPayload,
  actorUserId?: number,
  action = "create_user",
): Promise<AuthUser> {
  assertRole(payload.role);
  assertEmail(payload.email);
  assertName(payload.name);

  if (!payload.password) {
    throw new AuthError("Password is required.");
  }

  const passwordError = validatePasswordStrength(payload.password);

  if (passwordError) {
    throw new AuthError(passwordError);
  }

  await initializeAuthDatabase();

  const passwordHash = await hashPassword(payload.password);
  const email = normalizeEmail(payload.email);

  try {
    const userId = await withTransaction(async (connection) => {
      const [result] = await connection.execute<ResultSetHeader>(
        `
          INSERT INTO users (email, name, password_hash, is_active)
          VALUES (?, ?, ?, ?)
        `,
        [
          email,
          payload.name.trim(),
          passwordHash,
          payload.isActive === false ? 0 : 1,
        ],
      );

      const userId = Number(result.insertId);
      await assignUserRole(connection, userId, payload.role);
      await audit(connection, action, actorUserId, userId, { role: payload.role });

      return userId;
    });

    const user = await getUserById(userId);

    if (!user) {
      throw new AuthError("Unable to load created user.", 500);
    }

    await syncSingleUserToClient(user.name, user.email);

    return user;
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      throw new AuthError("A user with this email already exists.", 409);
    }

    throw error;
  }
}

export async function updateUser(
  id: number,
  payload: Partial<UserPayload>,
  actorUserId?: number,
): Promise<AuthUser> {
  const currentUser = await getUserById(id);

  if (!currentUser) {
    throw new AuthError("User not found.", 404);
  }

  if (payload.email !== undefined) {
    assertEmail(payload.email);
  }

  if (payload.name !== undefined) {
    assertName(payload.name);
  }

  if (payload.role !== undefined) {
    assertRole(payload.role);
  }

  let passwordHash: string | undefined;

  if (payload.password) {
    const passwordError = validatePasswordStrength(payload.password);

    if (passwordError) {
      throw new AuthError(passwordError);
    }

    passwordHash = await hashPassword(payload.password);
  }

  try {
    await withTransaction(async (connection) => {
      await connection.execute<ResultSetHeader>(
        `
          UPDATE users
          SET
            email = COALESCE(?, email),
            name = COALESCE(?, name),
            password_hash = COALESCE(?, password_hash),
            is_active = COALESCE(?, is_active),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [
          payload.email ? normalizeEmail(payload.email) : null,
          payload.name ? payload.name.trim() : null,
          passwordHash ?? null,
          payload.isActive === undefined ? null : payload.isActive ? 1 : 0,
          id,
        ],
      );

      if (payload.role) {
        await connection.execute<ResultSetHeader>(
          "DELETE FROM user_roles WHERE user_id = ?",
          [id],
        );
        await assignUserRole(connection, id, payload.role);
      }

      await audit(connection, "update_user", actorUserId, id, {
        emailChanged: payload.email !== undefined,
        nameChanged: payload.name !== undefined,
        role: payload.role,
        isActive: payload.isActive,
        passwordChanged: Boolean(passwordHash),
      });
    });

    const updatedUser = await getUserById(id);

    if (!updatedUser) {
      throw new AuthError("Unable to load updated user.", 500);
    }

    await syncSingleUserToClient(updatedUser.name, updatedUser.email);

    return updatedUser;
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      throw new AuthError("A user with this email already exists.", 409);
    }

    throw error;
  }
}

export async function deleteUser(id: number, actorUserId?: number) {
  const user = await getUserById(id);

  if (!user) {
    throw new AuthError("User not found.", 404);
  }

  await withTransaction(async (connection) => {
    await audit(connection, "delete_user", actorUserId, id, { email: user.email });
    await connection.execute<ResultSetHeader>("DELETE FROM users WHERE id = ?", [id]);
  });
}
