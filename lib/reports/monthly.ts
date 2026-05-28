import type { AttendanceRecordView } from "@/types/attendance";
import { calculateMonthlyReport } from "@/lib/attendance/calculate";
import { formatMinutes } from "@/lib/attendance/formatter";

export function generateMonthlyReport(records: AttendanceRecordView[], month: string) {
  return calculateMonthlyReport(records, month);
}

export function buildReportText(report: ReturnType<typeof calculateMonthlyReport>) {
  return [
    `${report.month} 加班月报`,
    `出勤天数：${report.workDays} 天`,
    `总有效出勤：${report.actualWorkMinutes} 分钟`,
    `总标准工时：${report.standardWorkMinutes} 分钟`,
    `总加班：${report.overtimeMinutes} 分钟`,
    `加班时长：${formatMinutes(report.overtimeMinutes)}`,
    `平均每日加班：${formatMinutes(report.averageOvertimeMinutes)}`,
    `异常打卡：${report.abnormalCount} 次`,
  ].join("\n");
}
