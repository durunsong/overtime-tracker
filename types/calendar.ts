import type { AttendanceRecordView } from "./attendance";

export type ChinaDayKind = "WORKDAY" | "WEEKEND" | "HOLIDAY" | "ADJUSTED_WORKDAY";

export type ChinaCalendarMeta = {
  date: string;
  kind: ChinaDayKind;
  name?: string;
  lunarText?: string;
  wageRate?: 1 | 2 | 3;
};

export type CalendarDay = ChinaCalendarMeta & {
  dayOfMonth: number;
  weekday: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  record: AttendanceRecordView | null;
};

export type CalendarMonth = {
  month: string;
  monthlyOvertimeMinutes: number;
  days: CalendarDay[];
};
