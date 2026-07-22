export const BUSINESS_TIME_ZONE = "Asia/Shanghai";
export const BUSINESS_UTC_OFFSET = "+08:00";

const dateKeyFormatterCache = new Map<string, Intl.DateTimeFormat>();
const clockFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateKeyFormatter(timeZone: string) {
  let formatter = dateKeyFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dateKeyFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

function getClockFormatter(timeZone: string) {
  let formatter = clockFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    clockFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

function readParts(date: Date, formatter: Intl.DateTimeFormat) {
  return formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
}

export function formatDateKeyInTimeZone(date: Date, timeZone = BUSINESS_TIME_ZONE) {
  const parts = readParts(date, getDateKeyFormatter(timeZone));
  if (!parts.year || !parts.month || !parts.day) {
    throw new Error("无法按业务时区解析日期");
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatClockInTimeZone(date: Date, timeZone = BUSINESS_TIME_ZONE) {
  const parts = readParts(date, getClockFormatter(timeZone));
  if (!parts.hour || !parts.minute) {
    throw new Error("无法按业务时区解析时间");
  }
  return `${parts.hour}:${parts.minute}`;
}

export function startOfBusinessDay(dateOrKey: Date | string, timeZone = BUSINESS_TIME_ZONE) {
  const dateKey =
    typeof dateOrKey === "string" ? dateOrKey : formatDateKeyInTimeZone(dateOrKey, timeZone);
  return new Date(`${dateKey}T00:00:00${BUSINESS_UTC_OFFSET}`);
}

export function combineBusinessDateAndTime(
  dateOrKey: Date | string,
  time: string,
  timeZone = BUSINESS_TIME_ZONE,
) {
  const matched = time.trim().match(/^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/);
  if (!matched) {
    return null;
  }

  const hours = Number(matched[1]);
  const minutes = Number(matched[2]);
  const seconds = Number(matched[3] ?? 0);
  if (hours > 23) {
    return null;
  }

  const dateKey =
    typeof dateOrKey === "string" ? dateOrKey : formatDateKeyInTimeZone(dateOrKey, timeZone);
  const clock = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return new Date(`${dateKey}T${clock}${BUSINESS_UTC_OFFSET}`);
}
