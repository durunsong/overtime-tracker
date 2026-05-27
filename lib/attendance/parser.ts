import { addDays, format, isValid, parse, startOfDay } from "date-fns";

const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30));

export function parseExcelDate(value: unknown): Date | null {
  if (value instanceof Date && isValid(value)) {
    return startOfDay(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return startOfDay(addDays(EXCEL_EPOCH, Math.floor(value)));
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
      return startOfDay(parsed);
    }
  }

  const loose = new Date(normalized);
  return isValid(loose) ? startOfDay(loose) : null;
}

export function parseTime(value: unknown, baseDate: Date): Date | null {
  if (value instanceof Date && isValid(value)) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const totalMinutes = Math.round((value % 1) * 24 * 60);
    const parsed = new Date(baseDate);
    parsed.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
    return parsed;
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
      const parsed = new Date(baseDate);
      parsed.setHours(hours, minutes, seconds, 0);
      return parsed;
    }
  }

  const dateTime = new Date(raw.replace(/\./g, "-").replace(/\//g, "-"));
  return isValid(dateTime) ? dateTime : null;
}

export function toTimeOnDate(time: string, date: Date) {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

export function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}
