import { calculateDailyAttendance } from "@/lib/attendance/calculate";
import type { AttendanceStatus, WorkRuleInput } from "@/types/attendance";

export type ImportableAttendanceRecord = {
  workDate: Date;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  rawCheckInText?: string | null;
  rawCheckOutText?: string | null;
  actualWorkMinutes: number;
  standardWorkMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: AttendanceStatus;
  remark?: string | null;
};

export function normalizeImportedRecord(
  record: ImportableAttendanceRecord,
  rule: WorkRuleInput,
): ImportableAttendanceRecord {
  if (record.status === "REST_DAY" || record.status === "HOLIDAY") {
    return {
      ...record,
      actualWorkMinutes: 0,
      standardWorkMinutes: 0,
      overtimeMinutes: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
    };
  }

  const calculation = calculateDailyAttendance(
    {
      workDate: record.workDate,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
      rawCheckInText: record.rawCheckInText,
      rawCheckOutText: record.rawCheckOutText,
      remark: record.remark,
    },
    rule,
  );

  return {
    ...record,
    ...calculation,
  };
}
