import type { AttendanceRecordView } from "./attendance";

export type TrendPoint = {
  label: string;
  workMinutes: number;
  overtimeMinutes: number;
  abnormalCount: number;
};

export type MonthlyReportView = {
  month: string;
  workDays: number;
  actualWorkMinutes: number;
  standardWorkMinutes: number;
  overtimeMinutes: number;
  averageOvertimeMinutes: number;
  maxDailyOvertimeMinutes: number;
  minDailyOvertimeMinutes: number;
  lateCount: number;
  earlyLeaveCount: number;
  abnormalCount: number;
  dayTrend: TrendPoint[];
  weekTrend: TrendPoint[];
  records: AttendanceRecordView[];
  aiSummary?: string;
};
