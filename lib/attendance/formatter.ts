import { formatClockInTimeZone } from "@/lib/date/timezone";

export function formatMinutes(minutes: number) {
  const normalized = Math.max(0, Math.round(minutes));
  const hours = Math.floor(normalized / 60);
  const rest = normalized % 60;

  if (hours === 0) {
    return `${rest}分钟`;
  }

  if (rest === 0) {
    return `${hours}小时`;
  }

  return `${hours}小时${rest}分钟`;
}

export function minutesToDecimalHours(minutes: number) {
  return Number((Math.max(0, minutes) / 60).toFixed(2));
}

export function formatPunchTimeRange(input: {
  checkInTime?: Date | string | null;
  checkOutTime?: Date | string | null;
  rawCheckInText?: string | null;
  rawCheckOutText?: string | null;
}) {
  // Prefer stored wall-clock text; Date fallback always uses Asia/Shanghai.
  const checkIn = input.rawCheckInText?.trim() || (input.checkInTime ? formatClockInTimeZone(input.checkInTime) : "");
  const checkOut =
    input.rawCheckOutText?.trim() || (input.checkOutTime ? formatClockInTimeZone(input.checkOutTime) : "");

  if (!checkIn || !checkOut) {
    return undefined;
  }

  return `${checkIn}-${checkOut}`;
}
