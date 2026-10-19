"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Check,
  Edit,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  X,
} from "lucide-react";
import { ROLE_LABELS } from "@/app/lib/auth/roles";
import type { AuthRole, AuthUser, UserPayload } from "@/app/lib/auth/types";
import { authApi } from "@/app/lib/client/auth-api";
import { Button, Card, Input, Label, Select, Badge } from "@/app/Components/ui";

type UserFormState = {
  id?: number;
  email: string;
  name: string;
  role: AuthRole;
  password: string;
  isActive: boolean;
};

const emptyForm: UserFormState = {
  email: "",
  name: "",
  role: "user",
  password: "",
  isActive: true,
};

type UserManagementProps = {
  currentUserId: number;
  currentUserRoles: AuthRole[];
};

export function UserManagement({
  currentUserId,
  currentUserRoles,
}: UserManagementProps) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AuthUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewUser, setViewUser] = useState<AuthUser | null>(null);

  const editingUser = useMemo(
    () => users.find((user) => user.id === form.id),
    [form.id, users],
  );
  const canManageSuperAdmins = currentUserRoles.includes("super_admin");

  async function loadUsers() {
    setIsLoading(true);
    setError("");

    try {
      const response = await authApi.listUsers();
      setUsers(response.users);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load users.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  function startEdit(user: AuthUser) {
    if (user.roles.includes("super_admin") && !canManageSuperAdmins) {
      setError("Only a Super Admin can edit Super Admin accounts.");
      return;
    }

    setNotice("");
    setError("");
    setForm({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.roles[0] ?? "user",
      password: "",
      isActive: user.isActive,
    });
    setIsFormOpen(true);
  }

  function resetForm() {
    setForm(emptyForm);
    setError("");
    setNotice("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);

    const payload: UserPayload = {
      email: form.email,
      name: form.name,
      role: form.role,
      isActive: form.isActive,
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      if (form.id) {
        await authApi.updateUser(form.id, payload);
        setNotice("User updated.");
      } else {
        await authApi.createUser(payload);
        setNotice("User created.");
      }

      resetForm();
      setIsFormOpen(false);
      await loadUsers();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save user.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(user: AuthUser) {
    setError("");
    setNotice("");
    setIsSaving(true);

    try {
      await authApi.updateUser(user.id, { isActive: !user.isActive });
      setForm((current) => ({ ...current, isActive: !user.isActive }));
      setNotice(user.isActive ? "User deactivated." : "User activated.");
      await loadUsers();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Unable to update user status.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function resetPassword() {
    if (!editingUser) return;
    setError("");
    setNotice("");
    if (!form.password) {
      setError("Enter a new password in the password field first.");
      return;
    }
    setIsSaving(true);
    try {
      await authApi.updateUser(editingUser.id, { password: form.password });
      setForm((current) => ({ ...current, password: "" }));
      setNotice("Password updated.");
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Failed to reset password.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function requestRemoveUser(user: AuthUser) {
    if (user.id === currentUserId) {
      setError("You cannot delete your own account while signed in.");
      return;
    }

    if (user.roles.includes("super_admin") && !canManageSuperAdmins) {
      setError("Only a Super Admin can delete Super Admin accounts.");
      return;
    }

    setError("");
    setNotice("");
    setDeleteTarget(user);
  }

  async function confirmRemoveUser() {
    if (!deleteTarget) return;
    setError("");
    setNotice("");
    setIsDeleting(true);

    try {
      await authApi.deleteUser(deleteTarget.id);
      setNotice("User deleted.");
      setDeleteTarget(null);
      await loadUsers();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete user.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mr-auto w-full max-w-[1216px] space-y-4">
      {isFormOpen ? (
        <dialog
          ref={(dialog) => {
            if (dialog && !dialog.open) dialog.showModal();
          }}
          className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md overflow-visible border-0 bg-transparent p-0 backdrop:bg-slate-950/40"
          aria-labelledby="account-form-title"
          onCancel={(event) => {
            event.preventDefault();
            if (!isSaving) setIsFormOpen(false);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget && !isSaving)
              setIsFormOpen(false);
          }}
        >
          <Card className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-lg p-6 shadow-xl">
            <div className="mb-5 flex items-center gap-2">
              <ShieldCheck className="text-primary" size={22} />
              <h2
                id="account-form-title"
                className="flex-1 text-lg font-bold text-primary-dark"
              >
                {form.id ? "Edit Account" : "Create Account"}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close account form"
                title="Close"
                disabled={isSaving}
                onClick={() => setIsFormOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  autoFocus
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className="h-11 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  className="h-11 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onChange={(event) =>
                    setForm({ ...form, role: event.target.value as AuthRole })
                  }
                  className="h-11 text-sm"
                >
                  <option value="designer">{ROLE_LABELS.designer}</option>
                  <option value="user">{ROLE_LABELS.user}</option>
                  {canManageSuperAdmins ? (
                    <option value="super_admin">
                      {ROLE_LABELS.super_admin}
                    </option>
                  ) : null}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Password{form.id ? " (leave blank to keep current)" : ""}
                </Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                  className="h-11 text-sm"
                  required={!form.id}
                  autoComplete="new-password"
                />
              </div>

              <Label className="flex items-center gap-3 font-medium cursor-pointer">
                <Input
                  type="checkbox"
                  disabled={
                    isSaving ||
                    (form.id === currentUserId &&
                      Boolean(editingUser?.isActive))
                  }
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm({ ...form, isActive: event.target.checked })
                  }
                  className="h-4 w-4 accent-primary shadow-none border-slate-300"
                />
                Active account
              </Label>

              {editingUser ? (
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    disabled={isSaving}
                    onClick={() => void resetPassword()}
                  >
                    <KeyRound size={14} /> Reset Pass
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      isSaving ||
                      (editingUser.id === currentUserId && editingUser.isActive)
                    }
                    onClick={() => void toggleActive(editingUser)}
                  >
                    {editingUser.isActive ? (
                      <UserRoundX size={14} />
                    ) : (
                      <UserRoundCheck size={14} />
                    )}
                    {editingUser.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              ) : null}

              {error ? (
                <p className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              {notice ? (
                <p className="rounded-xl bg-green-50 border border-green-100 px-3 py-2 text-sm text-green-700">
                  {notice}
                </p>
              ) : null}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-10 bg-primary hover:bg-primary/90 text-sm"
                >
                  <Plus size={17} />
                  {isSaving ? "Saving..." : form.id ? "Save" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => setIsFormOpen(false)}
                  className="h-10 text-sm"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </dialog>
      ) : null}

      {!isFormOpen && error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      {!isFormOpen && notice ? (
        <p
          role="status"
          className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {notice}
        </p>
      ) : null}
      <Card className="overflow-hidden rounded-lg border border-slate-200 shadow-sm p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-6">
          <div>
            <h2 className="text-base font-bold text-primary-dark">All Users</h2>
            <p className="mt-1 text-xs text-slate-500">
              Manage account access, roles, and status across the organization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg px-3 text-xs font-medium"
              onClick={() => void loadUsers()}
            >
              <RefreshCw size={13} />
              Refresh
            </Button>
            <Button
              type="button"
              className="h-9 rounded-lg bg-slate-900 px-4 text-xs text-white hover:bg-slate-800"
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
            >
              <Plus size={15} />
              Create Account
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="bg-slate-50/70 text-[13px] uppercase text-slate-600">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-5 py-6 text-primary-dark/60" colSpan={5}>
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary-dark/60" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    tabIndex={0}
                    aria-label={`View ${user.name}`}
                    className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-500"
                    onClick={() => setViewUser(user)}
                    onKeyDown={(event) => {
                      if (
                        event.target === event.currentTarget &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault();
                        setViewUser(user);
                      }
                    }}
                  >
                    <td className="px-6 py-4 font-medium text-primary-dark">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-[13px] text-slate-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className={`whitespace-nowrap rounded-md border px-2.5 py-0.5 text-xs ${role === "super_admin" ? "border-slate-900 bg-slate-900 font-semibold text-white" : "border-slate-200 bg-slate-100 text-slate-900"}`}
                          >
                            {ROLE_LABELS[role] ?? role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 text-xs font-medium"
                        variant={user.isActive ? "success" : "secondary"}
                      >
                        {user.isActive ? <Check size={12} /> : null}
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="flex justify-end gap-2 [&>button]:h-8 [&>button]:w-8 [&>button]:rounded-md [&>button]:p-0 [&>button]:shadow-none"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          title="Edit user"
                          aria-label={`Edit ${user.name}`}
                          onClick={() => startEdit(user)}
                          disabled={
                            user.roles.includes("super_admin") &&
                            !canManageSuperAdmins
                          }
                        >
                          <Edit size={15} />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          title="Delete user"
                          aria-label={`Delete ${user.name}`}
                          className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          onClick={() => requestRemoveUser(user)}
                          disabled={
                            user.id === currentUserId ||
                            (user.roles.includes("super_admin") &&
                              !canManageSuperAdmins)
                          }
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {viewUser ? (
        <dialog
          ref={(dialog) => {
            if (dialog && !dialog.open) dialog.showModal();
          }}
          className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/40"
          aria-labelledby="user-details-title"
          onCancel={() => setViewUser(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              const bounds = event.currentTarget.getBoundingClientRect();
              if (
                event.clientX < bounds.left ||
                event.clientX > bounds.right ||
                event.clientY < bounds.top ||
                event.clientY > bounds.bottom
              )
                setViewUser(null);
            }
          }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <h2 id="user-details-title" className="text-lg font-bold">
              User Details
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Close"
              aria-label="Close user details"
              onClick={() => setViewUser(null)}
            >
              <X size={18} />
            </Button>
          </div>
          <dl className="grid grid-cols-[100px_minmax(0,1fr)] gap-x-4 gap-y-4 py-5 text-sm [&>dt]:text-slate-500 [&>dd]:break-words">
            <dt>Name</dt>
            <dd className="font-semibold">{viewUser.name}</dd>
            <dt>Email</dt>
            <dd>{viewUser.email}</dd>
            <dt>Role</dt>
            <dd>
              {viewUser.roles
                .map((role) => ROLE_LABELS[role] ?? role)
                .join(", ")}
            </dd>
            <dt>Status</dt>
            <dd>
              <Badge variant={viewUser.isActive ? "success" : "secondary"}>
                {viewUser.isActive ? "Active" : "Inactive"}
              </Badge>
            </dd>
            <dt>User ID</dt>
            <dd>{viewUser.id}</dd>
            <dt>Created</dt>
            <dd>{new Date(viewUser.createdAt).toLocaleString()}</dd>
            <dt>Updated</dt>
            <dd>{new Date(viewUser.updatedAt).toLocaleString()}</dd>
          </dl>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={
                viewUser.roles.includes("super_admin") && !canManageSuperAdmins
              }
              onClick={() => {
                setViewUser(null);
                startEdit(viewUser);
              }}
            >
              <Edit size={15} /> Edit Account
            </Button>
          </div>
        </dialog>
      ) : null}
      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm user delete"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Delete user?
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    This action needs your confirmation.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Close delete confirmation"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900">{deleteTarget.email}</strong>?
              This cannot be undone.
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isDeleting}
                onClick={() => void confirmRemoveUser()}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Trash2 size={16} />
                {isDeleting ? "Deleting..." : "Yes, delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
