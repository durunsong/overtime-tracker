import { describe, expect, it } from "vitest";
import { buildAttendanceRecord, calculateDailyAttendance, calculateMonthlyReport } from "./calculate";
import { formatMinutes, minutesToDecimalHours } from "./formatter";
import { parseExcelDate, parseTime, toDateKey } from "./parser";
import { buildCalendarMonth, getChinaCalendarMeta } from "@/lib/calendar/china-calendar";
import {
  chinaHolidayRuleSources,
  getChinaHolidayDefinition,
  getSupportedChinaHolidayYears,
} from "@/lib/calendar/china-holiday-rules";
import { defaultWorkRule } from "@/types/attendance";

describe("attendance calculation", () => {
  it("respects per-user custom work hours and overtime thresholds", () => {
    const customRule = {
      ...defaultWorkRule,
      startTime: "10:00",
      endTime: "18:30",
      standardWorkMinutes: 510,
      overtimeStartTime: "18:30",
      beforeStartNotCount: true,
      lunchBreakEnabled: false,
      weekendEnabled: false,
    };
    const workDate = new Date("2026-05-04T00:00:00");
    const result = calculateDailyAttendance(
      {
        workDate,
        checkInTime: parseTime("09:30", workDate),
        checkOutTime: parseTime("19:00", workDate),
      },
      customRule,
    );

    expect(result.lateMinutes).toBe(0);
    expect(result.actualWorkMinutes).toBe(540);
    expect(result.overtimeMinutes).toBe(30);
    expect(result.status).toBe("NORMAL");
  });

  it("uses configurable lunch break start time when deducting overlap", () => {
    const workDate = new Date("2026-05-04T00:00:00");
    const result = calculateDailyAttendance(
      {
        workDate,
        checkInTime: parseTime("09:30", workDate),
        checkOutTime: parseTime("19:00", workDate),
      },
      {
        ...defaultWorkRule,
        lunchBreakStartTime: "13:00",
        lunchBreakMinutes: 60,
        lunchBreakEnabled: true,
      },
    );

    expect(result.actualWorkMinutes).toBe(510);
    expect(result.overtimeMinutes).toBe(0);
  });

  it("calculates monthly standard minutes from the active rule", () => {
    const weekday = buildAttendanceRecord("weekday", {
      workDate: new Date("2026-05-04T00:00:00"),
      checkInTime: parseTime("09:15", new Date("2026-05-04T00:00:00")),
      checkOutTime: parseTime("19:07", new Date("2026-05-04T00:00:00")),
    });
    const report = calculateMonthlyReport([weekday], "2026-05", {
      ...defaultWorkRule,
      standardWorkMinutes: 510,
    });

    expect(report.standardWorkMinutes).toBe(510);
  });

  it("does not count check-in time before 09:30 as extra work", () => {
    const workDate = new Date("2026-05-04T00:00:00");
    const result = calculateDailyAttendance({
      workDate,
      checkInTime: parseTime("08:50", workDate),
      checkOutTime: parseTime("19:30", workDate),
    });

    expect(result.actualWorkMinutes).toBe(510);
    expect(result.overtimeMinutes).toBe(30);
    expect(result.status).toBe("NORMAL");
  });

  it("counts regular weekend work as eight overtime hours by default", () => {
    const workDate = new Date("2026-05-30T00:00:00");
    const result = calculateDailyAttendance({
      workDate,
      checkInTime: parseTime("09:17", workDate),
      checkOutTime: parseTime("19:43", workDate),
    });

    expect(getChinaCalendarMeta(workDate).kind).toBe("WEEKEND");
    expect(result.actualWorkMinutes).toBe(480);
    expect(result.overtimeMinutes).toBe(480);
    expect(result.lateMinutes).toBe(0);
    expect(result.status).toBe("NORMAL");
  });

  it("deducts late arrival from regular weekend overtime by default", () => {
    const workDate = new Date("2026-05-30T00:00:00");
    const result = calculateDailyAttendance({
      workDate,
      checkInTime: parseTime("10:00", workDate),
      checkOutTime: parseTime("19:00", workDate),
    });

    expect(result.actualWorkMinutes).toBe(450);
    expect(result.overtimeMinutes).toBe(450);
    expect(result.lateMinutes).toBe(30);
    expect(result.status).toBe("LATE");
  });

  it("caps weekend overtime at standard work minutes when weekends are counted", () => {
    const workDate = new Date("2026-05-23T00:00:00");
    const result = calculateDailyAttendance(
      {
        workDate,
        checkInTime: parseTime("08:50", workDate),
        checkOutTime: parseTime("20:30", workDate),
      },
      {
        ...defaultWorkRule,
        weekendEnabled: true,
      },
    );

    expect(result.actualWorkMinutes).toBe(480);
    expect(result.overtimeMinutes).toBe(480);
    expect(result.status).toBe("NORMAL");
  });

  it("subtracts late arrival from counted weekend overtime", () => {
    const workDate = new Date("2026-05-23T00:00:00");
    const result = calculateDailyAttendance(
      {
        workDate,
        checkInTime: parseTime("10:00", workDate),
        checkOutTime: parseTime("20:30", workDate),
      },
      {
        ...defaultWorkRule,
        weekendEnabled: true,
      },
    );

    expect(result.actualWorkMinutes).toBe(450);
    expect(result.overtimeMinutes).toBe(450);
    expect(result.lateMinutes).toBe(30);
    expect(result.status).toBe("LATE");
  });

  it("counts actual weekend work when leaving before the normal end time", () => {
    const workDate = new Date("2026-05-23T00:00:00");
    const result = calculateDailyAttendance(
      {
        workDate,
        checkInTime: parseTime("08:50", workDate),
        checkOutTime: parseTime("11:30", workDate),
      },
      {
        ...defaultWorkRule,
        weekendEnabled: true,
      },
    );

    expect(result.actualWorkMinutes).toBe(120);
    expect(result.overtimeMinutes).toBe(120);
  });

  it("treats an adjusted workday on Saturday as a normal workday", () => {
    const workDate = new Date("2026-05-09T00:00:00");
    const result = calculateDailyAttendance(
      {
        workDate,
        checkInTime: parseTime("09:18", workDate),
        checkOutTime: parseTime("19:14", workDate),
      },
      {
        ...defaultWorkRule,
        weekendEnabled: true,
      },
    );

    expect(getChinaCalendarMeta(workDate).kind).toBe("ADJUSTED_WORKDAY");
    expect(result.actualWorkMinutes).toBe(494);
    expect(result.overtimeMinutes).toBe(14);
    expect(result.status).toBe("NORMAL");
  });

  it("counts enabled China holidays with the non-workday overtime rule", () => {
    const workDate = new Date("2026-10-01T00:00:00");
    const result = calculateDailyAttendance(
      {
        workDate,
        checkInTime: parseTime("09:15", workDate),
        checkOutTime: parseTime("19:30", workDate),
      },
      {
        ...defaultWorkRule,
        holidayEnabled: true,
      },
    );

    expect(getChinaCalendarMeta(workDate).kind).toBe("HOLIDAY");
    expect(result.actualWorkMinutes).toBe(480);
    expect(result.overtimeMinutes).toBe(480);
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

  it("calculates weekday average overtime without weekend records", () => {
    const weekday = buildAttendanceRecord("weekday", {
      workDate: new Date("2026-05-04T00:00:00"),
      checkInTime: parseTime("09:15", new Date("2026-05-04T00:00:00")),
      checkOutTime: parseTime("19:07", new Date("2026-05-04T00:00:00")),
    });
    const weekend = buildAttendanceRecord("weekend", {
      workDate: new Date("2026-05-30T00:00:00"),
      checkInTime: parseTime("09:17", new Date("2026-05-30T00:00:00")),
      checkOutTime: parseTime("19:43", new Date("2026-05-30T00:00:00")),
    });

    const report = calculateMonthlyReport([weekday, weekend], "2026-05", defaultWorkRule);

    expect(report.weekdayWorkDays).toBe(1);
    expect(report.weekendWorkDays).toBe(1);
    expect(report.weekendOvertimeMinutes).toBe(480);
    expect(report.averageOvertimeMinutes).toBe(weekday.overtimeMinutes);
    expect(report.averageOvertimeMinutes).toBeLessThan(weekend.overtimeMinutes);
  });

  it("builds monthly report trends and counters", () => {
    const records = [
      buildAttendanceRecord("case-1", {
        workDate: new Date("2026-05-04T00:00:00"),
        checkInTime: parseTime("09:15", new Date("2026-05-04T00:00:00")),
        checkOutTime: parseTime("19:07", new Date("2026-05-04T00:00:00")),
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
    const report = calculateMonthlyReport(records, "2026-05", defaultWorkRule);
    expect(report.workDays).toBeGreaterThan(0);
    expect(report.overtimeMinutes).toBeGreaterThan(0);
    expect(report.dayTrend.length).toBe(3);
    expect(report.dayTrend[0].punchTimeRange).toBe("09:15-19:07");
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
    expect(getChinaCalendarMeta(new Date("2026-05-09T00:00:00")).kind).toBe("ADJUSTED_WORKDAY");
    expect(getChinaCalendarMeta(new Date("2026-05-09T00:00:00")).lunarText).toBe("三月廿三");
    expect(getChinaCalendarMeta(new Date("2026-05-23T00:00:00")).lunarText).toBe("四月初七");
    const month = buildCalendarMonth("2026-10", []);
    expect(month.days.some((day) => day.date === "2026-10-01" && day.name === "国庆节")).toBe(true);
  });

  it("keeps China holiday rules traceable by year and source", () => {
    expect(getSupportedChinaHolidayYears()).toContain(2026);
    expect(chinaHolidayRuleSources[2026]?.officialNoticeUrl).toContain("gov.cn");
    expect(chinaHolidayRuleSources[2026]?.providerApiUrl).toContain("timor.tech");
    expect(getChinaHolidayDefinition("2026-05-09")?.kind).toBe("ADJUSTED_WORKDAY");
    expect(getChinaHolidayDefinition("2027-05-09")).toBeNull();
  });

  it("summarizes monthly overtime on the calendar from current-month records", () => {
    const mayRecord = buildAttendanceRecord("may-case", {
      workDate: new Date("2026-05-26T00:00:00"),
      checkInTime: parseTime("09:15", new Date("2026-05-26T00:00:00")),
      checkOutTime: parseTime("21:00", new Date("2026-05-26T00:00:00")),
    });
    const aprilRecord = buildAttendanceRecord("april-case", {
      workDate: new Date("2026-04-27T00:00:00"),
      checkInTime: parseTime("09:15", new Date("2026-04-27T00:00:00")),
      checkOutTime: parseTime("22:00", new Date("2026-04-27T00:00:00")),
    });

    const calendar = buildCalendarMonth("2026-05", [aprilRecord, mayRecord]);

    expect(calendar.monthlyOvertimeMinutes).toBe(120);
    expect(
      calendar.days.find((day) => day.date === "2026-05-26")?.record?.id,
    ).toBe("may-case");
    expect(
      calendar.days.find((day) => day.date === "2026-04-27")?.record,
    ).toBeNull();
  });
});
