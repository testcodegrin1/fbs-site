"use client";

import { AuthGuard } from "@/app/Components/auth/AuthGuard";
import { BannerSubmissionHistory } from "@/app/profile/BannerSubmissionHistory";

export default function OrderHistoryPage() {
  return (
    <AuthGuard
      requiredRole="user"
      loginPath="/profile/sign-in?returnTo=%2Forder-history"
    >
      {(user) => <BannerSubmissionHistory user={user} />}
    </AuthGuard>
  );
}
