import { Router } from "express";
import { AuthError, getErrorResponse } from "../lib/errors.js";
import { requirePermission } from "../lib/auth.js";
import {
  createUser,
  deleteUser,
  getUserById,
  listCustomers,
  listUsers,
  updateUser,
} from "../lib/users.js";
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

usersRouter.get("/customers", async (req, res) => {
  try {
    await requirePermission(req, "users:read");
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const customers = await listCustomers(search);
    res.json({ customers });
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
