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
import { createUser } from "../lib/users.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !name || !password) {
      res
        .status(400)
        .json({ message: "Name, email, and password are required." });
      return;
    }

    const user = await createUser({
      name,
      email,
      password,
      role: "user",
      isActive: false,
    });

    res.status(201).json({
      user,
      message: "Your account has been submitted to Super Admin for approval.",
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

    if (requestedRole !== undefined && !isAuthRole(requestedRole)) {
      res.status(400).json({ message: "Unsupported role." });
      return;
    }

    const { user, token } = await loginWithRole(email, password, requestedRole);

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    res.cookie(JWT_COOKIE_NAME, token, getAuthCookieOptions());
    res.json({ user, token });
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

    res.json({ user });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});
