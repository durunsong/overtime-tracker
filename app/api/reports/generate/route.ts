import { z } from "zod";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { jsonResponse } from "@/lib/utils";
import { loadAttendanceRecords, getDefaultUserId } from "@/lib/data/attendance-repository";
import { generateMonthlyReport } from "@/lib/reports/monthly";

const schema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function POST(request: Request) {
  try {
    const { month } = schema.parse(await request.json());
    const records = await loadAttendanceRecords(month);
    const report = generateMonthlyReport(records, month);

    if (isDatabaseConfigured()) {
      const prisma = getPrisma();
      const userId = await getDefaultUserId();
      await prisma.monthlyReport.upsert({
        where: { userId_month: { userId, month } },
        update: {
          workDays: report.workDays,
          actualWorkMinutes: report.actualWorkMinutes,
          standardWorkMinutes: report.standardWorkMinutes,
          overtimeMinutes: report.overtimeMinutes,
          lateCount: report.lateCount,
          earlyLeaveCount: report.earlyLeaveCount,
          abnormalCount: report.abnormalCount,
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
        },
      });
    }

    return jsonResponse({ success: true, data: report });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "生成月报失败" },
      { status: 400 },
    );
  }
}
