import { calculateDailyAttendance } from "@/lib/attendance/calculate";
import { applyCurrentWorkRuleDefaults, toWorkRuleInput } from "@/lib/attendance/work-rule";
import { toDateKey } from "@/lib/attendance/parser";
import { getPrisma } from "@/lib/prisma";
import { loadWorkDayOverrideMapForUser } from "@/lib/data/work-day-override-repository";
import type { WorkDayOverrideKind } from "@/lib/calendar/day-kind";
import { defaultWorkRule, type WorkRuleInput } from "@/types/attendance";

type DbWorkRule = {
  name: string;
  startTime: string;
  endTime: string;
  standardWorkMinutes: number;
  overtimeStartTime: string;
  beforeStartNotCount: boolean;
  lunchBreakStartTime?: string | null;
  lunchBreakEnabled: boolean;
  lunchBreakMinutes: number;
  weekendEnabled: boolean;
  holidayEnabled: boolean;
  isDefault?: boolean;
};

export async function loadDefaultWorkRuleForUser(userId: string): Promise<WorkRuleInput> {
  const prisma = getPrisma();
  const rule = await prisma.workRule.findFirst({
    where: { userId, isDefault: true },
    orderBy: { updatedAt: "desc" },
  });

  return rule ? applyCurrentWorkRuleDefaults(toWorkRuleInput(rule)) : defaultWorkRule;
}

export async function ensureDefaultWorkRuleForUser(userId: string): Promise<WorkRuleInput> {
  const prisma = getPrisma();
  const existingRule = await prisma.workRule.findFirst({
    where: { userId, isDefault: true },
    orderBy: { updatedAt: "desc" },
  });

  if (existingRule) {
    return applyCurrentWorkRuleDefaults(toWorkRuleInput(existingRule));
  }

  const rule = await prisma.workRule.create({
    data: {
      ...defaultWorkRule,
      userId,
      isDefault: true,
    },
  });

  return applyCurrentWorkRuleDefaults(toWorkRuleInput(rule));
}

export async function saveDefaultWorkRuleForUser(
  userId: string,
  input: WorkRuleInput,
): Promise<WorkRuleInput> {
  const prisma = getPrisma();

  await prisma.workRule.updateMany({
    where: { userId },
    data: { isDefault: false },
  });

  const rule = await prisma.workRule.create({
    data: {
      ...input,
      userId,
      isDefault: true,
    },
  });

  const normalizedRule = applyCurrentWorkRuleDefaults(toWorkRuleInput(rule));
  const overrideMap = await loadWorkDayOverrideMapForUser(userId);
  await recalculateAllAttendanceForUser(userId, normalizedRule, overrideMap);

  return normalizedRule;
}

export async function recalculateAllAttendanceForUser(
  userId: string,
  rule: WorkRuleInput,
  overrideMap: Map<string, WorkDayOverrideKind> = new Map(),
): Promise<number> {
  const prisma = getPrisma();
  const records = await prisma.attendanceRecord.findMany({
    where: { userId },
    select: {
      id: true,
      workDate: true,
      checkInTime: true,
      checkOutTime: true,
      rawCheckInText: true,
      rawCheckOutText: true,
      remark: true,
      status: true,
    },
  });

  let updatedCount = 0;

  for (const record of records) {
    if (!record.checkInTime || !record.checkOutTime) {
      continue;
    }

    const calculation = calculateDailyAttendance(
      {
        workDate: record.workDate,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        rawCheckInText: record.rawCheckInText,
        rawCheckOutText: record.rawCheckOutText,
        remark: record.remark,
      },
      rule,
      { dayKindOverride: overrideMap.get(toDateKey(record.workDate)) ?? null },
    );

    await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        actualWorkMinutes: calculation.actualWorkMinutes,
        standardWorkMinutes: calculation.standardWorkMinutes,
        overtimeMinutes: calculation.overtimeMinutes,
        lateMinutes: calculation.lateMinutes,
        earlyLeaveMinutes: calculation.earlyLeaveMinutes,
        status: calculation.status,
      },
    });
    updatedCount += 1;
  }

  return updatedCount;
}

export function mapDbWorkRule(rule: DbWorkRule): WorkRuleInput {
  return applyCurrentWorkRuleDefaults(toWorkRuleInput(rule));
}
