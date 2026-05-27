import * as XLSX from "xlsx";
import type { MonthlyReportView } from "@/types/report";
import { formatMinutes } from "@/lib/attendance/formatter";
import { toDateKey } from "@/lib/attendance/parser";

export function exportMonthlyReportExcel(report: MonthlyReportView) {
  const workbook = XLSX.utils.book_new();
  const summary = [
    ["月份", report.month],
    ["出勤天数", report.workDays],
    ["总有效出勤", formatMinutes(report.actualWorkMinutes)],
    ["总标准工时", formatMinutes(report.standardWorkMinutes)],
    ["总加班", formatMinutes(report.overtimeMinutes)],
    ["平均每日加班", formatMinutes(report.averageOvertimeMinutes)],
    ["最高单日加班", formatMinutes(report.maxDailyOvertimeMinutes)],
    ["最低单日加班", formatMinutes(report.minDailyOvertimeMinutes)],
    ["迟到次数", report.lateCount],
    ["早退次数", report.earlyLeaveCount],
    ["异常次数", report.abnormalCount],
    ["AI 总结", report.aiSummary ?? ""],
  ];
  const details = report.records.map((record) => ({
    日期: toDateKey(record.workDate),
    上班打卡: record.rawCheckInText ?? "",
    下班打卡: record.rawCheckOutText ?? "",
    有效出勤: formatMinutes(record.actualWorkMinutes),
    标准工时: formatMinutes(record.standardWorkMinutes),
    加班时长: formatMinutes(record.overtimeMinutes),
    状态: record.status,
    备注: record.remark ?? "",
  }));

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), "月度汇总");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(details), "每日明细");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
