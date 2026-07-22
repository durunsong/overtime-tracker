import { addMinutes, differenceInMinutes, getISOWeek } from "date-fns";
import type {
  AttendanceCalculation,
  AttendanceInput,
  AttendanceRecordView,
  WorkRuleInput,
} from "@/types/attendance";
import type { MonthlyReportView, TrendPoint } from "@/types/report";
import { defaultWorkRule } from "@/types/attendance";
import { getChinaCalendarMeta } from "@/lib/calendar/china-calendar";
import {
  isCountedNonWorkdayKind,
  resolveEffectiveDayKind,
  type WorkDayOverrideKind,
} from "@/lib/calendar/day-kind";
import { mergeRecordsByWorkDate } from "@/lib/attendance/records";
import { toWorkRuleSnapshot } from "@/lib/attendance/work-rule";
import { formatPunchTimeRange } from "@/lib/attendance/formatter";
import { toDateKey, toTimeOnDate } from "./parser";

export type DailyCalculationOptions = {
  dayKindOverride?: WorkDayOverrideKind | null;
};

function isWeekendLikeDay(workDate: Date, overrideMap?: Map<string, WorkDayOverrideKind>) {
  const baseKind = getChinaCalendarMeta(workDate).kind;
  const effectiveKind = resolveEffectiveDayKind(
    baseKind,
    overrideMap?.get(toDateKey(workDate)),
  );
  return effectiveKind === "WEEKEND";
}

const defaultLunchBreakStartTime = defaultWorkRule.lunchBreakStartTime;

export function calculateDailyAttendance(
  input: AttendanceInput,
  rule: WorkRuleInput = defaultWorkRule,
  options: DailyCalculationOptions = {},
): AttendanceCalculation {
  const issues: string[] = [];
  const standardWorkMinutes = rule.standardWorkMinutes;
  const effectiveKind = resolveEffectiveDayKind(
    getChinaCalendarMeta(input.workDate).kind,
    options.dayKindOverride,
  );

  if (effectiveKind === "FORCED_REST") {
    return {
      actualWorkMinutes: 0,
      standardWorkMinutes: 0,
      overtimeMinutes: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      status: "REST_DAY",
      issues: [],
    };
  }

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
  const lunchMinutes = rule.lunchBreakEnabled
    ? calculateLunchBreakOverlapMinutes(effectiveStart, input.checkOutTime, input.workDate, rule)
    : 0;
  const rawActualWorkMinutes = Math.max(
    0,
    differenceInMinutes(input.checkOutTime, effectiveStart) - lunchMinutes,
  );
  const lateMinutes = Math.max(0, differenceInMinutes(input.checkInTime, start));
  const earlyLeaveMinutes = Math.max(
    0,
    differenceInMinutes(end, input.checkOutTime),
  );
  const isCountedNonWorkday = isCountedNonWorkdayKind(effectiveKind, rule);
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

function calculateLunchBreakOverlapMinutes(
  effectiveStart: Date,
  effectiveEnd: Date,
  workDate: Date,
  rule: WorkRuleInput,
) {
  if (rule.lunchBreakMinutes <= 0) return 0;

  const lunchStart = toTimeOnDate(rule.lunchBreakStartTime || defaultLunchBreakStartTime, workDate);
  const lunchEnd = addMinutes(lunchStart, rule.lunchBreakMinutes);
  const overlapStart = Math.max(effectiveStart.getTime(), lunchStart.getTime());
  const overlapEnd = Math.min(effectiveEnd.getTime(), lunchEnd.getTime());

  return Math.max(0, Math.floor((overlapEnd - overlapStart) / 60_000));
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
  rule: WorkRuleInput = defaultWorkRule,
  overrideMap: Map<string, WorkDayOverrideKind> = new Map(),
): MonthlyReportView {
  const monthRecords = mergeRecordsByWorkDate(records)
    .filter((record) => toDateKey(record.workDate).startsWith(month))
    .sort((a, b) => a.workDate.getTime() - b.workDate.getTime());

  const workableRecords = monthRecords.filter(
    (record) => !["ABSENT", "ABNORMAL", "REST_DAY", "HOLIDAY"].includes(record.status),
  );
  const weekdayRecords = workableRecords.filter(
    (record) => !isWeekendLikeDay(record.workDate, overrideMap),
  );
  const weekendRecords = workableRecords.filter((record) =>
    isWeekendLikeDay(record.workDate, overrideMap),
  );
  const overtimeValues = workableRecords.map((record) => record.overtimeMinutes);
  const weekdayOvertimeMinutes = weekdayRecords.reduce(
    (sum, record) => sum + record.overtimeMinutes,
    0,
  );
  const weekendOvertimeMinutes = weekendRecords.reduce(
    (sum, record) => sum + record.overtimeMinutes,
    0,
  );
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
    standardWorkMinutes: workDays * rule.standardWorkMinutes,
    overtimeMinutes,
    averageOvertimeMinutes:
      weekdayRecords.length > 0 ? Math.round(weekdayOvertimeMinutes / weekdayRecords.length) : 0,
    weekendOvertimeMinutes,
    weekdayWorkDays: weekdayRecords.length,
    weekendWorkDays: weekendRecords.length,
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
    appliedRule: toWorkRuleSnapshot(rule),
  };
}

export function groupByMonth(records: AttendanceRecordView[]) {
  return records.reduce<Record<string, AttendanceRecordView[]>>((acc, record) => {
    const key = toDateKey(record.workDate).slice(0, 7);
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
    punchTimeRange: formatPunchTimeRange(record),
  }));
}
