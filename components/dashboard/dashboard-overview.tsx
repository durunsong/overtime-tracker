import { AlertTriangle, CalendarDays, Clock3, Timer } from "lucide-react";
import { DailyOvertimeBar, WeeklyTrendLine } from "@/components/charts/overtime-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "./stat-card";
import type { MonthlyReportView } from "@/types/report";
import { formatMinutes } from "@/lib/attendance/formatter";

export function DashboardOverview({ report }: { report: MonthlyReportView }) {
  const ranking = [...report.records]
    .sort((a, b) => b.overtimeMinutes - a.overtimeMinutes)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="本月总加班" value={formatMinutes(report.overtimeMinutes)} helper="按 19:00 后时长汇总" icon={Timer} />
        <StatCard title="本月出勤天数" value={`${report.workDays} 天`} helper="排除缺卡与异常记录" icon={CalendarDays} tone="emerald" />
        <StatCard title="平均每日加班" value={formatMinutes(report.averageOvertimeMinutes)} helper="工作日维度平均值" icon={Clock3} tone="amber" />
        <StatCard title="异常打卡次数" value={`${report.abnormalCount} 次`} helper="缺卡或时间冲突" icon={AlertTriangle} tone="rose" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>本月每日加班柱状图</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyOvertimeBar data={report.dayTrend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI 本月总结</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-slate-300">
              {report.aiSummary ??
                "当前月报尚未生成 AI 总结。请在月报页面基于真实考勤数据生成后再查看。"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>本周加班趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyTrendLine data={report.weekTrend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>加班时长排行榜</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ranking.length === 0 ? (
              <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-8 text-center text-sm text-slate-500">
                数据库中暂无当前月份打卡记录
              </div>
            ) : (
              ranking.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] px-3 py-2"
              >
                <div>
                  <p className="text-sm text-white">{record.workDate.toISOString().slice(5, 10)}</p>
                  <p className="text-xs text-slate-500">{record.remark ?? "无备注"}</p>
                </div>
                <Badge tone={record.status === "NORMAL" ? "cyan" : "amber"}>
                  {formatMinutes(record.overtimeMinutes)}
                </Badge>
              </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
