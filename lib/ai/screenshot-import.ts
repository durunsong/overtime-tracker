import { generateText } from "ai";
import {
  inferReferenceMonthKey,
  normalizeAiDate,
  normalizeAiStatusText,
  normalizeAiTime,
  normalizeOptionalAiText,
} from "@/lib/ai/attendance-text-normalize";
import { getAiVisionLanguageModel } from "@/lib/ai/client";
import { parseScreenshotAiJson, type ParsedAiScreenshotRecord } from "@/lib/ai/screenshot-json";
import { toDateKey } from "@/lib/attendance/parser";
import { validateAttendanceRow } from "@/lib/attendance/validators";
import { buildScreenshotImportPrompt, buildScreenshotImportSystemPrompt } from "./prompts";
import type { ImportPreview } from "@/types/import";

export type ScreenshotImportFile = {
  fileName: string;
  mimeType: string;
  buffer: ArrayBuffer;
};

type NormalizedAiRecord = {
  date: string;
  name: string | null;
  checkIn: string | null;
  checkOut: string | null;
  remark: string | null;
  status: string | null;
};

const SUMMARY_KEYWORDS = ["合计", "总计", "平均", "统计", "应出勤", "实出勤", "本月汇总", "summary"];

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
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const records = await requestScreenshotRecords(files, attempt > 0);
      return buildScreenshotImportPreview(records);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(getErrorMessage(error));
    }
  }

  throw lastError ?? new Error("AI 识别失败");
}

async function requestScreenshotRecords(files: ScreenshotImportFile[], retry: boolean) {
  const result = await generateText({
    model: getAiVisionLanguageModel(),
    messages: [
      {
        role: "system",
        content: buildScreenshotImportSystemPrompt(),
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: buildScreenshotImportPrompt(
              files.map((file) => file.fileName),
              { retry },
            ),
          },
          ...files.map((file) => ({
            type: "image" as const,
            image: toDataUri(file),
          })),
        ],
      },
    ],
    temperature: 0,
  });

  return parseScreenshotAiJson(result.text);
}

export function chunkScreenshotImportFiles(files: ScreenshotImportFile[]) {
  const batchSize = getScreenshotBatchSize();
  const chunks: ScreenshotImportFile[][] = [];

  for (let index = 0; index < files.length; index += batchSize) {
    chunks.push(files.slice(index, index + batchSize));
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

export function buildScreenshotImportPreview(records: ParsedAiScreenshotRecord[]): ImportPreview {
  const referenceMonth = inferReferenceMonthKey(records);
  const referenceDate = new Date(`${referenceMonth}-01T12:00:00`);
  const normalizedRecords = records
    .map((row) => normalizeAiRecord(row, referenceDate))
    .filter((row) => !isHeaderLikeRecord(row) && !isSummaryLikeRecord(row));

  const previewRows = normalizedRecords.map((row, index) => {
    const statusText = normalizeAiStatusText(row.status, row.remark);
    const validation = validateAttendanceRow({
      name: row.name ?? undefined,
      date: row.date,
      checkIn: row.checkIn ?? undefined,
      checkOut: row.checkOut ?? undefined,
      statusText: statusText ?? undefined,
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

function normalizeAiRecord(row: ParsedAiScreenshotRecord, referenceDate: Date): NormalizedAiRecord {
  const date = normalizeAiDate(row.date, referenceDate);
  return {
    date: date ?? String(row.date ?? "").trim(),
    name: normalizeOptionalAiText(row.name),
    checkIn: normalizeAiTime(row.checkIn),
    checkOut: normalizeAiTime(row.checkOut),
    remark: normalizeOptionalAiText(row.remark),
    status: normalizeOptionalAiText(row.status),
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

function isHeaderLikeRecord(row: NormalizedAiRecord) {
  const values = [
    [row.date, ["date", "日期", "打卡日期", "考勤日期"]],
    [row.name, ["name", "姓名", "员工姓名"]],
    [row.checkIn, ["checkin", "check in", "上班", "上班时间", "签到时间"]],
    [row.checkOut, ["checkout", "check out", "下班", "下班时间", "签退时间"]],
    [row.remark, ["remark", "备注", "说明"]],
    [row.status, ["status", "状态", "考勤状态"]],
  ] as const;

  const hitCount = values.filter(([value, aliases]) => {
    const normalized = normalizeHeaderText(value);
    return normalized ? aliases.some((alias) => normalizeHeaderText(alias) === normalized) : false;
  }).length;

  return hitCount >= 2;
}

function isSummaryLikeRecord(row: NormalizedAiRecord) {
  const merged = [row.date, row.name, row.remark, row.status].filter(Boolean).join(" ");
  return SUMMARY_KEYWORDS.some((keyword) => merged.includes(keyword));
}

function normalizeHeaderText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/[\s_\-：:]/g, "");
}

function toDataUri(file: ScreenshotImportFile) {
  const mimeType = file.mimeType || "image/png";
  const base64 = Buffer.from(file.buffer).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

function getScreenshotBatchSize() {
  const raw = process.env.AI_SCREENSHOT_BATCH_SIZE?.trim();
  const parsed = raw ? Number(raw) : 1;
  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(3, Math.max(1, Math.floor(parsed)));
}
