import { endOfMonth, startOfMonth } from "date-fns";
import { getPrisma } from "@/lib/prisma";
import { normalizeWorkDate } from "@/lib/attendance/records";
import { toDateKey } from "@/lib/attendance/parser";
import type { WorkDayOverrideInput } from "@/types/attendance";
import type { WorkDayOverrideKind } from "@/lib/calendar/day-kind";

export type WorkDayOverrideView = WorkDayOverrideInput & {
  id: string;
};

export async function loadWorkDayOverrideMapForUser(
  userId: string,
  month?: string,
): Promise<Map<string, WorkDayOverrideKind>> {
  const prisma = getPrisma();
  const where = month
    ? {
        userId,
        workDate: {
          gte: startOfMonth(parseMonth(month)),
          lte: endOfMonth(parseMonth(month)),
        },
      }
    : { userId };

  const overrides = await prisma.workDayOverride.findMany({
    where,
    orderBy: { workDate: "asc" },
  });

  return new Map(
    overrides.map((item) => [toDateKey(item.workDate), item.kind as WorkDayOverrideKind]),
  );
}

export async function listWorkDayOverrides(userId: string, month: string) {
  const prisma = getPrisma();
  const overrides = await prisma.workDayOverride.findMany({
    where: {
      userId,
      workDate: {
        gte: startOfMonth(parseMonth(month)),
        lte: endOfMonth(parseMonth(month)),
      },
    },
    orderBy: { workDate: "asc" },
  });

  return overrides.map((item) => ({
    id: item.id,
    workDate: item.workDate,
    kind: item.kind as WorkDayOverrideKind,
    remark: item.remark,
  }));
}

export async function upsertWorkDayOverride(userId: string, input: WorkDayOverrideInput) {
  const prisma = getPrisma();
  const workDate = normalizeWorkDate(input.workDate);
  const record = await prisma.workDayOverride.upsert({
    where: { userId_workDate: { userId, workDate } },
    update: {
      kind: input.kind,
      remark: input.remark ?? null,
    },
    create: {
      userId,
      workDate,
      kind: input.kind,
      remark: input.remark ?? null,
    },
  });

  return {
    id: record.id,
    workDate: record.workDate,
    kind: record.kind as WorkDayOverrideKind,
    remark: record.remark,
  };
}

export async function clearWorkDayOverride(userId: string, date: string) {
  const prisma = getPrisma();
  await prisma.workDayOverride.deleteMany({
    where: {
      userId,
      workDate: normalizeWorkDate(new Date(`${date}T00:00:00`)),
    },
  });
}

function parseMonth(month: string) {
  return new Date(`${month}-01T00:00:00`);
}
