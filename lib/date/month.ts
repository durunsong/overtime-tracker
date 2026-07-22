import { BUSINESS_TIME_ZONE, formatDateKeyInTimeZone } from "@/lib/date/timezone";

const monthPattern = /^\d{4}-\d{2}$/;

export function getCurrentMonth(date = new Date(), timeZone = BUSINESS_TIME_ZONE) {
  return getCurrentDateKey(date, timeZone).slice(0, 7);
}

export function getCurrentDateKey(date = new Date(), timeZone = BUSINESS_TIME_ZONE) {
  return formatDateKeyInTimeZone(date, timeZone);
}

export function getCurrentMonthDate(day: number, date = new Date(), timeZone = BUSINESS_TIME_ZONE) {
  return `${getCurrentMonth(date, timeZone)}-${String(day).padStart(2, "0")}`;
}

export function isMonthValue(value: string | null | undefined): value is string {
  if (!value || !monthPattern.test(value)) {
    return false;
  }

  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

export function getMonthOrCurrent(value: string | null | undefined, date = new Date()) {
  return isMonthValue(value) ? value : getCurrentMonth(date);
}
