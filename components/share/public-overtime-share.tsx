import { CalendarDays, Clock3, Timer, TriangleAlert } from "lucide-react";
import { DailyOvertimeBar, WeeklyTrendLine } from "@/components/charts/overtime-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatMinutes } from "@/lib/attendance/formatter";
import type { ParsedOvertimeSharePayload } from "@/lib/share/overtime-share";

export function PublicOvertimeShare({ share }: { share: ParsedOvertimeSharePayload }) {
  const ranking = [...share.report.records]
    .sort((a, b) => b.overtimeMinutes - a.overtimeMinutes)
    .slice(0, 6);

  return (
    <main className="min-h-dvh bg-[#070b12] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs tracking-[0.22em] text-cyan-200/70">加班统计报告</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{share.ownerName} 的加班统计</h1>
            <p className="mt-2 text-sm text-slate-400">
              {share.report.month} 月数据，生成时间：{share.createdAt.toLocaleString("zh-CN")}
            </p>
          </div>
          <Badge tone="cyan">已分享给你</Badge>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="总加班" value={formatMinutes(share.report.overtimeMinutes)} helper="分享时的数据快照" icon={Timer} />
          <StatCard title="出勤天数" value={`${share.report.workDays} 天`} helper="按有效记录统计" icon={CalendarDays} tone="emerald" />
          <StatCard title="平均每日加班" value={formatMinutes(share.report.averageOvertimeMinutes)} helper="月度平均值" icon={Clock3} tone="amber" />
          <StatCard title="异常打卡" value={`${share.report.abnormalCount} 次`} helper="缺卡或时间冲突" icon={TriangleAlert} tone="rose" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <Card>
            <CardHeader>
              <CardTitle>每日加班趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <DailyOvertimeBar data={share.report.dayTrend} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>数据说明</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-slate-300">
                这份报告展示分享人在所选月份的加班汇总、趋势和明细排行。数据统计截至上方生成时间。
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>周维度趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklyTrendLine data={share.report.weekTrend} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>加班明细 Top 6</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ranking.length === 0 ? (
                <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-8 text-center text-sm text-slate-500">
                  本次分享没有可展示的打卡记录
                </div>
              ) : (
                ranking.map((record) => (
                  <div
                    key={record.workDate.toISOString()}
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
      </section>
    </main>
  );
}
