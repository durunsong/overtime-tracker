import type { AttendanceRecordView } from "@/types/attendance";
import { calculateMonthlyReport } from "@/lib/attendance/calculate";
import { formatMinutes } from "@/lib/attendance/formatter";
import { buildAverageOvertimeHelper } from "@/lib/reports/overtime-average";

export function generateMonthlyReport(records: AttendanceRecordView[], month: string) {
  return calculateMonthlyReport(records, month);
}

export function buildReportText(report: ReturnType<typeof calculateMonthlyReport>) {
  const averageOvertimeHelper = buildAverageOvertimeHelper(report);

  return [
    `${report.month} 加班月报`,
    `出勤天数：${report.workDays} 天`,
    `总有效出勤：${report.actualWorkMinutes} 分钟`,
    `总标准工时：${report.standardWorkMinutes} 分钟`,
    `总加班：${report.overtimeMinutes} 分钟`,
    `加班时长：${formatMinutes(report.overtimeMinutes)}`,
    `平均每日加班：${formatMinutes(report.averageOvertimeMinutes)}（${averageOvertimeHelper.helper}）`,
    averageOvertimeHelper.extra,
    `异常打卡：${report.abnormalCount} 次`,
  ].join("\n");
}
