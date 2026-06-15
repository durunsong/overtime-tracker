import { describe, expect, it } from "vitest";
import { createDefaultRecordFilters, isRecordStatusFilter, resetRecordFilters } from "./records-filter";

describe("resetRecordFilters", () => {
  it("restores the records search bar filters to their default values", () => {
    const now = new Date("2026-06-15T10:00:00");
    expect(resetRecordFilters(now)).toEqual(createDefaultRecordFilters(now));
  });

  it("accepts only supported record status filter values", () => {
    expect(isRecordStatusFilter("NORMAL")).toBe(true);
    expect(isRecordStatusFilter("ALL")).toBe(true);
    expect(isRecordStatusFilter("UNKNOWN")).toBe(false);
  });
});
