import { jsonResponse } from "@/lib/utils";
import { loadAttendanceRecords } from "@/lib/data/attendance-repository";
import { generateMonthlyReport } from "@/lib/reports/monthly";
import { getMonthOrCurrent } from "@/lib/date/month";

export async function GET(request: Request) {
  try {
    const month = getMonthOrCurrent(new URL(request.url).searchParams.get("month"));
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
