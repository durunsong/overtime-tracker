import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicOvertimeShare } from "@/components/share/public-overtime-share";
import { loadPublicOvertimeShare } from "@/lib/share/overtime-share";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  let share: Awaited<ReturnType<typeof loadPublicOvertimeShare>>;

  try {
    const { token } = await params;
    share = await loadPublicOvertimeShare(token);
  } catch (error) {
    if (error instanceof Error && error.message === "分享链接无效") {
      notFound();
    }

    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#070b12] px-6 text-slate-100">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>分享数据暂时不可用</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-slate-400">
              当前无法读取这次加班分享，请稍后再试。错误信息：
              {error instanceof Error ? error.message : "未知错误"}
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!share) notFound();

  return <PublicOvertimeShare share={share.payload} />;
}
