import { MonthlyReportPanel } from "@/components/reports/monthly-report-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadAttendanceRecords } from "@/lib/data/attendance-repository";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  let records;

  try {
    records = await loadAttendanceRecords();
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>无法加载月报数据</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">
            请检查数据库连接和迁移状态。错误信息：
            {error instanceof Error ? error.message : "未知错误"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <MonthlyReportPanel records={records} />;
}
