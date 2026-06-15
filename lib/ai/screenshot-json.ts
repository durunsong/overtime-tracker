import { z } from "zod";

const aiRecordSchema = z.object({
  date: z.union([z.string(), z.number()]).optional(),
  name: z.union([z.string(), z.number(), z.null()]).optional(),
  checkIn: z.union([z.string(), z.number(), z.null()]).optional(),
  checkOut: z.union([z.string(), z.number(), z.null()]).optional(),
  remark: z.union([z.string(), z.number(), z.null()]).optional(),
  status: z.union([z.string(), z.number(), z.null()]).optional(),
});

const aiResultSchema = z.object({
  records: z.array(aiRecordSchema),
});

export type ParsedAiScreenshotRecord = z.infer<typeof aiRecordSchema>;

export function parseScreenshotAiJson(text: string): ParsedAiScreenshotRecord[] {
  const payload = extractJsonPayload(text);
  const records = extractRecords(payload);
  return aiResultSchema.parse({ records }).records;
}

function extractJsonPayload(text: string): unknown {
  const trimmed = text.trim().replace(/^\uFEFF/, "");
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = sanitizeJsonText(fenced?.[1] ?? trimmed);
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start < 0 || end < start) {
    const arrayStart = candidate.indexOf("[");
    const arrayEnd = candidate.lastIndexOf("]");
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      return JSON.parse(sanitizeJsonText(candidate.slice(arrayStart, arrayEnd + 1))) as unknown;
    }
    throw new Error("AI 未返回可解析的 JSON 结果");
  }

  return JSON.parse(sanitizeJsonText(candidate.slice(start, end + 1))) as unknown;
}

function extractRecords(payload: unknown): ParsedAiScreenshotRecord[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("AI 返回格式无效");
  }

  const objectPayload = payload as Record<string, unknown>;
  const candidates = [objectPayload.records, objectPayload.record, objectPayload.data, objectPayload.items];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as ParsedAiScreenshotRecord[];
    }
  }

  throw new Error("AI 返回中缺少 records 数组");
}

function sanitizeJsonText(text: string) {
  return text
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, "$1");
}
