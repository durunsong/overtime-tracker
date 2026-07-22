import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { AttendanceRecordView } from "@/types/attendance";
import type { CalendarMonth, ChinaCalendarMeta } from "@/types/calendar";
import type { WorkDayOverrideKind } from "@/lib/calendar/day-kind";
import { toDateKey } from "@/lib/attendance/parser";
import { getChinaHolidayDefinition } from "@/lib/calendar/china-holiday-rules";
import { formatChineseLunarDate } from "@/lib/calendar/lunar";
import { getCurrentDateKey } from "@/lib/date/month";
import { startOfBusinessDay } from "@/lib/date/timezone";

function weekdayOfDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function getChinaCalendarMeta(date: Date): ChinaCalendarMeta {
  const key = toDateKey(date);
  const lunarText = formatChineseLunarDate(startOfBusinessDay(key));
  const holiday = getChinaHolidayDefinition(key);
  if (holiday) {
    return { date: key, ...holiday, lunarText: holiday.lunarText ?? lunarText };
  }

  const weekday = weekdayOfDateKey(key);
  return {
    date: key,
    kind: weekday === 0 || weekday === 6 ? "WEEKEND" : "WORKDAY",
    lunarText,
    wageRate: 1,
  };
}

export function buildCalendarMonth(
  month: string,
  records: AttendanceRecordView[],
  overrideMap: Map<string, WorkDayOverrideKind> = new Map(),
): CalendarMonth {
  const monthRecords = records.filter((record) => toDateKey(record.workDate).startsWith(month));
  // Anchor the month grid on a UTC noon so date-fns month boundaries follow the civil yyyy-MM.
  const monthDate = parse(`${month}-01 12:00:00`, "yyyy-MM-dd HH:mm:ss", new Date(Date.UTC(2026, 0, 1)));
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const recordMap = new Map(monthRecords.map((record) => [toDateKey(record.workDate), record]));
  const todayKey = getCurrentDateKey();

  return {
    month,
    monthlyOvertimeMinutes: monthRecords.reduce(
      (sum, record) => sum + record.overtimeMinutes,
      0,
    ),
    days: eachDayOfInterval({ start, end }).map((date) => {
      const key = toDateKey(date);
      const meta = getChinaCalendarMeta(date);
      return {
        ...meta,
        dayOfMonth: Number(key.slice(8, 10)),
        weekday: weekdayOfDateKey(key),
        isCurrentMonth: key.startsWith(month),
        isToday: key === todayKey,
        record: recordMap.get(key) ?? null,
        personalOverrideKind: overrideMap.get(key) ?? null,
      };
    }),
  };
}
