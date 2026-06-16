import { describe, expect, it } from "vitest";
import { validateWorkRuleInput } from "@/lib/attendance/work-rule";
import { defaultWorkRule } from "@/types/attendance";
import { resolveEffectiveDayKind } from "@/lib/calendar/day-kind";

describe("work rule validation", () => {
  it("rejects inconsistent work windows", () => {
    const errors = validateWorkRuleInput({
      ...defaultWorkRule,
      startTime: "10:00",
      endTime: "09:00",
    });

    expect(errors).toContain("下班时间必须晚于上班时间");
  });
});

describe("day kind overrides", () => {
  it("forces weekend days to workday calculation when overridden", () => {
    expect(resolveEffectiveDayKind("WEEKEND", "FORCE_WORKDAY")).toBe("WORKDAY");
    expect(resolveEffectiveDayKind("WORKDAY", "FORCE_REST")).toBe("FORCED_REST");
  });
});
