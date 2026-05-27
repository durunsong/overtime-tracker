import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-400">正在读取重置令牌...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
