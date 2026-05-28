import { describe, expect, it } from "vitest";
import { DEFAULT_RECORD_FILTERS, isRecordStatusFilter, resetRecordFilters } from "./records-filter";

describe("resetRecordFilters", () => {
  it("restores the records search bar filters to their default values", () => {
    expect(
      resetRecordFilters(),
    ).toEqual(DEFAULT_RECORD_FILTERS);
  });

  it("accepts only supported record status filter values", () => {
    expect(isRecordStatusFilter("NORMAL")).toBe(true);
    expect(isRecordStatusFilter("ALL")).toBe(true);
    expect(isRecordStatusFilter("UNKNOWN")).toBe(false);
  });
});
