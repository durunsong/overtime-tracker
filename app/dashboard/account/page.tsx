import { ChangePasswordForm } from "@/components/auth/auth-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireCurrentUser();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>账号信息</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-slate-500">姓名</p>
            <p className="mt-1 font-medium text-white">{user.name}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-slate-500">邮箱</p>
            <p className="mt-1 font-medium text-white">{user.email}</p>
          </div>
        </CardContent>
      </Card>
      <ChangePasswordForm />
    </div>
  );
}
