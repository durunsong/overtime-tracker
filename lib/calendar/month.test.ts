import { describe, expect, it } from "vitest";
import { getCurrentMonthKey, isMonthKey, resolveMonthKey } from "./month";

describe("month helpers", () => {
  const fixedNow = new Date("2026-06-15T10:00:00");

  it("formats the current month as yyyy-MM", () => {
    expect(getCurrentMonthKey(fixedNow)).toBe("2026-06");
  });

  it("validates month keys", () => {
    expect(isMonthKey("2026-06")).toBe(true);
    expect(isMonthKey("2026-13")).toBe(false);
    expect(isMonthKey("2026-5")).toBe(false);
  });

  it("falls back to the current month when input is missing or invalid", () => {
    expect(resolveMonthKey(undefined, fixedNow)).toBe("2026-06");
    expect(resolveMonthKey(null, fixedNow)).toBe("2026-06");
    expect(resolveMonthKey("invalid", fixedNow)).toBe("2026-06");
    expect(resolveMonthKey("2026-05", fixedNow)).toBe("2026-05");
  });
});
