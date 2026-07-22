import { formatDateKeyInTimeZone, startOfBusinessDay } from "@/lib/date/timezone";
import { resolveAttendancePunchTimes } from "@/lib/attendance/parser";
import type { AttendanceRecordView } from "@/types/attendance";

export function normalizeWorkDate(date: Date) {
  return startOfBusinessDay(date);
}

export function mergeRecordsByWorkDate<T extends AttendanceRecordView>(records: T[]): T[] {
  const recordsByDate = new Map<string, T>();

  for (const record of records) {
    const workDate = normalizeWorkDate(record.workDate);
    const punchTimes = resolveAttendancePunchTimes({
      workDate,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
      rawCheckInText: record.rawCheckInText,
      rawCheckOutText: record.rawCheckOutText,
    });
    const normalizedRecord = {
      ...record,
      workDate,
      checkInTime: punchTimes.checkInTime,
      checkOutTime: punchTimes.checkOutTime,
    };
    const dateKey = formatDateKeyInTimeZone(normalizedRecord.workDate);
    const existing = recordsByDate.get(dateKey);
    recordsByDate.set(
      dateKey,
      existing ? choosePreferredRecord(existing, normalizedRecord) : normalizedRecord,
    );
  }

  return [...recordsByDate.values()].sort(
    (left, right) => left.workDate.getTime() - right.workDate.getTime(),
  );
}

function choosePreferredRecord<T extends AttendanceRecordView>(left: T, right: T) {
  const leftScore = getRecordCompletenessScore(left);
  const rightScore = getRecordCompletenessScore(right);

  if (rightScore !== leftScore) {
    return rightScore > leftScore ? right : left;
  }

  if (right.overtimeMinutes !== left.overtimeMinutes) {
    return right.overtimeMinutes > left.overtimeMinutes ? right : left;
  }

  const leftCheckOut = left.checkOutTime?.getTime() ?? 0;
  const rightCheckOut = right.checkOutTime?.getTime() ?? 0;
  if (rightCheckOut !== leftCheckOut) {
    return rightCheckOut > leftCheckOut ? right : left;
  }

  return right;
}

function getRecordCompletenessScore(record: AttendanceRecordView) {
  const statusScore = ["ABSENT", "ABNORMAL"].includes(record.status) ? 0 : 4;
  return (
    statusScore +
    (record.checkInTime ? 1 : 0) +
    (record.checkOutTime ? 1 : 0) +
    (record.actualWorkMinutes > 0 ? 1 : 0)
  );
}
