import { addDays, isValid, parse } from "date-fns";
import {
  BUSINESS_TIME_ZONE,
  combineBusinessDateAndTime,
  formatDateKeyInTimeZone,
  startOfBusinessDay,
} from "@/lib/date/timezone";

const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30));

export function parseExcelDate(value: unknown): Date | null {
  if (value instanceof Date && isValid(value)) {
    return startOfBusinessDay(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return startOfBusinessDay(addDays(EXCEL_EPOCH, Math.floor(value)));
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\./g, "-").replace(/\//g, "-");
  if (!normalized) {
    return null;
  }

  const patterns = ["yyyy-MM-dd", "yyyy-M-d", "yyyyMMdd", "MM-dd-yyyy"];
  for (const pattern of patterns) {
    const parsed = parse(normalized, pattern, new Date());
    if (isValid(parsed)) {
      // date-fns parse is runtime-local; re-anchor to the calendar yyyy-MM-dd text when possible.
      const keyMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (keyMatch && pattern.startsWith("yyyy")) {
        const key = `${keyMatch[1]}-${keyMatch[2].padStart(2, "0")}-${keyMatch[3].padStart(2, "0")}`;
        return startOfBusinessDay(key);
      }
      return startOfBusinessDay(parsed);
    }
  }

  const loose = new Date(normalized);
  return isValid(loose) ? startOfBusinessDay(loose) : null;
}

export function parseTime(value: unknown, baseDate: Date): Date | null {
  if (value instanceof Date && isValid(value)) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const totalMinutes = Math.round((value % 1) * 24 * 60);
    return combineBusinessDateAndTime(
      baseDate,
      `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`,
    );
  }

  if (typeof value !== "string") {
    return null;
  }

  const raw = value.trim();
  if (!raw) {
    return null;
  }

  const timeMatch = raw.match(/(\d{1,2})[:：](\d{1,2})(?::(\d{1,2}))?/);
  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const seconds = Number(timeMatch[3] ?? 0);
    if (hours <= 23 && minutes <= 59 && seconds <= 59) {
      return combineBusinessDateAndTime(
        baseDate,
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
    }
  }

  const dateTime = new Date(raw.replace(/\./g, "-").replace(/\//g, "-"));
  return isValid(dateTime) ? dateTime : null;
}

export function toTimeOnDate(time: string, date: Date) {
  return (
    combineBusinessDateAndTime(date, time) ??
    // ponytail: invalid rule times should not crash calc; fall back to business midnight.
    startOfBusinessDay(date)
  );
}

export function toDateKey(date: Date | string | number) {
  return formatDateKeyInTimeZone(date, BUSINESS_TIME_ZONE);
}

export function resolveAttendancePunchTimes(input: {
  workDate: Date;
  checkInTime?: Date | null;
  checkOutTime?: Date | null;
  rawCheckInText?: string | null;
  rawCheckOutText?: string | null;
}) {
  return {
    checkInTime:
      (input.rawCheckInText?.trim()
        ? combineBusinessDateAndTime(input.workDate, normalizeClockText(input.rawCheckInText))
        : null) ?? input.checkInTime ?? null,
    checkOutTime:
      (input.rawCheckOutText?.trim()
        ? combineBusinessDateAndTime(input.workDate, normalizeClockText(input.rawCheckOutText))
        : null) ?? input.checkOutTime ?? null,
  };
}

function normalizeClockText(value: string) {
  const matched = value.trim().match(/(\d{1,2})[:：](\d{1,2})(?::(\d{1,2}))?/);
  if (!matched) {
    return value.trim();
  }
  const hours = Number(matched[1]);
  const minutes = Number(matched[2]);
  const seconds = Number(matched[3] ?? 0);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
