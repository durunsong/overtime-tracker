import type { MonthlyReportView } from "@/types/report";
import { formatMinutes } from "@/lib/attendance/formatter";
import { buildAverageOvertimeHelper } from "@/lib/reports/overtime-average";

export function buildPrintableReportHtml(report: MonthlyReportView) {
  const averageOvertimeHelper = buildAverageOvertimeHelper(report);
  const rows = report.records
    .map(
      (record) => `
        <tr>
          <td>${record.workDate.toISOString().slice(0, 10)}</td>
          <td>${record.rawCheckInText ?? ""}</td>
          <td>${record.rawCheckOutText ?? ""}</td>
          <td>${formatMinutes(record.overtimeMinutes)}</td>
          <td>${record.status}</td>
          <td>${record.remark ?? ""}</td>
        </tr>
      `,
    )
    .join("");

  return `<!doctype html>
  <html lang="zh-CN">
    <head>
      <meta charset="utf-8" />
      <title>${report.month} 加班月报</title>
      <style>
        body { font-family: Arial, "Microsoft YaHei", sans-serif; color: #111827; padding: 32px; }
        h1 { font-size: 28px; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 24px 0; }
        .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
        .label { color: #6b7280; font-size: 12px; }
        .value { font-size: 20px; font-weight: 700; margin-top: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
        th { background: #f9fafb; }
      </style>
    </head>
    <body>
      <h1>${report.month} 加班月报</h1>
      <div class="grid">
        <div class="card"><div class="label">出勤天数</div><div class="value">${report.workDays} 天</div></div>
        <div class="card"><div class="label">总加班</div><div class="value">${formatMinutes(report.overtimeMinutes)}</div></div>
        <div class="card"><div class="label">平均每日加班（工作日）</div><div class="value">${formatMinutes(report.averageOvertimeMinutes)}</div><div class="label" style="margin-top:8px">${averageOvertimeHelper.extra}</div></div>
        <div class="card"><div class="label">异常次数</div><div class="value">${report.abnormalCount} 次</div></div>
      </div>
      <h2>每日明细</h2>
      <table>
        <thead><tr><th>日期</th><th>上班</th><th>下班</th><th>加班</th><th>状态</th><th>备注</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
  </html>`;
}
