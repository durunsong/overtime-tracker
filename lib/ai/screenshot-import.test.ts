import { describe, expect, it } from "vitest";
import { buildScreenshotImportPreview } from "./screenshot-import";

describe("buildScreenshotImportPreview", () => {
  it("drops OCR header rows and imports late overtime rows", () => {
    const preview = buildScreenshotImportPreview([
      {
        date: "date",
        name: "name",
        checkIn: "checkIn",
        checkOut: "checkOut",
        remark: "remark",
      },
      {
        date: "2026-05-27",
        name: "",
        checkIn: "09:40",
        checkOut: "19:05",
        remark: "",
      },
    ]);

    expect(preview.totalRows).toBe(1);
    expect(preview.validRows).toBe(1);
    expect(preview.invalidRows).toBe(0);
    expect(preview.rows[0]?.record?.lateMinutes).toBe(10);
    expect(preview.rows[0]?.record?.overtimeMinutes).toBe(5);
    expect(preview.rows[0]?.errors).toEqual([]);
  });
});
