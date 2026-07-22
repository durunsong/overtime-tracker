import { describe, expect, it } from "vitest";
import {
  getCurrentDateKey,
  getCurrentMonth,
  getCurrentMonthDate,
  getMonthOrCurrent,
  isMonthValue,
} from "./month";

describe("month helpers", () => {
  it("formats the current month with the configured business timezone", () => {
    expect(getCurrentMonth(new Date("2026-05-31T16:30:00.000Z"))).toBe("2026-06");
  });

  it("formats the current date with the configured business timezone", () => {
    expect(getCurrentDateKey(new Date("2026-05-31T16:30:00.000Z"))).toBe("2026-06-01");
  });

  it("builds dates inside the current month", () => {
    expect(getCurrentMonthDate(4, new Date("2026-06-15T08:00:00.000Z"))).toBe("2026-06-04");
  });

  it("accepts only yyyy-MM month values", () => {
    expect(isMonthValue("2026-06")).toBe(true);
    expect(isMonthValue("2026-13")).toBe(false);
    expect(isMonthValue("2026-6")).toBe(false);
  });

  it("falls back to the current month when input is missing or invalid", () => {
    const now = new Date("2026-06-15T08:00:00.000Z");

    expect(getMonthOrCurrent("2026-05", now)).toBe("2026-05");
    expect(getMonthOrCurrent(null, now)).toBe("2026-06");
    expect(getMonthOrCurrent("2026-99", now)).toBe("2026-06");
  });
});
