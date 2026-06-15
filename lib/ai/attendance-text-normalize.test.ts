import { describe, expect, it } from "vitest";
import {
  normalizeAiDate,
  normalizeAiStatusText,
  normalizeAiTime,
} from "./attendance-text-normalize";

describe("normalizeAiDate", () => {
  it("normalizes Chinese and slash dates", () => {
    expect(normalizeAiDate("2026年5月27日")).toBe("2026-05-27");
    expect(normalizeAiDate("2026/5/7")).toBe("2026-05-07");
    expect(normalizeAiDate("5月7日", new Date("2026-06-01"))).toBe("2026-05-07");
  });
});

describe("normalizeAiTime", () => {
  it("normalizes wrapped and meridiem times", () => {
    expect(normalizeAiTime("正常(09:16)")).toBe("09:16");
    expect(normalizeAiTime("9:30")).toBe("09:30");
    expect(normalizeAiTime("21:00:00")).toBe("21:00");
    expect(normalizeAiTime("下午 1:05")).toBe("13:05");
    expect(normalizeAiTime("-")).toBeNull();
  });
});

describe("normalizeAiStatusText", () => {
  it("maps rest and holiday markers", () => {
    expect(normalizeAiStatusText("rest", "休息(-,-)")).toBe("休息");
    expect(normalizeAiStatusText(null, "法定节假日")).toBe("节假日");
  });
});
