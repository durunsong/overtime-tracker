import { format } from "date-fns";
import { CalendarWorkbench } from "@/components/calendar/calendar-workbench";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCalendarMonth } from "@/lib/calendar/china-calendar";
import { loadAttendanceRecords } from "@/lib/data/attendance-repository";

export const dynamic = "force-dynamic";

type CalendarPageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month)
    ? params.month
    : format(new Date(), "yyyy-MM");
  let calendar;

  try {
    calendar = buildCalendarMonth(month, await loadAttendanceRecords(month));
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>无法加载月历</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-slate-400">
            请检查数据库连接和迁移状态。错误信息：
            {error instanceof Error ? error.message : "未知错误"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <CalendarWorkbench initialCalendar={calendar} />;
}
