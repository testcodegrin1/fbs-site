"use client";

import { AuthGuard } from "@/app/Components/auth/AuthGuard";
import { ProductSubmissionHistory } from "./ProductSubmissionHistory";

export default function ProfilePage() {
  return (
    <AuthGuard requiredRole="user" loginPath="/profile/sign-in">
      {(user) => <ProductSubmissionHistory user={user} />}
    </AuthGuard>
  );
}
