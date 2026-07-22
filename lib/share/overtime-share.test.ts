import { describe, expect, it } from "vitest";
import {
  buildOvertimeSharePayload,
  formatChinaShareDateTime,
  parseOvertimeSharePayload,
  sanitizeShareToken,
} from "@/lib/share/overtime-share";
import { toDateKey } from "@/lib/attendance/parser";
import { defaultWorkRule } from "@/types/attendance";
import { toWorkRuleSnapshot } from "@/lib/attendance/work-rule";
import type { MonthlyReportView } from "@/types/report";

const report: MonthlyReportView = {
  month: "2026-05",
  workDays: 2,
  actualWorkMinutes: 1_090,
  standardWorkMinutes: 960,
  overtimeMinutes: 130,
  averageOvertimeMinutes: 65,
  weekendOvertimeMinutes: 0,
  weekdayWorkDays: 2,
  weekendWorkDays: 0,
  maxDailyOvertimeMinutes: 90,
  minDailyOvertimeMinutes: 40,
  lateCount: 1,
  earlyLeaveCount: 0,
  abnormalCount: 0,
  dayTrend: [{ label: "05-27", workMinutes: 570, overtimeMinutes: 90, abnormalCount: 0 }],
  weekTrend: [{ label: "第 22 周", workMinutes: 1_090, overtimeMinutes: 130, abnormalCount: 0 }],
  records: [
    {
      id: "record-1",
      userId: "user-1",
      workDate: new Date("2026-05-27T00:00:00.000Z"),
      checkInTime: new Date("2026-05-27T09:40:00.000Z"),
      checkOutTime: new Date("2026-05-27T20:30:00.000Z"),
      rawCheckInText: "09:40",
      rawCheckOutText: "20:30",
      actualWorkMinutes: 650,
      standardWorkMinutes: 480,
      overtimeMinutes: 90,
      lateMinutes: 10,
      earlyLeaveMinutes: 0,
      status: "LATE",
      source: "MANUAL",
      remark: "项目发布",
      issues: [],
    },
  ],
  appliedRule: toWorkRuleSnapshot(defaultWorkRule),
};

describe("overtime share payload", () => {
  it("builds a public snapshot without login-only identifiers", () => {
    const payload = buildOvertimeSharePayload(report, {
      ownerName: "张三",
      createdAt: new Date("2026-05-28T10:00:00.000Z"),
    });

    expect(payload.ownerName).toBe("张三");
    expect(payload.version).toBe(2);
    expect(payload.appliedRule.startTime).toBe(defaultWorkRule.startTime);
    expect(payload.report.overtimeMinutes).toBe(130);
    expect(payload.report.records[0]).not.toHaveProperty("userId");
    expect(payload.report.records[0]).not.toHaveProperty("id");
    expect(payload.report.records[0].workDate).toBe("2026-05-27T00:00:00.000Z");
  });

  it("restores date fields when reading the public snapshot", () => {
    const payload = buildOvertimeSharePayload(report, {
      ownerName: "张三",
      createdAt: new Date("2026-05-28T10:00:00.000Z"),
    });

    const parsed = parseOvertimeSharePayload(payload);

    expect(parsed.report.records[0].workDate).toBeInstanceOf(Date);
    expect(parsed.report.records[0].checkInTime?.toISOString()).toBe("2026-05-27T01:40:00.000Z");
    expect(parsed.report.records[0].checkOutTime?.toISOString()).toBe("2026-05-27T12:30:00.000Z");
  });

  it("deduplicates public snapshots by calendar date while preserving snapshot totals", () => {
    const payload = buildOvertimeSharePayload(
      {
        ...report,
        records: [
          {
            ...report.records[0],
            id: "old-1",
            workDate: new Date("2026-05-26T00:00:00.000Z"),
            checkOutTime: new Date("2026-05-26T22:22:00.000Z"),
            overtimeMinutes: 202,
            remark: "来源：user_screenshot",
          },
          {
            ...report.records[0],
            id: "new-1",
            workDate: new Date("2026-05-26T08:00:00.000Z"),
            checkOutTime: new Date("2026-05-26T22:31:00.000Z"),
            overtimeMinutes: 211,
            remark: "AI 截图导入：最终确认为 22:31",
          },
        ],
      },
      {
        ownerName: "张三",
        createdAt: new Date("2026-05-28T10:00:00.000Z"),
      },
    );

    const parsed = parseOvertimeSharePayload(payload);

    expect(parsed.report.records).toHaveLength(1);
    expect(parsed.report.records[0]).toEqual(
      expect.objectContaining({
        overtimeMinutes: 211,
        remark: "AI 截图导入：最终确认为 22:31",
      }),
    );
    expect(toDateKey(parsed.report.records[0]!.workDate)).toBe("2026-05-26");
    expect(parsed.report.overtimeMinutes).toBe(130);
    expect(parsed.report.records[0]?.overtimeMinutes).toBe(211);
    expect(parsed.report.appliedRule?.startTime).toBe(defaultWorkRule.startTime);
  });

  it("rejects tokens outside the share URL alphabet", () => {
    expect(sanitizeShareToken("abc_123-XYZ_4567")).toBe("abc_123-XYZ_4567");
    expect(() => sanitizeShareToken("../secret")).toThrow("分享链接无效");
  });

  it("formats share creation time in China UTC+8 time", () => {
    expect(formatChinaShareDateTime(new Date("2026-05-28T17:35:22.000Z"))).toBe(
      "2026-05-29 01:35:22 (UTC+8)",
    );
  });
});
