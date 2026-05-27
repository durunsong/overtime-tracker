import { describe, expect, it } from "vitest";
import { buildAttendanceRecord, calculateDailyAttendance, calculateMonthlyReport } from "./calculate";
import { formatMinutes, minutesToDecimalHours } from "./formatter";
import { parseExcelDate, parseTime, toDateKey } from "./parser";
import { buildCalendarMonth, getChinaCalendarMeta } from "@/lib/calendar/china-calendar";

describe("attendance calculation", () => {
  it("does not count check-in time before 09:30 as extra work", () => {
    const workDate = new Date("2026-05-04T00:00:00");
    const result = calculateDailyAttendance({
      workDate,
      checkInTime: parseTime("08:50", workDate),
      checkOutTime: parseTime("19:30", workDate),
    });

    expect(result.actualWorkMinutes).toBe(600);
    expect(result.overtimeMinutes).toBe(30);
    expect(result.status).toBe("NORMAL");
  });

  it("marks missing punches and reversed time as abnormal", () => {
    const workDate = new Date("2026-05-05T00:00:00");
    expect(
      calculateDailyAttendance({
        workDate,
        checkInTime: parseTime("09:30", workDate),
        checkOutTime: null,
      }).status,
    ).toBe("ABNORMAL");
    expect(
      calculateDailyAttendance({
        workDate,
        checkInTime: parseTime("20:00", workDate),
        checkOutTime: parseTime("09:30", workDate),
      }).status,
    ).toBe("ABNORMAL");
  });

  it("builds monthly report trends and counters", () => {
    const records = [
      buildAttendanceRecord("case-1", {
        workDate: new Date("2026-05-04T00:00:00"),
        checkInTime: parseTime("09:20", new Date("2026-05-04T00:00:00")),
        checkOutTime: parseTime("20:00", new Date("2026-05-04T00:00:00")),
      }),
      buildAttendanceRecord("case-2", {
        workDate: new Date("2026-05-05T00:00:00"),
        checkInTime: parseTime("09:35", new Date("2026-05-05T00:00:00")),
        checkOutTime: parseTime("21:00", new Date("2026-05-05T00:00:00")),
      }),
      buildAttendanceRecord("case-3", {
        workDate: new Date("2026-05-06T00:00:00"),
        checkInTime: parseTime("09:20", new Date("2026-05-06T00:00:00")),
        checkOutTime: null,
      }),
    ];
    const report = calculateMonthlyReport(records, "2026-05");
    expect(report.workDays).toBeGreaterThan(0);
    expect(report.overtimeMinutes).toBeGreaterThan(0);
    expect(report.dayTrend.length).toBe(3);
    expect(report.abnormalCount).toBe(1);
  });

  it("parses common date and time formats", () => {
    const date = parseExcelDate("2026/05/06");
    expect(date ? toDateKey(date) : null).toBe("2026-05-06");
    expect(parseTime("19:45", date as Date)?.getHours()).toBe(19);
  });

  it("formats minutes for UI and decimal hours", () => {
    expect(formatMinutes(90)).toBe("1小时30分钟");
    expect(minutesToDecimalHours(90)).toBe(1.5);
  });

  it("marks China holidays on the monthly calendar", () => {
    expect(getChinaCalendarMeta(new Date("2026-10-01T00:00:00")).kind).toBe("HOLIDAY");
    const month = buildCalendarMonth("2026-10", []);
    expect(month.days.some((day) => day.date === "2026-10-01" && day.name === "国庆节")).toBe(true);
  });
});
