import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { AttendanceRecordView } from "@/types/attendance";
import type { CalendarMonth, ChinaCalendarMeta } from "@/types/calendar";
import { toDateKey } from "@/lib/attendance/parser";
import { getChinaHolidayDefinition } from "@/lib/calendar/china-holiday-rules";
import { formatChineseLunarDate } from "@/lib/calendar/lunar";

export function getChinaCalendarMeta(date: Date): ChinaCalendarMeta {
  const key = toDateKey(date);
  const lunarText = formatChineseLunarDate(date);
  const holiday = getChinaHolidayDefinition(key);
  if (holiday) {
    return { date: key, ...holiday, lunarText: holiday.lunarText ?? lunarText };
  }

  const weekday = getDay(date);
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
): CalendarMonth {
  const monthRecords = records.filter((record) => format(record.workDate, "yyyy-MM") === month);
  const monthDate = parse(`${month}-01`, "yyyy-MM-dd", new Date());
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const recordMap = new Map(monthRecords.map((record) => [toDateKey(record.workDate), record]));

  return {
    month,
    monthlyOvertimeMinutes: monthRecords.reduce(
      (sum, record) => sum + record.overtimeMinutes,
      0,
    ),
    days: eachDayOfInterval({ start, end }).map((date) => {
      const key = format(date, "yyyy-MM-dd");
      return {
        ...getChinaCalendarMeta(date),
        dayOfMonth: date.getDate(),
        weekday: getDay(date),
        isCurrentMonth: isSameMonth(date, monthDate),
        isToday: isToday(date),
        record: recordMap.get(key) ?? null,
      };
    }),
  };
}
