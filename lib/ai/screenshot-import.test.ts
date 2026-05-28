import { describe, expect, it } from "vitest";
import {
  buildScreenshotImportPreview,
  chunkScreenshotImportFiles,
  mergeScreenshotImportPreviews,
  parseAttendanceScreenshotBatches,
  type ScreenshotImportFile,
} from "./screenshot-import";

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

describe("chunkScreenshotImportFiles", () => {
  it("splits screenshots into groups of three to keep each AI request bounded", () => {
    const files = Array.from({ length: 10 }, (_, index) => screenshotFile(`shot-${index + 1}.png`));

    const chunks = chunkScreenshotImportFiles(files);

    expect(chunks.map((chunk) => chunk.map((file) => file.fileName))).toEqual([
      ["shot-1.png", "shot-2.png", "shot-3.png"],
      ["shot-4.png", "shot-5.png", "shot-6.png"],
      ["shot-7.png", "shot-8.png", "shot-9.png"],
      ["shot-10.png"],
    ]);
  });
});

describe("mergeScreenshotImportPreviews", () => {
  it("keeps row numbers continuous and recomputes totals after batched AI parsing", () => {
    const first = buildScreenshotImportPreview([
      { date: "2026-05-25", name: "", checkIn: "09:30", checkOut: "19:30", remark: "" },
    ]);
    const second = buildScreenshotImportPreview([
      { date: "2026-05-26", name: "", checkIn: "09:30", checkOut: "", remark: "" },
      { date: "2026-05-27", name: "", checkIn: "09:30", checkOut: "20:00", remark: "" },
    ]);

    const merged = mergeScreenshotImportPreviews([first, second]);

    expect(merged.totalRows).toBe(3);
    expect(merged.validRows).toBe(2);
    expect(merged.invalidRows).toBe(1);
    expect(merged.rows.map((row) => row.rowNumber)).toEqual([1, 2, 3]);
  });
});

describe("parseAttendanceScreenshotBatches", () => {
  it("keeps successful chunks and marks failed chunk images for review", async () => {
    const files = [
      screenshotFile("shot-1.png"),
      screenshotFile("shot-2.png"),
      screenshotFile("shot-3.png"),
      screenshotFile("shot-4.png"),
    ];

    const preview = await parseAttendanceScreenshotBatches(files, async (chunk) => {
      if (chunk[0]?.fileName === "shot-4.png") {
        throw new Error("模型输入超限");
      }

      return buildScreenshotImportPreview([
        { date: "2026-05-25", name: "", checkIn: "09:30", checkOut: "20:00", remark: "" },
      ]);
    });

    expect(preview.totalRows).toBe(2);
    expect(preview.validRows).toBe(1);
    expect(preview.invalidRows).toBe(1);
    expect(preview.rows[1]?.raw.remark).toBe("shot-4.png");
    expect(preview.rows[1]?.errors).toEqual(["AI 识别失败：模型输入超限"]);
  });
});

function screenshotFile(fileName: string): ScreenshotImportFile {
  return {
    fileName,
    mimeType: "image/png",
    buffer: new ArrayBuffer(1),
  };
}
