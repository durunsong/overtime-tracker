import { requireCurrentUserId } from "@/lib/auth/session";
import { generateMonthlyReport } from "@/lib/reports/monthly";
import { loadAttendanceRecords } from "@/lib/data/attendance-repository";
import { loadDefaultWorkRuleForUser } from "@/lib/data/work-rule-repository";
import { loadWorkDayOverrideMapForUser } from "@/lib/data/work-day-override-repository";
import type { WorkRuleInput } from "@/types/attendance";
import type { AttendanceRecordView } from "@/types/attendance";
import type { MonthlyReportView } from "@/types/report";
import type { WorkDayOverrideKind } from "@/lib/calendar/day-kind";

export type AttendanceContext = {
  userId: string;
  records: AttendanceRecordView[];
  rule: WorkRuleInput;
  overrideMap: Map<string, WorkDayOverrideKind>;
};

export type MonthlyReportContext = AttendanceContext & {
  report: MonthlyReportView;
};

export async function loadAttendanceContext(month?: string): Promise<AttendanceContext> {
  const userId = await requireCurrentUserId();
  const [records, rule, overrideMap] = await Promise.all([
    loadAttendanceRecords(month),
    loadDefaultWorkRuleForUser(userId),
    loadWorkDayOverrideMapForUser(userId, month),
  ]);

  return { userId, records, rule, overrideMap };
}

export async function loadMonthlyReportContext(month: string): Promise<MonthlyReportContext> {
  const context = await loadAttendanceContext(month);
  return {
    ...context,
    report: generateMonthlyReport(context.records, month, context.rule, context.overrideMap),
  };
}

export async function loadMonthlyReportForMonth(month: string) {
  const { report } = await loadMonthlyReportContext(month);
  return report;
}
