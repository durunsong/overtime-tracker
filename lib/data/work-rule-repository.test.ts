import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultWorkRule } from "@/types/attendance";
import { parseTime } from "@/lib/attendance/parser";

const prismaMock = vi.hoisted(() => ({
  workRule: {
    findFirst: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
  },
  workDayOverride: {
    findMany: vi.fn(),
  },
  attendanceRecord: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => prismaMock,
}));

describe("work-rule repository", () => {
  beforeEach(() => {
    prismaMock.workRule.findFirst.mockReset();
    prismaMock.workRule.updateMany.mockReset();
    prismaMock.workRule.create.mockReset();
    prismaMock.workDayOverride.findMany.mockReset();
    prismaMock.workDayOverride.findMany.mockResolvedValue([]);
    prismaMock.attendanceRecord.findMany.mockReset();
    prismaMock.attendanceRecord.update.mockReset();
  });

  it("creates a default rule when the user has none", async () => {
    const { ensureDefaultWorkRuleForUser } = await import("./work-rule-repository");

    prismaMock.workRule.findFirst.mockResolvedValue(null);
    prismaMock.workRule.create.mockResolvedValue({
      ...defaultWorkRule,
      userId: "user-1",
      isDefault: true,
    });

    const rule = await ensureDefaultWorkRuleForUser("user-1");

    expect(prismaMock.workRule.create).toHaveBeenCalled();
    expect(rule.startTime).toBe(defaultWorkRule.startTime);
    expect(rule.lunchBreakStartTime).toBe("12:00");
  });

  it("saves a new default rule and recalculates punched records", async () => {
    const { saveDefaultWorkRuleForUser } = await import("./work-rule-repository");
    const workDate = new Date("2026-05-04T00:00:00");

    prismaMock.workRule.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.workRule.create.mockResolvedValue({
      ...defaultWorkRule,
      overtimeStartTime: "20:00",
      userId: "user-1",
      isDefault: true,
    });
    prismaMock.attendanceRecord.findMany.mockResolvedValue([
      {
        id: "record-1",
        workDate,
        checkInTime: parseTime("09:30", workDate),
        checkOutTime: parseTime("20:30", workDate),
        rawCheckInText: "09:30",
        rawCheckOutText: "20:30",
        remark: null,
        status: "NORMAL",
      },
    ]);
    prismaMock.attendanceRecord.update.mockResolvedValue({ id: "record-1" });

    const rule = await saveDefaultWorkRuleForUser("user-1", {
      ...defaultWorkRule,
      overtimeStartTime: "20:00",
    });

    expect(rule.overtimeStartTime).toBe("20:00");
    expect(prismaMock.attendanceRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          overtimeMinutes: 30,
        }),
      }),
    );
  });
});
