import { describe, expect, it } from "vitest";
import { getImportedRecordMonths } from "./import-summary";
import type { ImportPreview } from "@/types/import";

describe("import summary", () => {
  it("extracts unique months only from valid imported records", () => {
    const preview = {
      headers: [],
      mapping: {},
      totalRows: 4,
      validRows: 2,
      invalidRows: 2,
      rows: [
        {
          rowNumber: 1,
          raw: {},
          errors: [],
          record: {
            id: "case-1",
            source: "EXCEL_IMPORT",
            workDate: new Date("2026-05-09T00:00:00"),
            checkInTime: null,
            checkOutTime: null,
            actualWorkMinutes: 0,
            standardWorkMinutes: 0,
            overtimeMinutes: 0,
            lateMinutes: 0,
            earlyLeaveMinutes: 0,
            status: "NORMAL",
            issues: [],
          },
        },
        {
          rowNumber: 2,
          raw: {},
          errors: [],
          record: {
            id: "case-2",
            source: "EXCEL_IMPORT",
            workDate: new Date("2026-05-23T00:00:00"),
            checkInTime: null,
            checkOutTime: null,
            actualWorkMinutes: 0,
            standardWorkMinutes: 0,
            overtimeMinutes: 0,
            lateMinutes: 0,
            earlyLeaveMinutes: 0,
            status: "NORMAL",
            issues: [],
          },
        },
        {
          rowNumber: 3,
          raw: {},
          errors: ["日期格式异常"],
        },
        {
          rowNumber: 4,
          raw: {},
          errors: [],
          record: {
            id: "case-4",
            source: "EXCEL_IMPORT",
            workDate: new Date("2026-06-01T00:00:00"),
            checkInTime: null,
            checkOutTime: null,
            actualWorkMinutes: 0,
            standardWorkMinutes: 0,
            overtimeMinutes: 0,
            lateMinutes: 0,
            earlyLeaveMinutes: 0,
            status: "NORMAL",
            issues: [],
          },
        },
      ],
    } satisfies ImportPreview;

    expect(getImportedRecordMonths(preview)).toEqual(["2026-05", "2026-06"]);
  });

  it("supports JSON-serialized workDate strings from import API responses", () => {
    const preview = {
      headers: [],
      mapping: {},
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      rows: [
        {
          rowNumber: 1,
          raw: {},
          errors: [],
          record: {
            id: "case-json",
            source: "EXCEL_IMPORT",
            workDate: "2026-07-10T16:00:00.000Z" as unknown as Date,
            checkInTime: null,
            checkOutTime: null,
            actualWorkMinutes: 0,
            standardWorkMinutes: 0,
            overtimeMinutes: 0,
            lateMinutes: 0,
            earlyLeaveMinutes: 0,
            status: "NORMAL",
            issues: [],
          },
        },
      ],
    } satisfies ImportPreview;

    expect(getImportedRecordMonths(preview)).toEqual(["2026-07"]);
  });
});
