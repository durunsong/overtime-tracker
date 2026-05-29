import { format } from "date-fns";
import { getPrisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/auth/session";
import { calculateDailyAttendance } from "@/lib/attendance/calculate";
import { mergeRecordsByWorkDate, normalizeWorkDate } from "@/lib/attendance/records";
import { defaultWorkRule, type WorkRuleInput } from "@/types/attendance";
import type {
  AttendanceRecordView,
  AttendanceSource,
  AttendanceStatus,
  AttendanceInput,
} from "@/types/attendance";

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

export async function getDefaultUserId() {
  return requireCurrentUserId();
}

export async function loadDefaultWorkRuleForUser(userId: string): Promise<WorkRuleInput> {
  const prisma = getPrisma();
  const rule = await prisma.workRule.findFirst({
    where: { userId, isDefault: true },
    orderBy: { updatedAt: "desc" },
  });

  return rule ?? defaultWorkRule;
}

export async function loadAttendanceRecords(month?: string) {
  const prisma = getPrisma();
  const userId = await requireCurrentUserId();
  const records = await prisma.attendanceRecord.findMany({
    where: { userId },
    orderBy: { workDate: "asc" },
  });
  const views = mergeRecordsByWorkDate(records.map(recordToView));
  return month ? views.filter((record) => format(record.workDate, "yyyy-MM") === month) : views;
}

export async function createAttendanceRecord(input: AttendanceInput) {
  const userId = await requireCurrentUserId();
  const normalizedInput = normalizeAttendanceInput(input);
  const calculation = calculateDailyAttendance(normalizedInput, await loadDefaultWorkRuleForUser(userId));
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
  const calculation = calculateDailyAttendance(normalizedInput, await loadDefaultWorkRuleForUser(userId));
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
  const calculation = calculateDailyAttendance(normalizedInput, await loadDefaultWorkRuleForUser(userId));
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
