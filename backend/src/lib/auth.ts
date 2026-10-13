import { randomUUID } from "crypto";
import type { Request } from "express";
import { AuthError } from "./errors.js";
import { createAuthToken, verifyAuthToken } from "./jwt.js";
import { initializeAuthDatabase } from "./db.js";
import { verifyPassword } from "./password.js";
import { getUserByEmailWithPassword, getUserById } from "./users.js";
import {
  getFranchiseById,
  getFranchiseUserAccess,
  requestFranchiseAccess,
} from "./franchises.js";
import type { AuthRole, AuthUser, Permission } from "./types.js";

const TOKEN_TTL_SECONDS = 60 * 60 * 8;

export async function loginWithRole(
  email: string,
  password: string,
  requestedRole?: AuthRole,
  franchiseId?: number,
): Promise<{ user: AuthUser; token: string; expiresAt: Date; franchiseId?: number }> {
  const user = await getUserByEmailWithPassword(email);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AuthError("Invalid email or password.", 401);
  }

  if (!user.isActive) {
    throw new AuthError("Your account is in the pending state.", 403);
  }

  if (requestedRole && !user.roles.includes(requestedRole)) {
    throw new AuthError("This account is not authorized for this login.", 403);
  }

  const activeRole = requestedRole ?? user.roles[0];

  if (!activeRole) {
    throw new AuthError("This account does not have a role assigned.", 403);
  }

  let selectedFranchiseId: number | undefined = franchiseId;
  let selectedFranchiseName: string | undefined;

  if (activeRole === "user") {
    let access = franchiseId
      ? await getFranchiseUserAccess(user.id, franchiseId)
      : await getFranchiseUserAccess(user.id);

    if (!franchiseId && access) {
      selectedFranchiseId = access.franchiseId;
      selectedFranchiseName = access.franchiseName;
    }

    if (!selectedFranchiseId) {
      throw new AuthError(
        "No franchise access request found. Please create an account and select a franchise first.",
        400,
      );
    }

    const franchise = await getFranchiseById(selectedFranchiseId);
    if (!franchise || !franchise.isActive) {
      throw new AuthError("Selected franchise does not exist or is inactive.", 400);
    }
    selectedFranchiseName = selectedFranchiseName ?? franchise.name;

    if (!access) {
      await requestFranchiseAccess(user.id, selectedFranchiseId);
      throw new AuthError(
        "Your login request for this franchise has been submitted to Super Admin for approval.",
        403,
      );
    }
    if (access.status === "rejected") {
      throw new AuthError(
        access.rejectionReason
          ? `Your access for this franchise was rejected: ${access.rejectionReason}`
          : "Your access for this franchise has been rejected.",
        403,
      );
    }
  }

  const tokenId = randomUUID();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);
  const token = createAuthToken({
    tid: tokenId,
    sub: user.id,
    roles: user.roles,
    franchiseId: selectedFranchiseId,
    exp: Math.floor(expiresAt.getTime() / 1000),
  });

  const responseUser: AuthUser = {
    ...user,
    franchiseId: selectedFranchiseId,
    franchiseName: selectedFranchiseName,
  };

  return {
    user: responseUser,
    token,
    expiresAt,
    franchiseId: selectedFranchiseId,
  };
}

/** Short-TTL cache: remote MySQL RTT is ~300–2000ms per query; avoid re-loading user on every API call. */
const USER_CACHE_TTL_MS = 60_000;
const userCache = new Map<number, { user: AuthUser; expiresAt: number }>();

export function invalidateUserCache(userId?: number) {
  if (userId == null) {
    userCache.clear();
    return;
  }
  userCache.delete(userId);
}

export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  const payload = verifyAuthToken(token);

  if (!payload) {
    return null;
  }

  const cached = userCache.get(payload.sub);
  let user: AuthUser | null = null;

  if (cached && cached.expiresAt > Date.now()) {
    user = { ...cached.user };
  } else {
    user = await getUserById(payload.sub);

    if (!user?.isActive) {
      userCache.delete(payload.sub);
      return null;
    }

    userCache.set(payload.sub, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
    user = { ...user };
  }

  if (payload.franchiseId) {
    user.franchiseId = payload.franchiseId;
  }

  return user;
}

export const AUTH_COOKIE_NAME = "token";
export const JWT_COOKIE_NAME = "jwt";

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "development",
    sameSite: "lax" as const,
    maxAge: TOKEN_TTL_SECONDS * 1000,
    path: "/",
  };
}

export async function getCurrentUser(req: Request): Promise<AuthUser | null> {
  let token: string | undefined;

  // 1. Check cookies (cookie-parser)
  const cookies = (req as any).cookies;
  if (cookies) {
    token = cookies[AUTH_COOKIE_NAME] || cookies[JWT_COOKIE_NAME] || cookies.auth_token;
  }

  // 2. Check jwt / x-access-token header
  if (!token) {
    const rawJwtHeader = req.headers["jwt"] || req.headers["x-access-token"];
    if (typeof rawJwtHeader === "string") {
      token = rawJwtHeader.trim();
    }
  }

  // 3. Check Authorization header (supports Bearer <token>, JWT <token>, or raw <token>)
  if (!token && typeof req.headers.authorization === "string") {
    const authHeader = req.headers.authorization.trim();
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (authHeader.toLowerCase().startsWith("jwt ")) {
      token = authHeader.substring(4).trim();
    } else if (!authHeader.includes(" ")) {
      token = authHeader;
    }
  }

  if (!token || typeof token !== "string") {
    return null;
  }

  return getUserFromToken(token);
}

export async function logoutUser() {
  await initializeAuthDatabase();
}

export async function requireUser(req: Request): Promise<AuthUser> {
  const user = await getCurrentUser(req);

  if (!user) {
    throw new AuthError("Authentication required.", 401);
  }

  return user;
}

export async function requirePermission(
  req: Request,
  permission: Permission,
): Promise<AuthUser> {
  const user = await requireUser(req);

  if (!user.permissions.includes(permission)) {
    throw new AuthError("You do not have permission to perform this action.", 403);
  }

  return user;
}

export function requireAuth() {
  return async (req: Request, res: any, next: any) => {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }
    (req as any).user = user;
    next();
  };
}
