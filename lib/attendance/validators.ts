import { z } from "zod";
import type { AttendanceRowInput, AttendanceStatus, WorkRuleInput } from "@/types/attendance";
import { defaultWorkRule } from "@/types/attendance";
import { calculateDailyAttendance } from "./calculate";
import { parseExcelDate, parseTime } from "./parser";

export const attendanceRecordSchema = z.object({
  workDate: z.coerce.date(),
  checkInTime: z.coerce.date().nullable().optional(),
  checkOutTime: z.coerce.date().nullable().optional(),
  rawCheckInText: z.string().nullable().optional(),
  rawCheckOutText: z.string().nullable().optional(),
  remark: z.string().max(500).nullable().optional(),
});

export const recordQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  status: z.string().optional(),
  keyword: z.string().optional(),
});

export const workRuleSchema = z.object({
  name: z.string().min(1).default("默认工作日规则"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  standardWorkMinutes: z.coerce.number().int().positive(),
  overtimeStartTime: z.string().regex(/^\d{2}:\d{2}$/),
  beforeStartNotCount: z.boolean(),
  lunchBreakEnabled: z.boolean(),
  lunchBreakMinutes: z.coerce.number().int().min(0),
  weekendEnabled: z.boolean(),
  holidayEnabled: z.boolean(),
  isDefault: z.boolean().optional(),
});

export function validateAttendanceRow(
  row: AttendanceRowInput,
  rule: WorkRuleInput = defaultWorkRule,
) {
  const workDate = parseExcelDate(row.date);
  const errors: string[] = [];

  if (!workDate) {
    return {
      record: null,
      errors: ["日期格式异常"],
    };
  }

  const checkInTime = parseTime(row.checkIn, workDate);
  const checkOutTime = parseTime(row.checkOut, workDate);
  const nonWorkdayStatus = getNonWorkdayStatus(row.statusText);

  if (!checkInTime && !checkOutTime && nonWorkdayStatus) {
    return {
      record: {
        id: `preview-${workDate.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: "preview-user",
        source: "EXCEL_IMPORT" as const,
        workDate,
        checkInTime: null,
        checkOutTime: null,
        rawCheckInText: row.checkIn == null ? null : String(row.checkIn),
        rawCheckOutText: row.checkOut == null ? null : String(row.checkOut),
        remark: row.remark ?? row.statusText ?? null,
        actualWorkMinutes: 0,
        standardWorkMinutes: 0,
        overtimeMinutes: 0,
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        status: nonWorkdayStatus,
        issues: [],
      },
      errors: [],
    };
  }

  const calculation = calculateDailyAttendance(
    {
      workDate,
      checkInTime,
      checkOutTime,
      rawCheckInText: row.checkIn == null ? null : String(row.checkIn),
      rawCheckOutText: row.checkOut == null ? null : String(row.checkOut),
      remark: row.remark,
    },
    rule,
  );

  errors.push(...calculation.issues);

  return {
    record: {
      id: `preview-${workDate.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: "preview-user",
      source: "EXCEL_IMPORT" as const,
      workDate,
      checkInTime,
      checkOutTime,
      rawCheckInText: row.checkIn == null ? null : String(row.checkIn),
      rawCheckOutText: row.checkOut == null ? null : String(row.checkOut),
      remark: row.remark ?? row.statusText ?? null,
      ...calculation,
    },
    errors,
  };
}

function getNonWorkdayStatus(statusText?: string): AttendanceStatus | null {
  const normalized = statusText?.trim().toLowerCase();
  if (!normalized) return null;

  if (
    ["节假日", "假日", "法定节假日", "holiday"].some((keyword) =>
      normalized.includes(keyword),
    )
  ) {
    return "HOLIDAY";
  }

  if (
    ["休息", "休息日", "rest day", "rest"].some((keyword) =>
      normalized.includes(keyword),
    )
  ) {
    return "REST_DAY";
  }

  return null;
}
