import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { getCurrentUser } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    const callbackUrl = (await headers()).get("x-auth-callback-url");
    redirect(buildLoginUrl(callbackUrl));
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
