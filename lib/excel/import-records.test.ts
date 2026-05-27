import { describe, expect, it } from "vitest";
import { defaultWorkRule } from "@/types/attendance";
import { parseTime } from "@/lib/attendance/parser";
import { normalizeImportedRecord } from "./import-records";

describe("normalizeImportedRecord", () => {
  it("recalculates imported work records on the server side", () => {
    const workDate = new Date("2026-05-04T00:00:00");
    const record = normalizeImportedRecord(
      {
        workDate,
        checkInTime: parseTime("09:30", workDate),
        checkOutTime: parseTime("20:30", workDate),
        rawCheckInText: "09:30",
        rawCheckOutText: "20:30",
        actualWorkMinutes: 0,
        standardWorkMinutes: 0,
        overtimeMinutes: 999,
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        status: "NORMAL",
        remark: null,
      },
      {
        ...defaultWorkRule,
        overtimeStartTime: "20:00",
      },
    );

    expect(record.overtimeMinutes).toBe(30);
    expect(record.actualWorkMinutes).toBe(660);
    expect(record.status).toBe("NORMAL");
  });

  it("keeps rest day and holiday rows importable without punches", () => {
    const workDate = new Date("2026-05-01T00:00:00");
    const record = normalizeImportedRecord(
      {
        workDate,
        checkInTime: null,
        checkOutTime: null,
        rawCheckInText: null,
        rawCheckOutText: null,
        actualWorkMinutes: 999,
        standardWorkMinutes: 999,
        overtimeMinutes: 999,
        lateMinutes: 999,
        earlyLeaveMinutes: 999,
        status: "REST_DAY",
        remark: "劳动节",
      },
      defaultWorkRule,
    );

    expect(record.status).toBe("REST_DAY");
    expect(record.actualWorkMinutes).toBe(0);
    expect(record.overtimeMinutes).toBe(0);
    expect(record.standardWorkMinutes).toBe(0);
  });
});
