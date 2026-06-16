import { format } from "date-fns";
import { getPrisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/auth/session";
import { calculateDailyAttendance } from "@/lib/attendance/calculate";
import { mergeRecordsByWorkDate, normalizeWorkDate } from "@/lib/attendance/records";
import { toDateKey } from "@/lib/attendance/parser";
import { loadDefaultWorkRuleForUser } from "@/lib/data/work-rule-repository";
import { loadWorkDayOverrideMapForUser } from "@/lib/data/work-day-override-repository";
import type {
  AttendanceRecordView,
  AttendanceSource,
  AttendanceStatus,
  AttendanceInput,
  WorkRuleInput,
} from "@/types/attendance";
import type { WorkDayOverrideKind } from "@/lib/calendar/day-kind";

export { loadDefaultWorkRuleForUser } from "@/lib/data/work-rule-repository";

type DbAttendanceRecord = {
  id: string;
  userId: string;
  workDate: Date;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  rawCheckInText: string | null;
  rawCheckOutText: string | null;
  actualWorkMinutes: number;
  standardWorkMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: string;
  source: string;
  remark: string | null;
};

type CalculationBundle = {
  rule: WorkRuleInput;
  overrideMap: Map<string, WorkDayOverrideKind>;
};

export async function getDefaultUserId() {
  return requireCurrentUserId();
}

async function loadCalculationBundle(userId: string, month?: string): Promise<CalculationBundle> {
  const [rule, overrideMap] = await Promise.all([
    loadDefaultWorkRuleForUser(userId),
    loadWorkDayOverrideMapForUser(userId, month),
  ]);
  return { rule, overrideMap };
}

export async function loadAttendanceRecords(month?: string) {
  const prisma = getPrisma();
  const userId = await requireCurrentUserId();
  const [{ rule, overrideMap }, records] = await Promise.all([
    loadCalculationBundle(userId, month),
    prisma.attendanceRecord.findMany({
      where: { userId },
      orderBy: { workDate: "asc" },
    }),
  ]);

  const views = mergeRecordsByWorkDate(records.map(recordToView)).map((record) =>
    recalculateLoadedRecord(record, rule, overrideMap),
  );
  return month ? views.filter((record) => format(record.workDate, "yyyy-MM") === month) : views;
}

export async function createAttendanceRecord(input: AttendanceInput) {
  const userId = await requireCurrentUserId();
  const normalizedInput = normalizeAttendanceInput(input);
  const { rule, overrideMap } = await loadCalculationBundle(userId);
  const calculation = calculateDailyAttendance(
    normalizedInput,
    rule,
    buildDailyOptions(normalizedInput.workDate, overrideMap),
  );
  const prisma = getPrisma();
  const record = await prisma.attendanceRecord.create({
    data: {
      userId,
      workDate: normalizedInput.workDate,
      checkInTime: normalizedInput.checkInTime,
      checkOutTime: normalizedInput.checkOutTime,
      rawCheckInText: normalizedInput.rawCheckInText,
      rawCheckOutText: normalizedInput.rawCheckOutText,
      actualWorkMinutes: calculation.actualWorkMinutes,
      standardWorkMinutes: calculation.standardWorkMinutes,
      overtimeMinutes: calculation.overtimeMinutes,
      lateMinutes: calculation.lateMinutes,
      earlyLeaveMinutes: calculation.earlyLeaveMinutes,
      status: calculation.status,
      source: "MANUAL",
      remark: normalizedInput.remark,
    },
  });
  return recordToView(record);
}

export async function upsertAttendanceRecordByDate(input: AttendanceInput) {
  const userId = await requireCurrentUserId();
  const normalizedInput = normalizeAttendanceInput(input);
  const { rule, overrideMap } = await loadCalculationBundle(userId);
  const calculation = calculateDailyAttendance(
    normalizedInput,
    rule,
    buildDailyOptions(normalizedInput.workDate, overrideMap),
  );
  const prisma = getPrisma();
  const record = await prisma.attendanceRecord.upsert({
    where: { userId_workDate: { userId, workDate: normalizedInput.workDate } },
    update: {
      checkInTime: normalizedInput.checkInTime,
      checkOutTime: normalizedInput.checkOutTime,
      rawCheckInText: normalizedInput.rawCheckInText,
      rawCheckOutText: normalizedInput.rawCheckOutText,
      actualWorkMinutes: calculation.actualWorkMinutes,
      standardWorkMinutes: calculation.standardWorkMinutes,
      overtimeMinutes: calculation.overtimeMinutes,
      lateMinutes: calculation.lateMinutes,
      earlyLeaveMinutes: calculation.earlyLeaveMinutes,
      status: calculation.status,
      remark: normalizedInput.remark,
    },
    create: {
      userId,
      workDate: normalizedInput.workDate,
      checkInTime: normalizedInput.checkInTime,
      checkOutTime: normalizedInput.checkOutTime,
      rawCheckInText: normalizedInput.rawCheckInText,
      rawCheckOutText: normalizedInput.rawCheckOutText,
      actualWorkMinutes: calculation.actualWorkMinutes,
      standardWorkMinutes: calculation.standardWorkMinutes,
      overtimeMinutes: calculation.overtimeMinutes,
      lateMinutes: calculation.lateMinutes,
      earlyLeaveMinutes: calculation.earlyLeaveMinutes,
      status: calculation.status,
      source: "MANUAL",
      remark: normalizedInput.remark,
    },
  });

  return recordToView(record);
}

export async function updateAttendanceRecord(id: string, input: AttendanceInput) {
  const prisma = getPrisma();
  const userId = await requireCurrentUserId();
  const normalizedInput = normalizeAttendanceInput(input);
  const { rule, overrideMap } = await loadCalculationBundle(userId);
  const calculation = calculateDailyAttendance(
    normalizedInput,
    rule,
    buildDailyOptions(normalizedInput.workDate, overrideMap),
  );
  const record = await prisma.attendanceRecord.update({
    where: { id, userId },
    data: {
      workDate: normalizedInput.workDate,
      checkInTime: normalizedInput.checkInTime,
      checkOutTime: normalizedInput.checkOutTime,
      rawCheckInText: normalizedInput.rawCheckInText,
      rawCheckOutText: normalizedInput.rawCheckOutText,
      actualWorkMinutes: calculation.actualWorkMinutes,
      standardWorkMinutes: calculation.standardWorkMinutes,
      overtimeMinutes: calculation.overtimeMinutes,
      lateMinutes: calculation.lateMinutes,
      earlyLeaveMinutes: calculation.earlyLeaveMinutes,
      status: calculation.status,
      remark: normalizedInput.remark,
    },
  });
  return recordToView(record);
}

export async function deleteAttendanceRecord(id: string) {
  const prisma = getPrisma();
  const userId = await requireCurrentUserId();
  await prisma.attendanceRecord.delete({ where: { id, userId } });
}

function recordToView(record: DbAttendanceRecord): AttendanceRecordView {
  return {
    id: record.id,
    userId: record.userId,
    workDate: record.workDate,
    checkInTime: record.checkInTime,
    checkOutTime: record.checkOutTime,
    rawCheckInText: record.rawCheckInText,
    rawCheckOutText: record.rawCheckOutText,
    actualWorkMinutes: record.actualWorkMinutes,
    standardWorkMinutes: record.standardWorkMinutes,
    overtimeMinutes: record.overtimeMinutes,
    lateMinutes: record.lateMinutes,
    earlyLeaveMinutes: record.earlyLeaveMinutes,
    status: record.status as AttendanceStatus,
    source: record.source as AttendanceSource,
    remark: record.remark,
    issues: [],
  };
}

function normalizeAttendanceInput(input: AttendanceInput): AttendanceInput {
  return {
    ...input,
    workDate: normalizeWorkDate(input.workDate),
  };
}

function buildDailyOptions(workDate: Date, overrideMap: Map<string, WorkDayOverrideKind>) {
  return {
    dayKindOverride: overrideMap.get(toDateKey(workDate)) ?? null,
  };
}

function recalculateLoadedRecord(
  record: AttendanceRecordView,
  rule: WorkRuleInput,
  overrideMap: Map<string, WorkDayOverrideKind>,
): AttendanceRecordView {
  if (!record.checkInTime || !record.checkOutTime) {
    return record;
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
    buildDailyOptions(record.workDate, overrideMap),
  );

  return {
    ...record,
    ...calculation,
    issues: calculation.issues,
  };
}
