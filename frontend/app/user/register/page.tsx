"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { authApi } from "@/app/lib/client/auth-api";
import { Button, Card, Input, Label } from "@/app/Components/ui";

export function UserRegistrationForm({ redirectTo = "/user/dashboard", loginPath = "/user/login" }: { redirectTo?: string; loginPath?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.register(
        name,
        email,
        password,
      );
      if (response.token) {
        router.push(redirectTo);
        router.refresh();
        return;
      }
      setError(
        response.message ||
          "Your account has been created successfully.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/70 pt-32 sm:pt-36 pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <Card className="w-full max-w-md p-6 sm:p-8 shadow-sm border border-slate-200/90 rounded-2xl bg-white my-auto">
        <div className="mb-5 text-center">
          <span className="inline-block px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full">
            FBS Prints
          </span>
          <h1 className="mt-2.5 text-2xl font-bold text-slate-900 sm:text-3xl">Create Account</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Register your email and set up your password to manage your projects
          </p>
        </div>

        <form className="space-y-3.5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="reg-name" className="text-xs font-bold text-slate-700">Full Name</Label>
            <div className="relative">
              <UserIcon
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="h-11 pl-10 text-sm border-slate-300 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/15"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-email" className="text-xs font-bold text-slate-700">Email Address</Label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="h-11 pl-10 text-sm border-slate-300 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/15"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-password" className="text-xs font-bold text-slate-700">Create Password</Label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 pl-10 text-sm border-slate-300 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/15"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-confirm" className="text-xs font-bold text-slate-700">Confirm Password</Label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 pl-10 text-sm border-slate-300 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/15"
                required
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 text-sm bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-xs transition"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Creating Account...
              </span>
            ) : (
              "Create Account & Sign In"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-5">
          Already have an account?{" "}
          <Link href={loginPath} className="font-bold text-primary hover:underline ml-1">
            Sign In
          </Link>
        </div>
      </Card>
    </main>
  );
}

export default function UserRegisterPage() {
  return <UserRegistrationForm />;
}
