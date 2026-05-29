import { differenceInMinutes, format, getISOWeek } from "date-fns";
import type {
  AttendanceCalculation,
  AttendanceInput,
  AttendanceRecordView,
  WorkRuleInput,
} from "@/types/attendance";
import type { MonthlyReportView, TrendPoint } from "@/types/report";
import { defaultWorkRule } from "@/types/attendance";
import { getChinaCalendarMeta } from "@/lib/calendar/china-calendar";
import { mergeRecordsByWorkDate } from "@/lib/attendance/records";
import { toDateKey, toTimeOnDate } from "./parser";

export function calculateDailyAttendance(
  input: AttendanceInput,
  rule: WorkRuleInput = defaultWorkRule,
): AttendanceCalculation {
  const issues: string[] = [];
  const standardWorkMinutes = rule.standardWorkMinutes;

  if (!input.checkInTime && !input.checkOutTime) {
    return {
      actualWorkMinutes: 0,
      standardWorkMinutes,
      overtimeMinutes: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      status: "ABSENT",
      issues: ["缺少上班和下班打卡"],
    };
  }

  if (!input.checkInTime || !input.checkOutTime) {
    return {
      actualWorkMinutes: 0,
      standardWorkMinutes,
      overtimeMinutes: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      status: "ABNORMAL",
      issues: [!input.checkInTime ? "缺少上班打卡" : "缺少下班打卡"],
    };
  }

  if (input.checkOutTime <= input.checkInTime) {
    return {
      actualWorkMinutes: 0,
      standardWorkMinutes,
      overtimeMinutes: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      status: "ABNORMAL",
      issues: ["下班时间早于或等于上班时间"],
    };
  }

  const start = toTimeOnDate(rule.startTime, input.workDate);
  const end = toTimeOnDate(rule.endTime, input.workDate);
  const overtimeStart = toTimeOnDate(rule.overtimeStartTime, input.workDate);
  const effectiveStart =
    rule.beforeStartNotCount && input.checkInTime < start
      ? start
      : input.checkInTime;
  const lunchMinutes = rule.lunchBreakEnabled ? rule.lunchBreakMinutes : 0;
  const rawActualWorkMinutes = Math.max(
    0,
    differenceInMinutes(input.checkOutTime, effectiveStart) - lunchMinutes,
  );
  const lateMinutes = Math.max(0, differenceInMinutes(input.checkInTime, start));
  const earlyLeaveMinutes = Math.max(
    0,
    differenceInMinutes(end, input.checkOutTime),
  );
  const dayMeta = getChinaCalendarMeta(input.workDate);
  const isCountedNonWorkday =
    (dayMeta.kind === "WEEKEND" && rule.weekendEnabled) ||
    (dayMeta.kind === "HOLIDAY" && rule.holidayEnabled);
  const nonWorkdayWorkLimit = Math.max(0, standardWorkMinutes - lateMinutes);
  const actualWorkMinutes = isCountedNonWorkday
    ? Math.min(rawActualWorkMinutes, nonWorkdayWorkLimit)
    : rawActualWorkMinutes;
  const overtimeMinutes = isCountedNonWorkday
    ? actualWorkMinutes
    : Math.max(0, differenceInMinutes(input.checkOutTime, overtimeStart));

  if (lateMinutes > 0) {
    issues.push(`迟到 ${lateMinutes} 分钟`);
  }
  if (earlyLeaveMinutes > 0) {
    issues.push(`早退 ${earlyLeaveMinutes} 分钟`);
  }

  return {
    actualWorkMinutes,
    standardWorkMinutes,
    overtimeMinutes,
    lateMinutes,
    earlyLeaveMinutes,
    status: lateMinutes > 0 ? "LATE" : earlyLeaveMinutes > 0 ? "EARLY_LEAVE" : "NORMAL",
    issues,
  };
}

export function buildAttendanceRecord(
  id: string,
  input: AttendanceInput,
  rule: WorkRuleInput = defaultWorkRule,
): AttendanceRecordView {
  return {
    id,
    userId: "test-user",
    source: "MANUAL",
    ...input,
    ...calculateDailyAttendance(input, rule),
  };
}

export function calculateMonthlyReport(
  records: AttendanceRecordView[],
  month: string,
): MonthlyReportView {
  const monthRecords = mergeRecordsByWorkDate(records)
    .filter((record) => format(record.workDate, "yyyy-MM") === month)
    .sort((a, b) => a.workDate.getTime() - b.workDate.getTime());

  const workableRecords = monthRecords.filter(
    (record) => !["ABSENT", "ABNORMAL", "REST_DAY", "HOLIDAY"].includes(record.status),
  );
  const overtimeValues = workableRecords.map((record) => record.overtimeMinutes);
  const overtimeMinutes = monthRecords.reduce(
    (sum, record) => sum + record.overtimeMinutes,
    0,
  );
  const workDays = workableRecords.length;

  return {
    month,
    workDays,
    actualWorkMinutes: monthRecords.reduce(
      (sum, record) => sum + record.actualWorkMinutes,
      0,
    ),
    standardWorkMinutes: workDays * 480,
    overtimeMinutes,
    averageOvertimeMinutes: workDays > 0 ? Math.round(overtimeMinutes / workDays) : 0,
    maxDailyOvertimeMinutes:
      overtimeValues.length > 0 ? Math.max(...overtimeValues) : 0,
    minDailyOvertimeMinutes:
      overtimeValues.length > 0 ? Math.min(...overtimeValues) : 0,
    lateCount: monthRecords.filter((record) => record.lateMinutes > 0).length,
    earlyLeaveCount: monthRecords.filter((record) => record.earlyLeaveMinutes > 0).length,
    abnormalCount: monthRecords.filter((record) =>
      ["ABSENT", "ABNORMAL"].includes(record.status),
    ).length,
    dayTrend: groupByDay(monthRecords),
    weekTrend: groupByWeek(monthRecords),
    records: monthRecords,
  };
}

export function groupByMonth(records: AttendanceRecordView[]) {
  return records.reduce<Record<string, AttendanceRecordView[]>>((acc, record) => {
    const key = format(record.workDate, "yyyy-MM");
    acc[key] = [...(acc[key] ?? []), record];
    return acc;
  }, {});
}

export function groupByWeek(records: AttendanceRecordView[]): TrendPoint[] {
  const grouped = records.reduce<Record<string, AttendanceRecordView[]>>((acc, record) => {
    const key = `第 ${getISOWeek(record.workDate)} 周`;
    acc[key] = [...(acc[key] ?? []), record];
    return acc;
  }, {});

  return Object.entries(grouped).map(([label, items]) => ({
    label,
    workMinutes: items.reduce((sum, item) => sum + item.actualWorkMinutes, 0),
    overtimeMinutes: items.reduce((sum, item) => sum + item.overtimeMinutes, 0),
    abnormalCount: items.filter((item) => ["ABSENT", "ABNORMAL"].includes(item.status))
      .length,
  }));
}

function groupByDay(records: AttendanceRecordView[]): TrendPoint[] {
  return records.map((record) => ({
    label: toDateKey(record.workDate).slice(5),
    workMinutes: record.actualWorkMinutes,
    overtimeMinutes: record.overtimeMinutes,
    abnormalCount: ["ABSENT", "ABNORMAL"].includes(record.status) ? 1 : 0,
    punchTimeRange:
      record.checkInTime && record.checkOutTime
        ? `${format(record.checkInTime, "HH:mm")}-${format(record.checkOutTime, "HH:mm")}`
        : undefined,
  }));
}
