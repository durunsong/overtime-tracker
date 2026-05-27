import { jsonResponse } from "@/lib/utils";
import { attendanceRecordSchema } from "@/lib/attendance/validators";
import { deleteAttendanceRecord, updateAttendanceRecord } from "@/lib/data/attendance-repository";
import { isDatabaseConfigured } from "@/lib/prisma";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isDatabaseConfigured()) {
      return jsonResponse({ success: false, error: "未配置 DATABASE_URL，无法更新记录" }, { status: 400 });
    }

    const { id } = await context.params;
    const parsed = attendanceRecordSchema.parse(await request.json());
    const record = await updateAttendanceRecord(id, {
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
      { success: false, error: error instanceof Error ? error.message : "更新记录失败" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isDatabaseConfigured()) {
      return jsonResponse({ success: false, error: "未配置 DATABASE_URL，无法删除记录" }, { status: 400 });
    }

    const { id } = await context.params;
    await deleteAttendanceRecord(id);
    return jsonResponse({ success: true, message: "删除成功" });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "删除记录失败" },
      { status: 400 },
    );
  }
}
