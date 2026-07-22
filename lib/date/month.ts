const defaultTimeZone = "Asia/Shanghai";
const monthPattern = /^\d{4}-\d{2}$/;

export function getCurrentMonth(date = new Date(), timeZone = defaultTimeZone) {
  return getCurrentDateKey(date, timeZone).slice(0, 7);
}

export function getCurrentDateKey(date = new Date(), timeZone = defaultTimeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("无法解析当前日期");
  }

  return `${year}-${month}-${day}`;
}

export function getCurrentMonthDate(day: number, date = new Date(), timeZone = defaultTimeZone) {
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
