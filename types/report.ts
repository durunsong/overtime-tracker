import type { AttendanceRecordView } from "./attendance";

import type { WorkRuleInput } from "./attendance";

export type WorkRuleSnapshot = Pick<
  WorkRuleInput,
  | "name"
  | "startTime"
  | "endTime"
  | "standardWorkMinutes"
  | "overtimeStartTime"
  | "beforeStartNotCount"
  | "lunchBreakStartTime"
  | "lunchBreakEnabled"
  | "lunchBreakMinutes"
  | "weekendEnabled"
  | "holidayEnabled"
>;

export type TrendPoint = {
  label: string;
  workMinutes: number;
  overtimeMinutes: number;
  abnormalCount: number;
  punchTimeRange?: string;
};

export type MonthlyReportView = {
  month: string;
  workDays: number;
  actualWorkMinutes: number;
  standardWorkMinutes: number;
  overtimeMinutes: number;
  averageOvertimeMinutes: number;
  weekendOvertimeMinutes: number;
  weekdayWorkDays: number;
  weekendWorkDays: number;
  maxDailyOvertimeMinutes: number;
  minDailyOvertimeMinutes: number;
  lateCount: number;
  earlyLeaveCount: number;
  abnormalCount: number;
  dayTrend: TrendPoint[];
  weekTrend: TrendPoint[];
  records: AttendanceRecordView[];
  appliedRule?: WorkRuleSnapshot;
  aiSummary?: string;
};
