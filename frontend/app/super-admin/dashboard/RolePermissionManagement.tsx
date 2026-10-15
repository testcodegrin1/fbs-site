"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { ROLE_LABELS } from "@/app/lib/auth/roles";
import type { AuthRole, Permission } from "@/app/lib/auth/types";
import { authApi } from "@/app/lib/client/auth-api";
import { Button, Card, Input } from "@/app/Components/ui";

type RoleRecord = {
  slug: AuthRole;
  name: string;
  permissions: Permission[];
};

export function RolePermissionManagement() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [drafts, setDrafts] = useState<Record<AuthRole, Permission[]>>({
    super_admin: [],
    designer: [],
    user: [],
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingRole, setSavingRole] = useState<AuthRole | null>(null);

  async function loadRoles() {
    setError("");

    try {
      const response = await authApi.listRoles();
      setRoles(response.roles as RoleRecord[]);
      setPermissions(response.permissions);
      setDrafts(
        response.roles.reduce(
          (nextDrafts, role) => ({
            ...nextDrafts,
            [role.slug]: role.permissions as Permission[],
          }),
          { super_admin: [], designer: [], user: [] } as Record<AuthRole, Permission[]>,
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load role permissions.",
      );
    }
  }

  useEffect(() => {
    void loadRoles();
  }, []);

  function togglePermission(role: AuthRole, permission: Permission) {
    if (role === "super_admin") {
      return;
    }

    const currentPermissions = drafts[role] ?? [];
    const nextPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter((item) => item !== permission)
      : [...currentPermissions, permission];

    setDrafts({ ...drafts, [role]: nextPermissions });
  }

  async function saveRole(role: AuthRole) {
    setSavingRole(role);
    setError("");
    setNotice("");

    try {
      const response = await authApi.updateRolePermissions(role, drafts[role] ?? []);
      setRoles(response.roles as RoleRecord[]);
      setNotice(`${ROLE_LABELS[role]} permissions updated.`);
      await loadRoles();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update role permissions.",
      );
    } finally {
      setSavingRole(null);
    }
  }

  return (
    <Card className="overflow-hidden p-0 shadow-sm">
      <div className="border-b border-slate-100 px-6 py-6">
        <div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Role Permissions
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Update the permissions assigned to Designer and User roles.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="mb-4 rounded-xl bg-green-50 border border-green-100 px-3 py-2 text-sm text-green-700">
          {notice}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-[640px] text-left">
          <thead>
            <tr>
              <th>Permission</th>
              {roles.map((role) => <th key={role.slug} className="text-center">{ROLE_LABELS[role.slug]}</th>)}
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission}>
                <td className="font-medium text-slate-700">{permission}</td>
                {roles.map((role) => (
                  <td key={role.slug} className="text-center">
                    <Input type="checkbox" aria-label={`${ROLE_LABELS[role.slug]}: ${permission}`} checked={(drafts[role.slug] ?? []).includes(permission)} disabled={role.slug === "super_admin"} onChange={() => togglePermission(role.slug, permission)} className="h-4 w-4 accent-primary shadow-none" />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="text-xs text-slate-500">Save role permissions</td>
              {roles.map((role) => (
                <td key={role.slug} className="text-center">
                  <Button variant="outline" size="icon-sm" className="portal-action" title={`Save ${ROLE_LABELS[role.slug]} permissions`} disabled={role.slug === "super_admin" || savingRole === role.slug} onClick={() => void saveRole(role.slug)}>
                    {savingRole === role.slug ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
