import { describe, expect, it } from "vitest";
import {
  BUSINESS_TIME_ZONE,
  combineBusinessDateAndTime,
  formatClockInTimeZone,
  formatDateKeyInTimeZone,
  startOfBusinessDay,
} from "./timezone";

describe("business timezone helpers", () => {
  it("uses Asia/Shanghai as the fixed business timezone", () => {
    expect(BUSINESS_TIME_ZONE).toBe("Asia/Shanghai");
  });

  it("formats date keys and clocks in Asia/Shanghai", () => {
    const instant = new Date("2026-07-11T01:02:00.000Z");
    expect(formatDateKeyInTimeZone(instant)).toBe("2026-07-11");
    expect(formatClockInTimeZone(instant)).toBe("09:02");
  });

  it("combines civil date and clock into a Shanghai instant", () => {
    expect(combineBusinessDateAndTime("2026-07-11", "09:02")?.toISOString()).toBe(
      "2026-07-11T01:02:00.000Z",
    );
    expect(startOfBusinessDay("2026-07-11").toISOString()).toBe("2026-07-10T16:00:00.000Z");
  });
});
