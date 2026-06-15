import { getCurrentMonthKey } from "@/lib/calendar/month";
import type { AttendanceStatus } from "@/types/attendance";

export const RECORD_STATUS_FILTERS = [
  "ALL",
  "NORMAL",
  "LATE",
  "EARLY_LEAVE",
  "ABSENT",
  "REST_DAY",
  "HOLIDAY",
  "ABNORMAL",
] as const satisfies readonly (AttendanceStatus | "ALL")[];

export type RecordStatusFilter = (typeof RECORD_STATUS_FILTERS)[number];

export type RecordFilterState = {
  keyword: string;
  month: string;
  status: RecordStatusFilter;
};

export function createDefaultRecordFilters(now = new Date()): RecordFilterState {
  return {
    keyword: "",
    month: getCurrentMonthKey(now),
    status: "ALL",
  };
}

export function resetRecordFilters(now = new Date()): RecordFilterState {
  return createDefaultRecordFilters(now);
}

export function isRecordStatusFilter(value: string): value is RecordStatusFilter {
  return RECORD_STATUS_FILTERS.includes(value as RecordStatusFilter);
}
