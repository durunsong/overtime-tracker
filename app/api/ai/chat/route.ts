import { z } from "zod";
import { jsonResponse } from "@/lib/utils";
import { loadAttendanceRecords } from "@/lib/data/attendance-repository";
import { generateMonthlyReport } from "@/lib/reports/monthly";
import { streamAttendanceQuestion } from "@/lib/ai/tools";

const schema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  question: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  try {
    const { month, question } = schema.parse(await request.json());
    const records = await loadAttendanceRecords(month);
    const report = generateMonthlyReport(records, month);
    const result = streamAttendanceQuestion(report, question);

    return result.toTextStreamResponse({
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "AI 分析失败" },
      { status: 400 },
    );
  }
}
