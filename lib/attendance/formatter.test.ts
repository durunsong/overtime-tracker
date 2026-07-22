import { describe, expect, it } from "vitest";
import { formatPunchTimeRange } from "./formatter";
import { formatClockInTimeZone } from "@/lib/date/timezone";

describe("formatPunchTimeRange", () => {
  it("prefers raw punch texts so chart tooltips ignore runtime timezone", () => {
    expect(
      formatPunchTimeRange({
        checkInTime: new Date("2026-07-11T09:02:00.000Z"),
        checkOutTime: new Date("2026-07-11T22:20:00.000Z"),
        rawCheckInText: "09:02",
        rawCheckOutText: "22:20",
      }),
    ).toBe("09:02-22:20");
  });

  it("formats Date fallbacks in Asia/Shanghai", () => {
    const checkInTime = new Date("2026-07-11T01:02:00.000Z"); // 09:02 CST
    const checkOutTime = new Date("2026-07-11T14:20:00.000Z"); // 22:20 CST

    expect(formatClockInTimeZone(checkInTime)).toBe("09:02");
    expect(formatClockInTimeZone(checkOutTime)).toBe("22:20");
    expect(
      formatPunchTimeRange({
        checkInTime,
        checkOutTime,
      }),
    ).toBe("09:02-22:20");
  });
});
