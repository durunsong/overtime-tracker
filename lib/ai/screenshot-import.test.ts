import { describe, expect, it } from "vitest";
import {
  buildZhipuScreenshotMessages,
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

  it("merges duplicate valid dates using earliest check-in and latest check-out", () => {
    const preview = buildScreenshotImportPreview([
      { date: "2026-05-27", name: "", checkIn: "09:15", checkOut: "22:31", remark: "first" },
      { date: "2026-05-27", name: "", checkIn: "09:18", checkOut: "22:24", remark: "second" },
    ]);

    expect(preview.totalRows).toBe(1);
    expect(preview.validRows).toBe(1);
    expect(preview.rows[0]?.raw.checkIn).toBe("09:15");
    expect(preview.rows[0]?.raw.checkOut).toBe("22:31");
    expect(preview.rows[0]?.record?.rawCheckInText).toBe("09:15");
    expect(preview.rows[0]?.record?.rawCheckOutText).toBe("22:31");
    expect(preview.rows[0]?.record?.overtimeMinutes).toBe(211);
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

describe("buildZhipuScreenshotMessages", () => {
  it("uses the image_url content type required by Zhipu vision models", () => {
    const messages = buildZhipuScreenshotMessages([
      {
        fileName: "image.png",
        mimeType: "image/png",
        buffer: new Uint8Array([137, 80, 78, 71]).buffer,
      },
    ]);

    expect(messages[0]?.role).toBe("user");
    expect(messages[0]?.content[0]).toEqual({
      type: "image_url",
      image_url: { url: "iVBORw==" },
    });
    expect(messages[0]?.content[1]?.type).toBe("text");
    expect(messages[0]?.content[1]).toMatchObject({
      text: expect.stringContaining("image.png"),
    });
    expect(messages[0]?.content[1]).toMatchObject({
      text: expect.stringContaining("必须以实心选中日为准，禁止用今天描边覆盖"),
    });
    expect(messages[0]?.content[1]).toMatchObject({
      text: expect.stringContaining("records.date 禁止使用"),
    });
    expect(messages[0]?.content[1]).toMatchObject({
      text: expect.stringContaining("无法可靠判断这些时间对应哪一天，不要猜测日期"),
    });
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

  it("deduplicates valid rows across AI batches by work date", () => {
    const first = buildScreenshotImportPreview([
      { date: "2026-05-27", name: "", checkIn: "09:15", checkOut: "22:24", remark: "" },
    ]);
    const second = buildScreenshotImportPreview([
      { date: "2026-05-27", name: "", checkIn: "09:20", checkOut: "22:31", remark: "" },
    ]);

    const merged = mergeScreenshotImportPreviews([first, second]);

    expect(merged.totalRows).toBe(1);
    expect(merged.validRows).toBe(1);
    expect(merged.rows[0]?.raw.checkIn).toBe("09:15");
    expect(merged.rows[0]?.raw.checkOut).toBe("22:31");
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
