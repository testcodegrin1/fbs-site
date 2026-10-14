import { Router } from "express";
import { AuthError, getErrorResponse } from "../lib/errors.js";
import { requirePermission } from "../lib/auth.js";
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from "../lib/users.js";
import {
  listFranchiseUserRequests,
  updateFranchiseAccessStatus,
} from "../lib/franchises.js";
import type { AuthRole, AuthUser } from "../lib/types.js";

export const usersRouter = Router();

function isSuperAdmin(user: AuthUser) {
  return user.roles.includes("super_admin");
}

async function assertCanAssignRole(actor: AuthUser, role?: AuthRole) {
  if (role === "super_admin" && !isSuperAdmin(actor)) {
    throw new AuthError(
      "Only a Super Admin can assign the Super Admin role.",
      403,
    );
  }
}

async function assertCanManageTarget(actor: AuthUser, targetUserId: number) {
  if (isSuperAdmin(actor)) {
    return;
  }

  const targetUser = await getUserById(targetUserId);

  if (targetUser?.roles.includes("super_admin")) {
    throw new AuthError(
      "Only a Super Admin can manage Super Admin accounts.",
      403,
    );
  }
}

usersRouter.get("/", async (req, res) => {
  try {
    await requirePermission(req, "users:read");
    res.json({ users: await listUsers() });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

usersRouter.post("/", async (req, res) => {
  try {
    const actor = await requirePermission(req, "users:create");
    await assertCanAssignRole(actor, req.body?.role);
    const user = await createUser(req.body, actor.id);
    res.status(201).json({ user });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

usersRouter.put("/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ message: "Invalid user id." });
      return;
    }

    const actor = await requirePermission(req, "users:update");
    await assertCanManageTarget(actor, userId);
    await assertCanAssignRole(actor, req.body?.role);
    const user = await updateUser(userId, req.body, actor.id);
    res.json({ user });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

usersRouter.delete("/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ message: "Invalid user id." });
      return;
    }

    const actor = await requirePermission(req, "users:delete");
    await assertCanManageTarget(actor, userId);
    await deleteUser(userId, actor.id);
    res.json({ ok: true });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

// GET /api/getUserRequests - List user franchise access requests (Admin only)
usersRouter.get("/getUserRequests", async (req, res) => {
  try {
    await requirePermission(req, "franchises:manage");
    const status = req.query.status as any;
    const franchiseId = req.query.franchiseId ? Number(req.query.franchiseId) : undefined;
    const requests = await listFranchiseUserRequests(status, franchiseId);
    res.json({ requests });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

// PUT /api/updateUserRequestStatus/:id - Approve or reject user's franchise access
usersRouter.put("/updateUserRequestStatus/:id", async (req, res) => {
  try {
    const actor = await requirePermission(req, "franchises:manage");
    const id = Number(req.params.id);
    const { status, rejectionReason } = req.body;

    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      res.status(400).json({ message: "Valid status ('approved', 'rejected', 'pending') is required." });
      return;
    }

    await updateFranchiseAccessStatus(id, status, actor.id, rejectionReason);
    res.json({ message: `User request ${status} successfully` });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});
