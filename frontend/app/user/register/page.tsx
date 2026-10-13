"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { authApi } from "@/app/lib/client/auth-api";
import { Button, Card, Input, Label } from "@/app/Components/ui";

export default function UserRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [franchises, setFranchises] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [isLoadingFranchises, setIsLoadingFranchises] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
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
        setError("Unable to load franchises right now.");
      })
      .finally(() => {
        setIsLoadingFranchises(false);
      });
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!selectedFranchiseId) {
      setError("Please select a franchise to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.register(
        name,
        email,
        password,
        Number(selectedFranchiseId),
      );
      if (response.token) {
        router.push("/user/dashboard");
        router.refresh();
        return;
      }
      setError(
        response.message ||
          "Your franchise access request has been submitted for approval.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-slate-100/90 px-5 py-10 flex items-center justify-center portal-dashboard">
      <Card className="w-full max-w-md p-6 sm:p-8 shadow-sm border border-slate-200 rounded-2xl bg-white">
        <div className="mb-6">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            FBS Prints Portal
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Create Account</h1>
          <p className="text-xs text-slate-500 mt-1">
            Register your email and set up your password to manage your projects.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="reg-name" className="text-xs font-bold text-slate-700">Full Name</Label>
            <div className="relative">
              <UserIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="h-11 pl-9 border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-email" className="text-xs font-bold text-slate-700">Email Address</Label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="h-11 pl-9 border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-password" className="text-xs font-bold text-slate-700">Create Password</Label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 pl-9 border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-confirm" className="text-xs font-bold text-slate-700">Confirm Password</Label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 pl-9 border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-franchise" className="text-xs font-bold text-slate-700">
              Select Franchise <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Building2
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <select
                id="reg-franchise"
                value={selectedFranchiseId}
                onChange={(e) => setSelectedFranchiseId(e.target.value)}
                className="w-full h-11 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-xl focus:border-slate-400 focus:ring-slate-400/20 text-slate-900 outline-none transition-colors"
                required
              >
                <option value="">
                  {isLoadingFranchises
                    ? "Loading franchises..."
                    : "-- Select your Franchise --"}
                </option>
                {franchises.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>
                    {franchise.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <p className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-medium text-red-600">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting} className="w-full h-11 bg-slate-900 hover:bg-black text-white font-bold rounded-xl">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {isSubmitting ? "Creating Account..." : "Create Account & Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/user/login" className="font-bold text-slate-900 hover:underline">
            Sign In
          </Link>
        </div>
      </Card>
    </main>
  );
}
