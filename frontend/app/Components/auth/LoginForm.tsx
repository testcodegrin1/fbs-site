"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
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
  redirectTo?: string;
  registerPath?: string;
};

export function LoginForm({
  role,
  title,
  redirectTo,
  registerPath = "/user/register",
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = getStoredToken(role);
    if (token) {
      const userRole = getRoleFromToken(token);
      if (userRole) {
        router.push(redirectTo || getDashboardPathFromRole(userRole));
      }
    }
  }, [role, redirectTo, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await authApi.login(role, email, password);
      const userRole =
        getRoleFromToken(response.token) ||
        (response.user?.roles?.[0] as AuthRole) ||
        role;

      router.push(redirectTo || getDashboardPathFromRole(userRole));
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/70 pt-32 sm:pt-36 pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <Card className="w-full max-w-md p-6 sm:p-8 shadow-sm border border-slate-200/90 rounded-2xl bg-white my-auto">
        <div className="mb-6 text-center">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full">
            FBS Prints
          </span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
            Enter your email and password to access your account
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="text-xs font-bold text-slate-700">
              Email
            </Label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 pl-10 text-sm border-slate-300 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/15"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-password" className="text-xs font-bold text-slate-700">
              Password
            </Label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 pl-10 pr-10 text-sm border-slate-300 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/15"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 text-sm bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-xs transition"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {role === "user" && (
          <div className="mt-6 text-center text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-5">
            Don&apos;t have an account or password yet?{" "}
            <Link
              href={registerPath}
              className="font-bold text-primary hover:underline ml-1"
            >
              Create Account / Set Password
            </Link>
          </div>
        )}
      </Card>
    </main>
  );
}
