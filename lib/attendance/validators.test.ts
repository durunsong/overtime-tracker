import { describe, expect, it } from "vitest";
import { defaultWorkRule } from "@/types/attendance";
import { workRuleSchema } from "./validators";

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
