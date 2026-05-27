import { generateText } from "ai";
import { z } from "zod";
import { validateAttendanceRow } from "@/lib/attendance/validators";
import { getAiLanguageModel } from "./client";
import { buildScreenshotImportPrompt } from "./prompts";
import type { ImportPreview } from "@/types/import";

export type ScreenshotImportFile = {
  fileName: string;
  mimeType: string;
  buffer: ArrayBuffer;
};

const aiRecordSchema = z.object({
  date: z.string().min(1),
  name: z.string().nullish(),
  checkIn: z.string().nullish(),
  checkOut: z.string().nullish(),
  remark: z.string().nullish(),
});

const aiResultSchema = z.object({
  records: z.array(aiRecordSchema),
});

export async function parseAttendanceScreenshots(
  files: ScreenshotImportFile[],
): Promise<ImportPreview> {
  const result = await generateText({
    model: getAiLanguageModel(),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildScreenshotImportPrompt(files.map((file) => file.fileName)) },
          ...files.map((file) => ({
            type: "image" as const,
            image: file.buffer,
            mediaType: file.mimeType,
          })),
        ],
      },
    ],
    temperature: 0,
  });

  const parsed = aiResultSchema.parse(parseJsonObject(result.text));
  const previewRows = parsed.records.map((row, index) => {
    const validation = validateAttendanceRow({
      name: row.name ?? undefined,
      date: row.date,
      checkIn: row.checkIn ?? undefined,
      checkOut: row.checkOut ?? undefined,
      remark: row.remark ?? undefined,
    });

    return {
      rowNumber: index + 1,
      raw: {
        date: row.date,
        name: row.name ?? "",
        checkIn: row.checkIn ?? "",
        checkOut: row.checkOut ?? "",
        remark: row.remark ?? "",
      },
      record: validation.record ?? undefined,
      errors: validation.errors,
    };
  });

  return {
    headers: ["date", "name", "checkIn", "checkOut", "remark"],
    mapping: {
      date: "date",
      name: "name",
      checkIn: "checkIn",
      checkOut: "checkOut",
      remark: "remark",
    },
    rows: previewRows,
    totalRows: previewRows.length,
    validRows: previewRows.filter((row) => row.errors.length === 0).length,
    invalidRows: previewRows.filter((row) => row.errors.length > 0).length,
  };
}

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start < 0 || end < start) {
    throw new Error("AI 未返回可解析的 JSON 结果");
  }

  return JSON.parse(candidate.slice(start, end + 1)) as unknown;
}
