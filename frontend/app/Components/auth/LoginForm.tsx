"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Lock, Mail } from "lucide-react";
import { authApi } from "@/app/lib/client/auth-api";
import type { AuthRole } from "@/app/lib/auth/types";
import {
  getDashboardPathFromRole,
  getRoleFromToken,
  getStoredToken,
} from "@/app/lib/auth/token";
import { Button, Card, Input, Label } from "@/app/Components/ui";

type LoginFormProps = {
  role: AuthRole;
  title: string;
};

export function LoginForm({ role, title }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [franchises, setFranchises] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [isLoadingFranchises, setIsLoadingFranchises] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      const userRole = getRoleFromToken(token);
      if (userRole) {
        router.push(getDashboardPathFromRole(userRole));
      }
    }
  }, [router]);

  useEffect(() => {
    if (role === "user") {
      setIsLoadingFranchises(true);
      authApi
        .listFranchises()
        .then((res) => {
          if (Array.isArray(res.franchises)) {
            setFranchises(res.franchises);
            if (res.franchises.length === 1) {
              setSelectedFranchiseId(String(res.franchises[0].id));
            }
          }
        })
        .catch(() => {
          // Ignore
        })
        .finally(() => {
          setIsLoadingFranchises(false);
        });
    }
  }, [role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (role === "user" && !selectedFranchiseId) {
      setError("Please select a franchise to sign in.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.login(
        role,
        email,
        password,
        selectedFranchiseId ? Number(selectedFranchiseId) : undefined,
      );
      const userRole =
        getRoleFromToken(response.token) ||
        (response.user?.roles?.[0] as AuthRole) ||
        role;

      router.push(getDashboardPathFromRole(userRole));
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-slate-100/90 px-5 py-10 flex items-center justify-center portal-dashboard">
      <Card className="w-full max-w-md p-6 sm:p-8 shadow-sm border border-slate-200 rounded-2xl bg-white">
        <div className="mb-6">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            FBS Prints
          </p>
          <h1 className="mt-1.5 text-2xl font-black text-slate-900">{title}</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {role === "user" && (
            <div className="space-y-1.5">
              <Label htmlFor="login-franchise" className="text-xs font-bold text-slate-700">
                Select Franchise <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building2
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <select
                  id="login-franchise"
                  value={selectedFranchiseId}
                  onChange={(event) => setSelectedFranchiseId(event.target.value)}
                  className="w-full h-11 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-xl focus:border-slate-400 focus:ring-slate-400/20 text-slate-900 outline-none transition-colors"
                  required
                >
                  <option value="">
                    {isLoadingFranchises ? "Loading franchises..." : "-- Select your Franchise --"}
                  </option>
                  {franchises.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="text-xs font-bold text-slate-700">Email</Label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 pl-9 text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-password" className="text-xs font-bold text-slate-700">Password</Label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 pl-9 text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                required
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-medium text-red-600">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 text-sm bg-slate-900 hover:bg-black text-white font-bold rounded-xl"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {role === "user" && (
          <div className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account or password yet?{" "}
            <a
              href="/user/register"
              className="font-bold text-slate-900 hover:underline"
            >
              Create Account / Set Password
            </a>
          </div>
        )}
      </Card>
    </main>
  );
}
