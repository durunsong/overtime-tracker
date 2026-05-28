import { generateText } from "ai";
import { z } from "zod";
import { toDateKey } from "@/lib/attendance/parser";
import { validateAttendanceRow } from "@/lib/attendance/validators";
import { getAiLanguageModel } from "./client";
import { buildScreenshotImportPrompt } from "./prompts";
import type { ImportPreview } from "@/types/import";

export type ScreenshotImportFile = {
  fileName: string;
  mimeType: string;
  buffer: ArrayBuffer;
};

const screenshotAiBatchSize = 3;

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

type AiRecord = z.infer<typeof aiRecordSchema>;

export async function parseAttendanceScreenshots(
  files: ScreenshotImportFile[],
): Promise<ImportPreview> {
  return parseAttendanceScreenshotBatches(files, parseAttendanceScreenshotChunk);
}

export async function parseAttendanceScreenshotBatches(
  files: ScreenshotImportFile[],
  parseChunk: (files: ScreenshotImportFile[]) => Promise<ImportPreview>,
): Promise<ImportPreview> {
  const previews = [];
  for (const chunk of chunkScreenshotImportFiles(files)) {
    try {
      previews.push(await parseChunk(chunk));
    } catch (error) {
      previews.push(buildFailedScreenshotChunkPreview(chunk, getErrorMessage(error)));
    }
  }

  return mergeScreenshotImportPreviews(previews);
}

async function parseAttendanceScreenshotChunk(files: ScreenshotImportFile[]): Promise<ImportPreview> {
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
  return buildScreenshotImportPreview(parsed.records);
}

export function chunkScreenshotImportFiles(files: ScreenshotImportFile[]) {
  const chunks: ScreenshotImportFile[][] = [];
  for (let index = 0; index < files.length; index += screenshotAiBatchSize) {
    chunks.push(files.slice(index, index + screenshotAiBatchSize));
  }
  return chunks;
}

export function mergeScreenshotImportPreviews(previews: ImportPreview[]): ImportPreview {
  const rows = normalizePreviewRows(previews.flatMap((preview) => preview.rows));

  return {
    headers: ["date", "name", "checkIn", "checkOut", "remark"],
    mapping: {
      date: "date",
      name: "name",
      checkIn: "checkIn",
      checkOut: "checkOut",
      remark: "remark",
    },
    rows,
    totalRows: rows.length,
    validRows: rows.filter((row) => row.errors.length === 0).length,
    invalidRows: rows.filter((row) => row.errors.length > 0).length,
  };
}

function buildFailedScreenshotChunkPreview(files: ScreenshotImportFile[], message: string): ImportPreview {
  const rows = files.map((file, index) => ({
    rowNumber: index + 1,
    raw: {
      date: "",
      name: "",
      checkIn: "",
      checkOut: "",
      remark: file.fileName,
    },
    record: undefined,
    errors: [`AI 识别失败：${message}`],
  }));

  return {
    headers: ["date", "name", "checkIn", "checkOut", "remark"],
    mapping: {
      date: "date",
      name: "name",
      checkIn: "checkIn",
      checkOut: "checkOut",
      remark: "remark",
    },
    rows,
    totalRows: rows.length,
    validRows: 0,
    invalidRows: rows.length,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "当前批次处理失败";
}

export function buildScreenshotImportPreview(records: AiRecord[]): ImportPreview {
  const rows = records.filter((row) => !isHeaderLikeRecord(row));
  const previewRows = rows.map((row, index) => {
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

  const normalizedRows = normalizePreviewRows(previewRows);

  return {
    headers: ["date", "name", "checkIn", "checkOut", "remark"],
    mapping: {
      date: "date",
      name: "name",
      checkIn: "checkIn",
      checkOut: "checkOut",
      remark: "remark",
    },
    rows: normalizedRows,
    totalRows: normalizedRows.length,
    validRows: normalizedRows.filter((row) => row.errors.length === 0).length,
    invalidRows: normalizedRows.filter((row) => row.errors.length > 0).length,
  };
}

type PreviewRow = ImportPreview["rows"][number];

function normalizePreviewRows(rows: PreviewRow[]): PreviewRow[] {
  const validRowsByDate = new Map<string, PreviewRow>();
  const passthroughRows: PreviewRow[] = [];

  for (const row of rows) {
    if (!row.record || row.errors.length > 0) {
      passthroughRows.push(row);
      continue;
    }

    const dateKey = toDateKey(row.record.workDate);
    const existing = validRowsByDate.get(dateKey);
    validRowsByDate.set(dateKey, existing ? mergeValidPreviewRows(existing, row) : row);
  }

  return [...validRowsByDate.values(), ...passthroughRows].map((row, index) => ({
    ...row,
    rowNumber: index + 1,
  }));
}

function mergeValidPreviewRows(left: PreviewRow, right: PreviewRow): PreviewRow {
  const leftCheckIn = left.record?.checkInTime?.getTime();
  const rightCheckIn = right.record?.checkInTime?.getTime();
  const leftCheckOut = left.record?.checkOutTime?.getTime();
  const rightCheckOut = right.record?.checkOutTime?.getTime();
  const checkIn = chooseTimeText(rawText(left.raw.checkIn), leftCheckIn, rawText(right.raw.checkIn), rightCheckIn, "earliest");
  const checkOut = chooseTimeText(rawText(left.raw.checkOut), leftCheckOut, rawText(right.raw.checkOut), rightCheckOut, "latest");
  const remark = [rawText(left.raw.remark), rawText(right.raw.remark)].filter(Boolean).join("；");
  const validation = validateAttendanceRow({
    name: rawText(left.raw.name) || rawText(right.raw.name) || undefined,
    date: rawText(left.raw.date) || rawText(right.raw.date),
    checkIn: checkIn || undefined,
    checkOut: checkOut || undefined,
    remark: remark || undefined,
  });

  return {
    rowNumber: left.rowNumber,
    raw: {
      date: rawText(left.raw.date) || rawText(right.raw.date),
      name: rawText(left.raw.name) || rawText(right.raw.name),
      checkIn,
      checkOut,
      remark,
    },
    record: validation.record ?? undefined,
    errors: validation.errors,
  };
}

function rawText(value: unknown) {
  return value == null ? "" : String(value);
}

function chooseTimeText(
  leftText: string,
  leftTime: number | undefined,
  rightText: string,
  rightTime: number | undefined,
  mode: "earliest" | "latest",
) {
  if (leftTime == null) return rightText;
  if (rightTime == null) return leftText;
  return mode === "earliest"
    ? leftTime <= rightTime
      ? leftText
      : rightText
    : leftTime >= rightTime
      ? leftText
      : rightText;
}

function isHeaderLikeRecord(row: AiRecord) {
  const values = [
    [row.date, ["date", "日期", "打卡日期", "考勤日期"]],
    [row.name, ["name", "姓名", "员工姓名"]],
    [row.checkIn, ["checkin", "check in", "上班", "上班时间", "签到时间"]],
    [row.checkOut, ["checkout", "check out", "下班", "下班时间", "签退时间"]],
    [row.remark, ["remark", "备注", "说明"]],
  ] as const;

  const hitCount = values.filter(([value, aliases]) => {
    const normalized = normalizeHeaderText(value);
    return normalized ? aliases.some((alias) => normalizeHeaderText(alias) === normalized) : false;
  }).length;

  return hitCount >= 2;
}

function normalizeHeaderText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/[\s_\-：:]/g, "");
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
