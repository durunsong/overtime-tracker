import type { Metadata } from "next";
import { StatusPage } from "@/components/status/status-page";

export const metadata: Metadata = {
  title: "访问受限",
  robots: { index: false, follow: false },
};

export default function Forbidden() {
  return (
    <StatusPage
      code="403"
      eyebrow="Access boundary active"
      title="当前账号没有访问权限"
      description="这个页面需要更高权限或正确的登录身份。你可以返回工作台，或切换到有权限的账号后再试。"
      primaryHref="/dashboard"
      primaryLabel="返回工作台"
      secondaryHref="/auth/login"
      secondaryLabel="切换账号"
    />
  );
}
