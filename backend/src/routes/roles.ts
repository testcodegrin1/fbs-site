import { Router } from "express";
import { getErrorResponse } from "../lib/errors.js";
import { isAuthRole } from "../lib/roles.js";
import { requirePermission } from "../lib/auth.js";
import type { Permission } from "../lib/types.js";
import {
  listPermissions,
  listRoles,
  updateRolePermissions,
} from "../lib/users.js";

export const rolesRouter = Router();

rolesRouter.get("/", async (req, res) => {
  try {
    await requirePermission(req, "roles:read");
    const [roles, permissions] = await Promise.all([
      listRoles(),
      listPermissions(),
    ]);
    res.json({ roles, permissions });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});

rolesRouter.put("/:role/permissions", async (req, res) => {
  try {
    const role = req.params.role;

    if (!isAuthRole(role)) {
      res.status(400).json({ message: "Unsupported role." });
      return;
    }

    const permissions = Array.isArray(req.body?.permissions)
      ? (req.body.permissions as Permission[])
      : null;

    if (!permissions) {
      res.status(400).json({ message: "Permissions must be an array." });
      return;
    }

    const actor = await requirePermission(req, "roles:update");
    await updateRolePermissions(role, permissions, actor.id);
    res.json({ roles: await listRoles() });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    res.status(status).json({ message });
  }
});
