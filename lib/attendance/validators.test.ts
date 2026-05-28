import { describe, expect, it } from "vitest";
import { defaultWorkRule } from "@/types/attendance";
import { validateAttendanceRow, workRuleSchema } from "./validators";

describe("workRuleSchema", () => {
  it("accepts valid HH:mm rule times", () => {
    expect(() => workRuleSchema.parse(defaultWorkRule)).not.toThrow();
  });

  it("rejects invalid HH:mm rule times", () => {
    expect(() =>
      workRuleSchema.parse({
        ...defaultWorkRule,
        startTime: "99:99",
      }),
    ).toThrow();
  });
});

describe("validateAttendanceRow", () => {
  it("allows late arrivals to be imported while keeping overtime independent", () => {
    const result = validateAttendanceRow({
      date: "2026-05-27",
      name: "Test User",
      checkIn: "09:40",
      checkOut: "19:05",
    });

    expect(result.errors).toEqual([]);
    expect(result.record?.status).toBe("LATE");
    expect(result.record?.lateMinutes).toBe(10);
    expect(result.record?.overtimeMinutes).toBe(5);
    expect(result.record?.issues).toContain("迟到 10 分钟");
  });

  it("allows early leaves as reviewable attendance records instead of blocking import", () => {
    const result = validateAttendanceRow({
      date: "2026-05-27",
      name: "Test User",
      checkIn: "09:30",
      checkOut: "18:45",
    });

    expect(result.errors).toEqual([]);
    expect(result.record?.status).toBe("EARLY_LEAVE");
    expect(result.record?.earlyLeaveMinutes).toBe(15);
    expect(result.record?.overtimeMinutes).toBe(0);
    expect(result.record?.issues).toContain("早退 15 分钟");
  });
});
