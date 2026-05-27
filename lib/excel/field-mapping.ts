import type { ImportFieldKey, ImportFieldMapping } from "@/types/import";

const aliases: Record<ImportFieldKey, string[]> = {
  date: ["日期", "打卡日期", "考勤日期", "workDate", "date"],
  name: ["姓名", "员工姓名", "人员", "name", "employee"],
  checkIn: ["上班时间", "上班打卡", "签到时间", "checkIn", "check in"],
  checkOut: ["下班时间", "下班打卡", "签退时间", "checkOut", "check out"],
  actualWork: ["实际出勤时长", "实际工时", "出勤时长", "workMinutes"],
  status: ["考勤状态", "状态", "status"],
  remark: ["备注", "说明", "remark", "note"],
};

export function detectFieldMapping(headers: string[]): ImportFieldMapping {
  return Object.entries(aliases).reduce<ImportFieldMapping>((mapping, [field, names]) => {
    const hit = headers.find((header) =>
      names.some((alias) => header.trim().toLowerCase() === alias.toLowerCase()),
    );
    if (hit) {
      mapping[field as ImportFieldKey] = hit;
    }
    return mapping;
  }, {});
}
