import { jsonResponse } from "@/lib/utils";
import { attendanceRecordSchema, recordQuerySchema } from "@/lib/attendance/validators";
import {
  createAttendanceRecord,
  loadAttendanceRecords,
} from "@/lib/data/attendance-repository";
import { isDatabaseConfigured } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = recordQuerySchema.parse(Object.fromEntries(url.searchParams));
    const records = await loadAttendanceRecords(query.month);
    const filtered = records.filter((record) => {
      const matchStatus = !query.status || record.status === query.status;
      const matchKeyword =
        !query.keyword || `${record.remark ?? ""} ${record.rawCheckInText ?? ""}`.includes(query.keyword);
      return matchStatus && matchKeyword;
    });

    return jsonResponse({ success: true, data: filtered });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "读取记录失败" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return jsonResponse({ success: false, error: "未配置 DATABASE_URL，无法写入记录" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = attendanceRecordSchema.parse(body);
    const record = await createAttendanceRecord({
      workDate: parsed.workDate,
      checkInTime: parsed.checkInTime ?? null,
      checkOutTime: parsed.checkOutTime ?? null,
      rawCheckInText: parsed.rawCheckInText,
      rawCheckOutText: parsed.rawCheckOutText,
      remark: parsed.remark,
    });

    return jsonResponse({ success: true, data: record });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "写入记录失败" },
      { status: 400 },
    );
  }
}
