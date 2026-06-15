import type { AttendanceStatus } from "@/types/attendance";
import { getCurrentMonth } from "@/lib/date/month";

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

export const DEFAULT_RECORD_FILTERS: RecordFilterState = {
  keyword: "",
  month: getCurrentMonth(),
  status: "ALL",
};

export function resetRecordFilters(): RecordFilterState {
  return { ...DEFAULT_RECORD_FILTERS, month: getCurrentMonth() };
}

export function isRecordStatusFilter(value: string): value is RecordStatusFilter {
  return RECORD_STATUS_FILTERS.includes(value as RecordStatusFilter);
}
