import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultWorkRule } from "@/types/attendance";
import { parseTime } from "@/lib/attendance/parser";

const prismaMock = vi.hoisted(() => ({
  workRule: {
    findFirst: vi.fn(),
  },
  attendanceRecord: {
    create: vi.fn(),
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
});
