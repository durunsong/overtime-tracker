import { parseExcelDate, toDateKey } from "@/lib/attendance/parser";
import { getCurrentMonthKey } from "@/lib/calendar/month";

const EMPTY_TOKENS = new Set([
  "",
  "-",
  "--",
  "—",
  "无",
  "null",
  "none",
  "undefined",
  "n/a",
  "na",
  "/",
]);

export function isEmptyAiToken(value: unknown) {
  if (value == null) {
    return true;
  }

  const text = String(value).trim().toLowerCase();
  return EMPTY_TOKENS.has(text);
}

export function normalizeOptionalAiText(value: unknown) {
  if (isEmptyAiToken(value)) {
    return null;
  }

  return String(value).trim();
}

export function normalizeAiDate(value: unknown, referenceDate = new Date()) {
  if (isEmptyAiToken(value)) {
    return null;
  }

  const text = String(value).trim();
  const fullChineseDate = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (fullChineseDate) {
    return formatDateParts(fullChineseDate[1], fullChineseDate[2], fullChineseDate[3]);
  }

  const shortChineseDate = text.match(/(?:^|\D)(\d{1,2})\s*月\s*(\d{1,2})\s*日(?:\D|$)/);
  if (shortChineseDate) {
    const year = referenceDate.getFullYear();
    return formatDateParts(String(year), shortChineseDate[1], shortChineseDate[2]);
  }

  const parsed = parseExcelDate(text);
  return parsed ? toDateKey(parsed) : null;
}

export function normalizeAiTime(value: unknown) {
  if (isEmptyAiToken(value)) {
    return null;
  }

  let text = String(value).trim();
  const wrapped = text.match(/(?:正常|迟到|早退|缺卡|补卡|外出)[(（]\s*(\d{1,2}\s*[:：]\s*\d{2}(?:\s*[:：]\s*\d{2})?)\s*[)）]/i);
  if (wrapped?.[1]) {
    text = wrapped[1];
  }

  const afternoon = /下午|pm/i.test(text);
  const morning = /上午|am/i.test(text);
  text = text
    .replace(/正常|迟到|早退|缺卡|补卡|外出/g, "")
    .replace(/[(（][^)）]*[)）]/g, "")
    .replace(/上午|下午|am|pm/gi, "")
    .trim();

  const match = text.match(/(\d{1,2})\s*[:：]\s*(\d{2})(?:\s*[:：]\s*(\d{2}))?/);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59 || seconds > 59) {
    return null;
  }

  if (afternoon && !morning && hours < 12) {
    hours += 12;
  }

  if (morning && !afternoon && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function normalizeAiStatusText(value: unknown, remark?: string | null) {
  const status = normalizeOptionalAiText(value);
  const note = normalizeOptionalAiText(remark);
  const merged = [status, note].filter(Boolean).join(" ");

  if (!merged) {
    return null;
  }

  if (/休息|rest/i.test(merged)) {
    return "休息";
  }

  if (/节假日|法定|holiday/i.test(merged)) {
    return "节假日";
  }

  return status ?? note;
}

export function inferReferenceMonthKey(records: Array<{ date?: unknown }>) {
  const monthCounts = new Map<string, number>();

  for (const record of records) {
    const month = normalizeAiDate(record.date)?.slice(0, 7);
    if (!month) {
      continue;
    }
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
  }

  if (monthCounts.size === 0) {
    return getCurrentMonthKey();
  }

  return [...monthCounts.entries()].sort((left, right) => right[1] - left[1])[0]![0];
}

function formatDateParts(year: string, month: string, day: string) {
  const parsed = parseExcelDate(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
  return parsed ? toDateKey(parsed) : null;
}
