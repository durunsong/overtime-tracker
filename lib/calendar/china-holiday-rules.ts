import type { ChinaCalendarMeta } from "@/types/calendar";

export type ChinaHolidayDefinition = Omit<ChinaCalendarMeta, "date">;

export type ChinaHolidayRuleSource = {
  year: number;
  officialNoticeUrl: string;
  providerName: string;
  providerApiUrl: string;
  updatedAt: string;
  note: string;
};

export const chinaHolidayRuleSources: Record<number, ChinaHolidayRuleSource> = {
  2026: {
    year: 2026,
    officialNoticeUrl: "https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm",
    providerName: "timor.tech",
    providerApiUrl: "https://timor.tech/api/holiday/year/2026/",
    updatedAt: "2026-05-28",
    note: "以国务院办公厅 2026 年节假日安排为准，开放 API 仅作为生成和复核数据来源。",
  },
};

export const chinaHolidayRulesByYear: Record<number, Record<string, ChinaHolidayDefinition>> = {
  2026: {
    "2026-01-01": { kind: "HOLIDAY", name: "元旦", lunarText: "冬月十三", wageRate: 3 },
    "2026-01-02": { kind: "HOLIDAY", name: "元旦假期", lunarText: "冬月十四", wageRate: 2 },
    "2026-01-03": { kind: "HOLIDAY", name: "元旦假期", lunarText: "冬月十五", wageRate: 2 },
    "2026-01-04": { kind: "ADJUSTED_WORKDAY", name: "元旦后补班", wageRate: 1 },
    "2026-02-14": { kind: "ADJUSTED_WORKDAY", name: "春节前补班", wageRate: 1 },
    "2026-02-15": { kind: "HOLIDAY", name: "春节假期", lunarText: "腊月廿八", wageRate: 2 },
    "2026-02-16": { kind: "HOLIDAY", name: "除夕", lunarText: "腊月廿九", wageRate: 3 },
    "2026-02-17": { kind: "HOLIDAY", name: "春节", lunarText: "正月初一", wageRate: 3 },
    "2026-02-18": { kind: "HOLIDAY", name: "春节假期", lunarText: "正月初二", wageRate: 3 },
    "2026-02-19": { kind: "HOLIDAY", name: "春节假期", lunarText: "正月初三", wageRate: 3 },
    "2026-02-20": { kind: "HOLIDAY", name: "春节假期", lunarText: "正月初四", wageRate: 2 },
    "2026-02-21": { kind: "HOLIDAY", name: "春节假期", lunarText: "正月初五", wageRate: 2 },
    "2026-02-22": { kind: "HOLIDAY", name: "春节假期", lunarText: "正月初六", wageRate: 2 },
    "2026-02-23": { kind: "HOLIDAY", name: "春节假期", lunarText: "正月初七", wageRate: 2 },
    "2026-02-28": { kind: "ADJUSTED_WORKDAY", name: "春节后补班", wageRate: 1 },
    "2026-04-04": { kind: "HOLIDAY", name: "清明假期", lunarText: "二月十七", wageRate: 2 },
    "2026-04-05": { kind: "HOLIDAY", name: "清明", lunarText: "二月十八", wageRate: 3 },
    "2026-04-06": { kind: "HOLIDAY", name: "清明假期", lunarText: "二月十九", wageRate: 2 },
    "2026-05-01": { kind: "HOLIDAY", name: "劳动节", lunarText: "三月十五", wageRate: 3 },
    "2026-05-02": { kind: "HOLIDAY", name: "劳动节假期", lunarText: "三月十六", wageRate: 3 },
    "2026-05-03": { kind: "HOLIDAY", name: "劳动节假期", lunarText: "三月十七", wageRate: 2 },
    "2026-05-04": { kind: "HOLIDAY", name: "青年节", lunarText: "三月十八", wageRate: 2 },
    "2026-05-05": { kind: "HOLIDAY", name: "劳动节假期", lunarText: "三月十九", wageRate: 2 },
    "2026-05-09": { kind: "ADJUSTED_WORKDAY", name: "劳动节后补班", wageRate: 1 },
    "2026-06-19": { kind: "HOLIDAY", name: "端午节", lunarText: "五月初五", wageRate: 3 },
    "2026-06-20": { kind: "HOLIDAY", name: "端午节假期", lunarText: "五月初六", wageRate: 2 },
    "2026-06-21": { kind: "HOLIDAY", name: "端午节假期", lunarText: "五月初七", wageRate: 2 },
    "2026-09-20": { kind: "ADJUSTED_WORKDAY", name: "中秋节前补班", wageRate: 1 },
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
    "2026-10-10": { kind: "ADJUSTED_WORKDAY", name: "国庆节后补班", wageRate: 1 },
  },
};

export function getChinaHolidayDefinition(dateKey: string): ChinaHolidayDefinition | null {
  const year = Number(dateKey.slice(0, 4));
  return chinaHolidayRulesByYear[year]?.[dateKey] ?? null;
}

export function getSupportedChinaHolidayYears() {
  return Object.keys(chinaHolidayRulesByYear)
    .map(Number)
    .sort((a, b) => a - b);
}
