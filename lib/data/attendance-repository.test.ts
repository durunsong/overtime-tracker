import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultWorkRule } from "@/types/attendance";
import { parseTime, toDateKey } from "@/lib/attendance/parser";

const prismaMock = vi.hoisted(() => ({
  workRule: {
    findFirst: vi.fn(),
  },
  attendanceRecord: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => prismaMock,
}));

vi.mock("@/lib/auth/session", () => ({
  requireCurrentUserId: vi.fn(async () => "user-1"),
}));

describe("attendance repository", () => {
  beforeEach(() => {
    prismaMock.workRule.findFirst.mockReset();
    prismaMock.attendanceRecord.create.mockReset();
    prismaMock.attendanceRecord.findMany.mockReset();
  });

  it("uses the current default work rule when creating manual records", async () => {
    const { createAttendanceRecord } = await import("./attendance-repository");
    const workDate = new Date("2026-05-04T00:00:00");

    prismaMock.workRule.findFirst.mockResolvedValue({
      ...defaultWorkRule,
      overtimeStartTime: "20:00",
    });
    prismaMock.attendanceRecord.create.mockImplementation(async ({ data }) => ({
      id: "record-1",
      ...data,
    }));

    await createAttendanceRecord({
      workDate,
      checkInTime: parseTime("09:30", workDate),
      checkOutTime: parseTime("20:30", workDate),
    });

    expect(prismaMock.attendanceRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          overtimeMinutes: 30,
        }),
      }),
    );
  });

  it("merges legacy records that have the same calendar date but different DateTime values", async () => {
    const { loadAttendanceRecords } = await import("./attendance-repository");

    prismaMock.attendanceRecord.findMany.mockResolvedValue([
      buildDbRecord({
        id: "old-1",
        workDate: new Date("2026-05-26T00:00:00.000Z"),
        checkInTime: parseTime("09:30", new Date("2026-05-26T00:00:00.000Z")),
        checkOutTime: parseTime("22:22", new Date("2026-05-26T00:00:00.000Z")),
        overtimeMinutes: 202,
        remark: "来源：user_screenshot",
      }),
      buildDbRecord({
        id: "new-1",
        workDate: new Date("2026-05-26T08:00:00.000Z"),
        checkInTime: parseTime("09:30", new Date("2026-05-26T00:00:00.000Z")),
        checkOutTime: parseTime("22:31", new Date("2026-05-26T00:00:00.000Z")),
        overtimeMinutes: 211,
        remark: "AI 截图导入：最终确认为 22:31",
      }),
    ]);

    const records = await loadAttendanceRecords("2026-05");

    expect(records).toHaveLength(1);
    expect(records[0]).toEqual(
      expect.objectContaining({
        id: "new-1",
        overtimeMinutes: 211,
        remark: "AI 截图导入：最终确认为 22:31",
      }),
    );
    expect(toDateKey(records[0]!.workDate)).toBe("2026-05-26");
  });
});

function buildDbRecord(overrides: Partial<{
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
}>) {
  return {
    id: "record-1",
    userId: "user-1",
    workDate: new Date("2026-05-26T00:00:00.000Z"),
    checkInTime: null,
    checkOutTime: null,
    rawCheckInText: null,
    rawCheckOutText: null,
    actualWorkMinutes: 0,
    standardWorkMinutes: 480,
    overtimeMinutes: 0,
    lateMinutes: 0,
    earlyLeaveMinutes: 0,
    status: "NORMAL",
    source: "EXCEL_IMPORT",
    remark: null,
    ...overrides,
  };
}
