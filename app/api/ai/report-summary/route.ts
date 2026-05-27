import { z } from "zod";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { jsonResponse } from "@/lib/utils";
import { loadAttendanceRecords, getDefaultUserId } from "@/lib/data/attendance-repository";
import { generateMonthlyReport } from "@/lib/reports/monthly";
import { summarizeMonthlyReport } from "@/lib/ai/tools";

const schema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function POST(request: Request) {
  try {
    const { month } = schema.parse(await request.json());
    const records = await loadAttendanceRecords(month);
    const report = generateMonthlyReport(records, month);
    const summary = await summarizeMonthlyReport(report);

    if (isDatabaseConfigured()) {
      const prisma = getPrisma();
      const userId = await getDefaultUserId();
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

    return jsonResponse({ success: true, data: { summary } });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "AI 月报总结失败" },
      { status: 400 },
    );
  }
}
