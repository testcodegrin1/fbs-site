import type { Metadata } from "next";
import { LoginForm } from "@/app/Components/auth/LoginForm";

export const metadata: Metadata = { title: "Profile Sign In | FBS Prints" };

function safeReturnTo(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value;
  return path && path.startsWith("/") && !path.startsWith("//") ? path : "/profile";
}

export default async function ProfileSignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string | string[] }> }) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  return <LoginForm role="user" title="Sign In" redirectTo={returnTo} registerPath={`/profile/register?returnTo=${encodeURIComponent(returnTo)}`} />;
}
