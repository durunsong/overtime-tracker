import { z } from "zod";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { jsonResponse } from "@/lib/utils";
import { loadMonthlyReportContext } from "@/lib/data/attendance-context";
import { streamMonthlyReportSummary } from "@/lib/ai/tools";

const schema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function POST(request: Request) {
  try {
    const { month } = schema.parse(await request.json());
    const { userId, report } = await loadMonthlyReportContext(month);
    const result = streamMonthlyReportSummary(report, {
      onFinish: async ({ text }) => {
        await saveMonthlyReportSummary(userId, month, report, text);
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "AI 月报总结失败" },
      { status: 400 },
    );
  }
}

async function saveMonthlyReportSummary(
  userId: string,
  month: string,
  report: Awaited<ReturnType<typeof loadMonthlyReportContext>>["report"],
  summary: string,
) {
  if (!isDatabaseConfigured()) return;

  const prisma = getPrisma();
  await prisma.monthlyReport.upsert({
    where: { userId_month: { userId, month } },
    update: {
      aiSummary: summary,
      reportJson: JSON.parse(JSON.stringify(report)),
    },
    create: {
      userId,
      month,
      workDays: report.workDays,
      actualWorkMinutes: report.actualWorkMinutes,
      standardWorkMinutes: report.standardWorkMinutes,
      overtimeMinutes: report.overtimeMinutes,
      lateCount: report.lateCount,
      earlyLeaveCount: report.earlyLeaveCount,
      abnormalCount: report.abnormalCount,
      reportJson: JSON.parse(JSON.stringify(report)),
      aiSummary: summary,
    },
  });
}
