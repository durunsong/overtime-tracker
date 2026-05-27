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

type HolidayDefinition = Omit<ChinaCalendarMeta, "date">;

const china2026Holidays: Record<string, HolidayDefinition> = {
  "2026-01-01": { kind: "HOLIDAY", name: "元旦", lunarText: "冬月十三", wageRate: 3 },
  "2026-01-02": { kind: "HOLIDAY", name: "元旦假期", lunarText: "冬月十四", wageRate: 2 },
  "2026-01-03": { kind: "HOLIDAY", name: "元旦假期", lunarText: "冬月十五", wageRate: 2 },
  "2026-02-15": { kind: "HOLIDAY", name: "春节假期", lunarText: "腊月廿八", wageRate: 2 },
  "2026-02-16": { kind: "HOLIDAY", name: "除夕", lunarText: "腊月廿九", wageRate: 3 },
  "2026-02-17": { kind: "HOLIDAY", name: "春节", lunarText: "正月初一", wageRate: 3 },
  "2026-02-18": { kind: "HOLIDAY", name: "春节假期", lunarText: "正月初二", wageRate: 3 },
  "2026-02-19": { kind: "HOLIDAY", name: "春节假期", lunarText: "正月初三", wageRate: 3 },
  "2026-02-20": { kind: "HOLIDAY", name: "春节假期", lunarText: "正月初四", wageRate: 2 },
  "2026-02-21": { kind: "HOLIDAY", name: "春节假期", lunarText: "正月初五", wageRate: 2 },
  "2026-02-22": { kind: "HOLIDAY", name: "春节假期", lunarText: "正月初六", wageRate: 2 },
  "2026-02-23": { kind: "HOLIDAY", name: "春节假期", lunarText: "正月初七", wageRate: 2 },
  "2026-04-04": { kind: "HOLIDAY", name: "清明假期", lunarText: "二月十七", wageRate: 2 },
  "2026-04-05": { kind: "HOLIDAY", name: "清明", lunarText: "二月十八", wageRate: 3 },
  "2026-04-06": { kind: "HOLIDAY", name: "清明假期", lunarText: "二月十九", wageRate: 2 },
  "2026-05-01": { kind: "HOLIDAY", name: "劳动节", lunarText: "三月十五", wageRate: 3 },
  "2026-05-02": { kind: "HOLIDAY", name: "劳动节假期", lunarText: "三月十六", wageRate: 3 },
  "2026-05-03": { kind: "HOLIDAY", name: "劳动节假期", lunarText: "三月十七", wageRate: 2 },
  "2026-05-04": { kind: "HOLIDAY", name: "青年节", lunarText: "三月十八", wageRate: 2 },
  "2026-05-05": { kind: "HOLIDAY", name: "劳动节假期", lunarText: "三月十九", wageRate: 2 },
  "2026-06-19": { kind: "HOLIDAY", name: "端午节", lunarText: "五月初五", wageRate: 3 },
  "2026-06-20": { kind: "HOLIDAY", name: "端午节假期", lunarText: "五月初六", wageRate: 2 },
  "2026-06-21": { kind: "HOLIDAY", name: "端午节假期", lunarText: "五月初七", wageRate: 2 },
  "2026-09-25": { kind: "HOLIDAY", name: "中秋节", lunarText: "八月十五", wageRate: 3 },
  "2026-09-26": { kind: "HOLIDAY", name: "中秋节假期", lunarText: "八月十六", wageRate: 2 },
  "2026-09-27": { kind: "HOLIDAY", name: "中秋节假期", lunarText: "八月十七", wageRate: 2 },
  "2026-10-01": { kind: "HOLIDAY", name: "国庆节", lunarText: "八月廿一", wageRate: 3 },
  "2026-10-02": { kind: "HOLIDAY", name: "国庆节假期", lunarText: "八月廿二", wageRate: 3 },
  "2026-10-03": { kind: "HOLIDAY", name: "国庆节假期", lunarText: "八月廿三", wageRate: 3 },
  "2026-10-04": { kind: "HOLIDAY", name: "国庆节假期", lunarText: "八月廿四", wageRate: 2 },
  "2026-10-05": { kind: "HOLIDAY", name: "国庆节假期", lunarText: "八月廿五", wageRate: 2 },
  "2026-10-06": { kind: "HOLIDAY", name: "国庆节假期", lunarText: "八月廿六", wageRate: 2 },
  "2026-10-07": { kind: "HOLIDAY", name: "国庆节假期", lunarText: "八月廿七", wageRate: 2 },
};

export function getChinaCalendarMeta(date: Date): ChinaCalendarMeta {
  const key = toDateKey(date);
  const holiday = china2026Holidays[key];
  if (holiday) {
    return { date: key, ...holiday };
  }

  const weekday = getDay(date);
  return {
    date: key,
    kind: weekday === 0 || weekday === 6 ? "WEEKEND" : "WORKDAY",
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
