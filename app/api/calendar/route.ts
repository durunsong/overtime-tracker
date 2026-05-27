import { z } from "zod";
import { jsonResponse } from "@/lib/utils";
import { loadAttendanceRecords, upsertAttendanceRecordByDate } from "@/lib/data/attendance-repository";
import { buildCalendarMonth } from "@/lib/calendar/china-calendar";
import { combineDateAndTime, validateCalendarTime } from "@/lib/calendar/time";

const querySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

const saveSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkInTime: z.string().nullable().optional(),
  checkOutTime: z.string().nullable().optional(),
  remark: z.string().max(500).nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const query = querySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const records = await loadAttendanceRecords(query.month);
    return jsonResponse({
      success: true,
      data: buildCalendarMonth(query.month, records),
    });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "读取日历失败" },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = saveSchema.parse(await request.json());
    const checkInText = validateCalendarTime(body.checkInTime);
    const checkOutText = validateCalendarTime(body.checkOutTime);
    const record = await upsertAttendanceRecordByDate({
      workDate: combineDateAndTime(body.date, "00:00") as Date,
      checkInTime: combineDateAndTime(body.date, checkInText),
      checkOutTime: combineDateAndTime(body.date, checkOutText),
      rawCheckInText: checkInText,
      rawCheckOutText: checkOutText,
      remark: body.remark,
    });

    return jsonResponse({ success: true, data: record });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "保存日历记录失败" },
      { status: 400 },
    );
  }
}
