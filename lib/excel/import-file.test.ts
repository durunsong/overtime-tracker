import { describe, expect, it } from "vitest";
import { getImportFileValidationError } from "./import-file";

describe("import file validation", () => {
  it("accepts xlsx and xls files within the size limit", () => {
    expect(
      getImportFileValidationError({
        name: "attendance.xlsx",
        size: 5 * 1024 * 1024,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    ).toBeNull();

    expect(
      getImportFileValidationError({
        name: "attendance.xls",
        size: 5 * 1024 * 1024,
        type: "application/vnd.ms-excel",
      }),
    ).toBeNull();
  });

  it("rejects unsupported file extensions and oversized files", () => {
    expect(
      getImportFileValidationError({
        name: "attendance.csv",
        size: 1024,
        type: "text/csv",
      }),
    ).toBe("仅支持 .xlsx 或 .xls 文件");

    expect(
      getImportFileValidationError({
        name: "attendance.xlsx",
        size: 21 * 1024 * 1024,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    ).toBe("Excel 文件不能超过 20MB");
  });
});
