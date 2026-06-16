import type { MonthlyReportView } from "@/types/report";
import { formatMinutes } from "@/lib/attendance/formatter";

export function buildAverageOvertimeHelper(
  report: Pick<MonthlyReportView, "weekendOvertimeMinutes" | "weekendWorkDays">,
) {
  const helper = "按工作日平均，不含周末加班";
  const extra =
    report.weekendWorkDays > 0
      ? `周末加班 ${formatMinutes(report.weekendOvertimeMinutes)}（${report.weekendWorkDays} 天，单独统计，不含入上方平均值）`
      : "本月无周末打卡，平均值仅统计工作日";

  return { helper, extra };
}
