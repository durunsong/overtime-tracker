import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { loadMonthlyReportContext } from "@/lib/data/attendance-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentMonth } from "@/lib/date/month";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const month = getCurrentMonth();
  let report;

  try {
    ({ report } = await loadMonthlyReportContext(month));
  } catch (error) {
    return <DatabaseError error={error} />;
  }

  return <DashboardOverview report={report} />;
}

function DatabaseError({ error }: { error: unknown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>数据库连接不可用</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-7 text-slate-400">
          系统仅使用真实数据库数据，请先确认 `.env` 中的 `DATABASE_URL` 可连接，并完成 Prisma
          迁移。错误信息：{error instanceof Error ? error.message : "未知错误"}
        </p>
      </CardContent>
    </Card>
  );
}
