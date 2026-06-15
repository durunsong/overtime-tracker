import { format } from "date-fns";

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

export function isMonthKey(value: string) {
  if (!MONTH_KEY_PATTERN.test(value)) {
    return false;
  }

  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

export function getCurrentMonthKey(now = new Date()) {
  return format(now, "yyyy-MM");
}

export function resolveMonthKey(month?: string | null, now = new Date()) {
  if (month && isMonthKey(month)) {
    return month;
  }

  return getCurrentMonthKey(now);
}
