import { jsonResponse } from "@/lib/utils";
import { loadMonthlyReportContext } from "@/lib/data/attendance-context";
import { getMonthOrCurrent } from "@/lib/date/month";

export async function GET(request: Request) {
  try {
    const month = getMonthOrCurrent(new URL(request.url).searchParams.get("month"));
    const { report } = await loadMonthlyReportContext(month);
    return jsonResponse({ success: true, data: report });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "读取看板数据失败" },
      { status: 400 },
    );
  }
}
