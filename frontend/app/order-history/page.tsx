"use client";

import { AuthGuard } from "@/app/Components/auth/AuthGuard";
import { ProductSubmissionHistory } from "@/app/profile/ProductSubmissionHistory";

export default function OrderHistoryPage() {
  return (
    <AuthGuard
      requiredRole="user"
      loginPath="/profile/sign-in?returnTo=%2Forder-history"
    >
      {(user) => <ProductSubmissionHistory user={user} />}
    </AuthGuard>
  );
}
