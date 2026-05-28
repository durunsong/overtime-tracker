import type { Metadata } from "next";
import { StatusPage } from "@/components/status/status-page";

export const metadata: Metadata = {
  title: "页面未找到",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      eyebrow="Route signal lost"
      title="这条加班轨迹没有找到"
      description="你访问的页面可能已移动、被删除，或链接里的路径不完整。可以返回工作台继续查看考勤、月报和统计数据。"
      primaryHref="/dashboard"
      primaryLabel="返回工作台"
      secondaryHref="/"
      secondaryLabel="查看首页"
    />
  );
}
