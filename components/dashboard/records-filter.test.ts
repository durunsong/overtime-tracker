import { describe, expect, it } from "vitest";
import { DEFAULT_RECORD_FILTERS, resetRecordFilters } from "./records-filter";

describe("resetRecordFilters", () => {
  it("restores the records search bar filters to their default values", () => {
    expect(
      resetRecordFilters(),
    ).toEqual(DEFAULT_RECORD_FILTERS);
  });
});
