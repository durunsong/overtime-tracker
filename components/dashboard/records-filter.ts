import type { AttendanceStatus } from "@/types/attendance";

export type RecordFilterState = {
  keyword: string;
  month: string;
  status: AttendanceStatus | "ALL";
};

export const DEFAULT_RECORD_FILTERS: RecordFilterState = {
  keyword: "",
  month: "2026-05",
  status: "ALL",
};

export function resetRecordFilters(): RecordFilterState {
  return { ...DEFAULT_RECORD_FILTERS };
}
