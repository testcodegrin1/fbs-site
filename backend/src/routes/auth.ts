import { Router } from "express";
import { getErrorResponse } from "../lib/errors.js";
import { isAuthRole } from "../lib/roles.js";
import {
  AUTH_COOKIE_NAME,
  JWT_COOKIE_NAME,
  getAuthCookieOptions,
  getCurrentUser,
  loginWithRole,
  logoutUser,
} from "../lib/auth.js";
import {
  getFranchiseById,
  getFranchiseUserAccess,
  listFranchises,
  requestFranchiseAccess,
} from "../lib/franchises.js";
import { createUser } from "../lib/users.js";

export const authRouter = Router();

authRouter.get("/franchises", async (_req, res) => {
  try {
    const franchises = await listFranchises(false);
    res.json({ franchises });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

authRouter.post("/register", async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    const franchiseId =
      req.body?.franchiseId != null &&
      !Number.isNaN(Number(req.body.franchiseId))
        ? Number(req.body.franchiseId)
        : undefined;

    if (!email || !name || !password || !franchiseId) {
      res
        .status(400)
        .json({ message: "Name, email, password, and franchise are required." });
      return;
    }

    const franchise = await getFranchiseById(franchiseId);
    if (!franchise || !franchise.isActive) {
      res
        .status(400)
        .json({ message: "Selected franchise does not exist or is inactive." });
      return;
    }

    const user = await createUser({
      name,
      email,
      password,
      role: "user",
      isActive: false,
      franchiseId,
    });

    await requestFranchiseAccess(user.id, franchiseId);
    res.status(201).json({
      user: { ...user, franchiseId, franchiseName: franchise.name },
      message:
        "Your login request for this franchise has been submitted to Super Admin for approval.",
    });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    const requestedRole = req.body?.role;
    const franchiseId =
      req.body?.franchiseId != null &&
      !Number.isNaN(Number(req.body.franchiseId))
        ? Number(req.body.franchiseId)
        : undefined;

    if (requestedRole !== undefined && !isAuthRole(requestedRole)) {
      res.status(400).json({ message: "Unsupported role." });
      return;
    }

    const {
      user,
      token,
      franchiseId: activeFranchiseId,
    } = await loginWithRole(email, password, requestedRole, franchiseId);

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    res.cookie(JWT_COOKIE_NAME, token, getAuthCookieOptions());
    res.json({ user, token, franchiseId: activeFranchiseId });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

authRouter.post("/logout", async (_req, res) => {
  try {
    await logoutUser();
    res.clearCookie(AUTH_COOKIE_NAME);
    res.clearCookie(JWT_COOKIE_NAME);
    res.json({ ok: true });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

authRouter.get("/me", async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      res.status(401).json({ user: null });
      return;
    }

    let franchise = null;
    const access = await getFranchiseUserAccess(user.id);
    const targetFranchiseId = user.franchiseId || access?.franchiseId;
    if (targetFranchiseId) {
      franchise = await getFranchiseById(targetFranchiseId);
    }

    const enrichedUser = {
      ...user,
      franchiseId: user.franchiseId || access?.franchiseId || null,
      franchiseName: user.franchiseName || franchise?.name || access?.franchiseName || null,
      franchiseStatus: access?.status || (user.isActive ? "approved" : "pending"),
      brandingLogoUrl: franchise?.brandingLogoUrl || access?.brandingLogoUrl || null,
    };

    res.json({ user: enrichedUser, franchise, access });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});
