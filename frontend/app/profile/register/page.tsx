import type { Metadata } from "next";
import { UserRegistrationForm } from "@/app/user/register/page";

export const metadata: Metadata = { title: "Create Profile | FBS Prints" };

function safeReturnTo(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value;
  return path && path.startsWith("/") && !path.startsWith("//") ? path : "/profile";
}

export default async function ProfileRegisterPage({ searchParams }: { searchParams: Promise<{ returnTo?: string | string[] }> }) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  return <UserRegistrationForm redirectTo={returnTo} loginPath={`/profile/sign-in?returnTo=${encodeURIComponent(returnTo)}`} />;
}
