"use client";

import { useMemo, useState } from "react";
import { Bot, Clipboard, Copy, Download, Printer, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthPicker } from "@/components/ui/month-picker";
import { DailyOvertimeBar } from "@/components/charts/overtime-charts";
import { AiThinking, MarkdownAnswer } from "@/components/ai/ai-assistant";
import type { AttendanceRecordView, WorkRuleInput } from "@/types/attendance";
import type { WorkDayOverrideKind } from "@/lib/calendar/day-kind";
import { generateMonthlyReport, buildReportText } from "@/lib/reports/monthly";
import { formatMinutes } from "@/lib/attendance/formatter";
import { getCurrentMonth } from "@/lib/date/month";

export function MonthlyReportPanel({
  records,
  rule,
  overrideMap = new Map<string, WorkDayOverrideKind>(),
}: {
  records: AttendanceRecordView[];
  rule: WorkRuleInput;
  overrideMap?: Map<string, WorkDayOverrideKind>;
}) {
  const [month, setMonth] = useState(() => getCurrentMonth());
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const report = useMemo(
    () => generateMonthlyReport(records, month, rule, overrideMap),
    [month, overrideMap, records, rule],
  );

  async function generateAiSummary() {
    setAiLoading(true);
    setAiSummary("");

    const response = await fetch("/api/ai/report-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month }),
    });

    if (!response.ok || !response.body) {
      const result = await response.json().catch(() => null);
      setAiLoading(false);
      toast.error(result?.error ?? "生成失败");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        setAiSummary((current) => current + chunk);
      }
      toast.success("AI 总结已生成");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI 总结中断，请稍后重试");
    } finally {
      setAiLoading(false);
    }
  }

  async function exportExcel() {
    const response = await fetch("/api/reports/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, type: "excel" }),
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${month}-overtime-report.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function openPrint() {
    const response = await fetch("/api/reports/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, type: "html" }),
    });
    const html = await response.text();
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  return (
    <div className="space-y-4">
      <Card className="relative z-30">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>月报生成</CardTitle>
          <div className="flex flex-wrap gap-2">
            <MonthPicker
              className="w-36"
              aria-label="选择月报月份"
              value={month}
              onChange={setMonth}
            />
            <Button onClick={generateAiSummary} disabled={aiLoading}>
              <Sparkles className="h-4 w-4" /> {aiLoading ? "生成中" : "AI 总结"}
            </Button>
            <Button variant="secondary" onClick={exportExcel}>
              <Download className="h-4 w-4" /> 导出 Excel
            </Button>
            <Button variant="secondary" onClick={openPrint}>
              <Printer className="h-4 w-4" /> 打印版
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(buildReportText({ ...report, aiSummary }));
                toast.success("报告文本已复制");
              }}
            >
              <Clipboard className="h-4 w-4" /> 复制
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["出勤天数", `${report.workDays} 天`],
            ["总有效出勤", formatMinutes(report.actualWorkMinutes)],
            ["总加班", formatMinutes(report.overtimeMinutes)],
            ["异常打卡", `${report.abnormalCount} 次`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="relative z-0 grid items-start gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>每日加班明细图</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyOvertimeBar data={report.dayTrend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan-200" /> AI 总结与异常说明
            </CardTitle>
            <Button
              variant="secondary"
              size="sm"
              disabled={!aiSummary}
              onClick={() => {
                void navigator.clipboard.writeText(aiSummary);
                toast.success("已复制");
              }}
            >
              <Copy className="h-4 w-4" /> 复制
            </Button>
          </CardHeader>
          <CardContent>
            <div className="scrollbar-hidden h-[424px] overflow-y-auto rounded-lg border border-white/10 bg-slate-950/50 p-5 text-sm leading-7 text-slate-300">
              {aiSummary ? (
                <MarkdownAnswer content={aiSummary} />
              ) : (
                <p className="text-slate-500">
                  点击 AI 总结后，将基于当前月份真实统计数据生成正式月报文本。
                </p>
              )}
              {aiLoading ? <AiThinking text="AI 正在整理月报和异常说明，请稍等。" /> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
