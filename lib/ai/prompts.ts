import type { MonthlyReportView } from "@/types/report";
import { formatMinutes } from "@/lib/attendance/formatter";
import { formatWorkRuleSummary } from "@/lib/attendance/work-rule";
import { getCurrentDateKey } from "@/lib/date/month";
import { buildAverageOvertimeHelper } from "@/lib/reports/overtime-average";

export function buildMonthlySummaryPrompt(report: MonthlyReportView) {
  const averageOvertimeHelper = buildAverageOvertimeHelper(report);

  return `
你是专业的考勤与工作投入分析助手。只能基于以下真实统计数据生成总结，不能编造不存在的日期、时长或原因。
如果数据不足，请直接说明数据不足。

${report.appliedRule ? `当前统计口径：\n${formatWorkRuleSummary(report.appliedRule)}\n` : ""}
月份：${report.month}
出勤天数：${report.workDays}
总有效出勤：${formatMinutes(report.actualWorkMinutes)}
总标准工时：${formatMinutes(report.standardWorkMinutes)}
总加班：${formatMinutes(report.overtimeMinutes)}
平均每日加班：${formatMinutes(report.averageOvertimeMinutes)}（${averageOvertimeHelper.helper}）
${averageOvertimeHelper.extra}
最高单日加班：${formatMinutes(report.maxDailyOvertimeMinutes)}
最低单日加班：${formatMinutes(report.minDailyOvertimeMinutes)}
迟到次数：${report.lateCount}
早退次数：${report.earlyLeaveCount}
异常打卡次数：${report.abnormalCount}

请输出：
1. 三句话以内的总体判断。
2. 一段正式月报文本，适合发给 HR 或主管。
3. 两条可执行建议。
`;
}

export function buildQuestionPrompt(report: MonthlyReportView, question: string) {
  return `
你是加班统计系统的 AI 分析助手。只能根据提供的月报数据回答用户问题，不允许猜测。
若问题超出数据范围，请说明当前数据无法支持该判断。

月报数据：
${JSON.stringify(
  {
    month: report.month,
    workDays: report.workDays,
    actualWorkMinutes: report.actualWorkMinutes,
    overtimeMinutes: report.overtimeMinutes,
    averageOvertimeMinutes: report.averageOvertimeMinutes,
    weekendOvertimeMinutes: report.weekendOvertimeMinutes,
    weekdayWorkDays: report.weekdayWorkDays,
    weekendWorkDays: report.weekendWorkDays,
    lateCount: report.lateCount,
    earlyLeaveCount: report.earlyLeaveCount,
    abnormalCount: report.abnormalCount,
    dayTrend: report.dayTrend,
  },
  null,
  2,
)}

用户问题：${question}
`;
}

export function buildScreenshotImportPrompt(
  fileNames: string[],
  today = getCurrentDateKey(),
) {
  const todayYear = today.slice(0, 4);

  return `
你是考勤截图 OCR 与结构化抽取助手。请只基于用户上传的截图识别打卡记录，不要补造截图中不存在的信息。

参考信息（仅用于消歧，不是默认打卡日期）：
- 今天（系统当前日期）是 ${today}。除非截图中的“选中日期”也是这一天，否则 records.date 禁止使用 ${today}。
- 截图缺少年份时，优先使用 ${todayYear}，不要随意回填更早年份。

需要识别的图片文件：
${fileNames.map((fileName, index) => `${index + 1}. ${fileName}`).join("\n")}

请从截图中抽取每日打卡数据，输出严格 JSON，不要 Markdown，不要解释：
{
  "records": [
    {
      "date": "yyyy-MM-dd",
      "name": "姓名，可为空",
      "checkIn": "HH:mm，可为空",
      "checkOut": "HH:mm，可为空",
      "remark": "识别依据或异常说明，可为空"
    }
  ]
}

规则：
- 同一天可能有多次打卡时，checkIn 取最早打卡时间，checkOut 取最晚打卡时间。
- 日历截图中，下方打卡明细对应的是“选中日期”，不是“今天”。先找选中日期，再与标题中的年、月拼成 yyyy-MM-dd。
- 选中日期通常是高对比度实心高亮（实心圆/实心底）；仅描边、浅色圆圈、弱高亮多半是“今天”标记。两者同时出现时，必须以实心选中日为准，禁止用今天描边覆盖。
- 典型反例：标题为 2026年7月，实心高亮 17，描边高亮 22（今天），下方展示 09:24/21:00 打卡明细时，date 必须是 2026-07-17，绝不能写成 ${today} 或 2026-07-22。
- 不要把系统当前日期、“今天”标记或截图生成日期自动当成打卡明细日期。
- 如果截图包含打卡时间但无法可靠判断这些时间对应哪一天，不要猜测日期，也不要输出该条记录。
- 不要把表头或字段名（如 date、name、checkIn、checkOut、remark、日期、姓名、上班、下班）输出为 records。
- 如果截图只有日期但缺少上班或下班时间，对应字段返回 null，不要猜测。
- 如果日期含中文、斜杠或点号，请统一转为 yyyy-MM-dd。
- 如果无法识别任何有效日期，records 返回空数组。
- 只输出 JSON 对象本身。
`;
}
