import { describe, expect, test } from "vitest";
import { buildReportText } from "./monthly";
import { buildPrintableReportHtml } from "./export-pdf";
import type { MonthlyReportView } from "@/types/report";

const report: MonthlyReportView = {
  month: "2026-05",
  workDays: 2,
  actualWorkMinutes: 1080,
  standardWorkMinutes: 960,
  overtimeMinutes: 150,
  averageOvertimeMinutes: 75,
  weekendOvertimeMinutes: 0,
  weekdayWorkDays: 2,
  weekendWorkDays: 0,
  maxDailyOvertimeMinutes: 120,
  minDailyOvertimeMinutes: 30,
  lateCount: 0,
  earlyLeaveCount: 0,
  abnormalCount: 1,
  aiSummary: "这段 AI 总结不应出现在打印版中。",
  dayTrend: [],
  weekTrend: [],
  records: [
    {
      id: "record-1",
      userId: "user-1",
      source: "MANUAL",
      workDate: new Date("2026-05-01T00:00:00.000Z"),
      checkInTime: new Date("2026-05-01T09:30:00.000Z"),
      checkOutTime: new Date("2026-05-01T21:00:00.000Z"),
      rawCheckInText: "09:30",
      rawCheckOutText: "21:00",
      actualWorkMinutes: 690,
      standardWorkMinutes: 480,
      overtimeMinutes: 120,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      status: "NORMAL",
      issues: [],
      remark: null,
    },
  ],
};

describe("monthly report output", () => {
  test("复制文本同时包含加班分钟和易读时长", () => {
    const text = buildReportText(report);

    expect(text).toContain("加班时长：2小时30分钟");
    expect(text).toContain("平均每日加班：1小时15分钟（按工作日平均，不含周末加班）");
    expect(text).toContain("本月无周末打卡，平均值仅统计工作日");
  });

  test("打印版不包含 AI 总结区块", () => {
    const html = buildPrintableReportHtml(report);

    expect(html).not.toContain("AI 总结");
    expect(html).not.toContain(report.aiSummary);
  });
});
