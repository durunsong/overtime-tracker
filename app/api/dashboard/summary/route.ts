import { jsonResponse } from "@/lib/utils";
import { loadAttendanceRecords } from "@/lib/data/attendance-repository";
import { generateMonthlyReport } from "@/lib/reports/monthly";

export async function GET(request: Request) {
  try {
    const month = new URL(request.url).searchParams.get("month") ?? "2026-05";
    const records = await loadAttendanceRecords(month);
    const report = generateMonthlyReport(records, month);
    return jsonResponse({ success: true, data: report });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "读取看板数据失败" },
      { status: 400 },
    );
  }
}
