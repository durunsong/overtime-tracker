"use client";

import { useMemo, useState } from "react";
import { addMonths, format, parse, subMonths } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Save, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthPicker } from "@/components/ui/month-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Textarea } from "@/components/ui/textarea";
import { formatMinutes } from "@/lib/attendance/formatter";
import type { CalendarDay, CalendarMonth, ChinaDayKind } from "@/types/calendar";

const weekdayLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const quickCheckOutTimes = ["19:30", "20:00", "21:00", "22:00", "23:59"];

const kindLabel: Record<ChinaDayKind, string> = {
  WORKDAY: "工作日",
  WEEKEND: "周末",
  HOLIDAY: "节假日",
  ADJUSTED_WORKDAY: "调休工作日",
};

export function CalendarWorkbench({ initialCalendar }: { initialCalendar: CalendarMonth }) {
  const [calendar, setCalendar] = useState(initialCalendar);
  const [month, setMonth] = useState(initialCalendar.month);
  const [selectedDate, setSelectedDate] = useState(
    initialCalendar.days.find((day) => day.isToday)?.date ??
      initialCalendar.days.find((day) => day.isCurrentMonth)?.date ??
      initialCalendar.days[0]?.date,
  );
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedDay = useMemo(
    () => calendar.days.find((day) => day.date === selectedDate) ?? calendar.days[0],
    [calendar.days, selectedDate],
  );
  const monthlyOvertimeText = useMemo(() => {
    return formatMinutes(calendar.monthlyOvertimeMinutes);
  }, [calendar.monthlyOvertimeMinutes]);

  function selectDay(day: CalendarDay) {
    if (!day.isCurrentMonth) {
      return;
    }

    setSelectedDate(day.date);
    setCheckInTime(day.record?.rawCheckInText ?? "");
    setCheckOutTime(day.record?.rawCheckOutText ?? "");
    setRemark(day.record?.remark ?? "");
  }

  async function loadMonth(nextMonth: string) {
    setLoading(true);
    const response = await fetch(`/api/calendar?month=${nextMonth}`);
    const result = await response.json();
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "读取日历失败");
      return;
    }

    setMonth(nextMonth);
    setCalendar(result.data);
    const nextSelected =
      result.data.days.find((day: CalendarDay) => day.isToday)?.date ??
      result.data.days.find((day: CalendarDay) => day.isCurrentMonth)?.date;
    setSelectedDate(nextSelected);
    const day = result.data.days.find((item: CalendarDay) => item.date === nextSelected);
    setCheckInTime(day?.record?.rawCheckInText ?? "");
    setCheckOutTime(day?.record?.rawCheckOutText ?? "");
    setRemark(day?.record?.remark ?? "");
  }

  async function saveDay() {
    if (!selectedDay) {
      return;
    }

    setLoading(true);
    const response = await fetch("/api/calendar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedDay.date,
        checkInTime: checkInTime || null,
        checkOutTime: checkOutTime || null,
        remark: remark || null,
      }),
    });
    const result = await response.json();
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "保存失败");
      return;
    }

    toast.success("当天考勤已保存并重新计算");
    await loadMonth(month);
  }

  function shiftMonth(direction: "prev" | "next") {
    const current = parse(`${month}-01`, "yyyy-MM-dd", new Date());
    const next = direction === "prev" ? subMonths(current, 1) : addMonths(current, 1);
    void loadMonth(format(next, "yyyy-MM"));
  }

  function changeMonth(nextMonth: string) {
    setMonth(nextMonth);
    if (/^\d{4}-\d{2}$/.test(nextMonth)) {
      void loadMonth(nextMonth);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-cyan-200" />
                中国月历考勤
              </span>
              <span className="rounded-md border border-cyan-200/20 bg-cyan-200/8 px-3 py-1 text-sm font-medium text-cyan-100">
                当月加班总计时间{monthlyOvertimeText}
              </span>
            </CardTitle>
            <p className="mt-2 text-sm text-slate-500">
              点击某一天后在右侧编辑当天打卡，节假日和周末会在日历中标记。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon" onClick={() => shiftMonth("prev")} disabled={loading}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <MonthPicker
              className="w-32 text-center"
              aria-label="选择月份"
              value={month}
              onChange={changeMonth}
            />
            <Button variant="secondary" size="icon" onClick={() => shiftMonth("next")} disabled={loading}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekdayLabels.map((label) => (
              <div key={label} className="px-2 pb-2 text-center text-xs font-medium text-slate-500">
                {label}
              </div>
            ))}
            {calendar.days.map((day) => (
              <button
                key={day.date}
                onClick={() => selectDay(day)}
                className={getDayClassName(day, selectedDate)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-base font-semibold">{day.dayOfMonth}</span>
                  <DayBadge day={day} />
                </div>
                <div className="mt-2 min-h-5 text-left text-xs text-slate-500">
                  {day.name ?? day.lunarText ?? kindLabel[day.kind]}
                </div>
                <div className="mt-3 space-y-1 text-left text-xs">
                  {day.record ? (
                    <>
                      <div className="text-slate-300">
                        {day.record.rawCheckInText ?? "--"} - {day.record.rawCheckOutText ?? "--"}
                      </div>
                      <div className="text-cyan-100">
                        加班 {formatMinutes(day.record.overtimeMinutes)}
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-600">无打卡记录</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="xl:sticky xl:top-24 xl:self-start">
        <CardHeader>
          <CardTitle>{selectedDay?.date ?? month} 当日编辑</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedDay ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge
                  tone={
                    selectedDay.kind === "HOLIDAY"
                      ? "rose"
                      : selectedDay.kind === "WEEKEND"
                        ? "amber"
                        : selectedDay.kind === "ADJUSTED_WORKDAY"
                          ? "emerald"
                          : "cyan"
                  }
                >
                  {kindLabel[selectedDay.kind]}
                </Badge>
                {selectedDay.name ? <Badge tone="slate">{selectedDay.name}</Badge> : null}
                {selectedDay.wageRate && selectedDay.wageRate > 1 ? (
                  <Badge tone="emerald">{selectedDay.wageRate} 倍工资日</Badge>
                ) : null}
              </div>

              <label className="space-y-2 text-sm text-slate-300">
                上班打卡
                <TimePicker
                  aria-label="选择上班打卡时间"
                  value={checkInTime}
                  onChange={setCheckInTime}
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                下班打卡 / 加班截止
                <TimePicker
                  aria-label="选择下班打卡或加班截止时间"
                  value={checkOutTime}
                  onChange={setCheckOutTime}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {quickCheckOutTimes.map((time) => (
                  <Button key={time} variant="secondary" size="sm" onClick={() => setCheckOutTime(time)}>
                    <TimerReset className="h-3.5 w-3.5" /> {time}
                  </Button>
                ))}
              </div>
              <label className="space-y-2 text-sm text-slate-300">
                备注
                <Textarea value={remark} onChange={(event) => setRemark(event.target.value)} />
              </label>

              {selectedDay.record ? (
                <div className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-slate-300">
                  当前有效出勤：{formatMinutes(selectedDay.record.actualWorkMinutes)}
                  <br />
                  当前加班：{formatMinutes(selectedDay.record.overtimeMinutes)}
                  <br />
                  状态：{selectedDay.record.status}
                </div>
              ) : (
                <div className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-500">
                  数据库暂无当天记录，保存后会创建真实考勤记录。
                </div>
              )}

              <Button className="w-full" onClick={saveDay} disabled={loading}>
                <Save className="h-4 w-4" /> 保存当天记录
              </Button>
            </>
          ) : (
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-slate-500">
              当前月份没有可编辑日期
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DayBadge({ day }: { day: CalendarDay }) {
  if (day.kind === "HOLIDAY") {
    return <Badge tone="rose">休</Badge>;
  }
  if (day.kind === "ADJUSTED_WORKDAY") {
    return <Badge tone="emerald">班</Badge>;
  }
  if (day.kind === "WEEKEND") {
    return <Badge tone="amber">周末</Badge>;
  }
  if (day.isToday) {
    return <Badge tone="cyan">今天</Badge>;
  }
  return null;
}

function getDayClassName(day: CalendarDay, selectedDate?: string) {
  const base =
    "min-h-36 rounded-lg border p-3 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/40";
  const current = day.isCurrentMonth
    ? "border-white/10 bg-white/[0.045] text-white hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-cyan-200/8"
    : "border-white/5 bg-white/[0.02] text-slate-700";
  const selected = day.date === selectedDate ? "ring-2 ring-cyan-300/45" : "";
  const today = day.isToday ? "shadow-[0_0_28px_rgba(103,232,249,0.16)]" : "";
  return [base, current, selected, today].join(" ");
}
