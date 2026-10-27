"use client";

import { AuthGuard } from "@/app/Components/auth/AuthGuard";
import { BannerSubmissionHistory } from "./BannerSubmissionHistory";

export default function ProfilePage() {
  return (
    <AuthGuard requiredRole="user" loginPath="/profile/sign-in">
      {(user) => <BannerSubmissionHistory user={user} />}
    </AuthGuard>
  );
}
