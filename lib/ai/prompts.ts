import type { MonthlyReportView } from "@/types/report";
import { formatMinutes } from "@/lib/attendance/formatter";
import { getCurrentMonthKey } from "@/lib/calendar/month";

export function buildMonthlySummaryPrompt(report: MonthlyReportView) {
  return `
你是专业的考勤与工作投入分析助手。只能基于以下真实统计数据生成总结，不能编造不存在的日期、时长或原因。
如果数据不足，请直接说明数据不足。

月份：${report.month}
出勤天数：${report.workDays}
总有效出勤：${formatMinutes(report.actualWorkMinutes)}
总标准工时：${formatMinutes(report.standardWorkMinutes)}
总加班：${formatMinutes(report.overtimeMinutes)}
平均每日加班：${formatMinutes(report.averageOvertimeMinutes)}
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

export function buildScreenshotImportSystemPrompt() {
  return `
你是考勤截图 OCR 与结构化抽取助手。你的任务是把截图中的“每日考勤行”转成 JSON，不允许编造截图里不存在的数据。

必须遵守：
- 只输出一个 JSON 对象，禁止 Markdown、禁止解释、禁止代码块。
- 每条记录对应一个自然日；同一日期多次打卡时，checkIn 取最早，checkOut 取最晚。
- 表头、字段名、按钮文案、统计汇总行不要写入 records。
- 日期统一输出 yyyy-MM-dd；时间统一输出 HH:mm（24 小时制，需补零）。
- 截图里缺失的时间字段输出 null，不要猜测。
- 休息日/节假日如果没有打卡时间，status 写“休息”或“节假日”，checkIn/checkOut 为 null。
- 忽略“合计、总计、平均、统计、本月、应出勤”等汇总行。
`.trim();
}

export function buildScreenshotImportPrompt(fileNames: string[], options?: { retry?: boolean }) {
  const currentMonth = getCurrentMonthKey();
  const retryHint = options?.retry
    ? "\n上次输出无法解析，请严格只返回 JSON 对象本身，字段名必须是 records。"
    : "";

  return `
请识别以下 ${fileNames.length} 张考勤截图，并抽取全部有效打卡记录。当前参考月份是 ${currentMonth}；若截图里只有“5月7日”这类无年份日期，请优先归入 ${currentMonth} 所在年份。

图片列表：
${fileNames.map((fileName, index) => `${index + 1}. ${fileName}`).join("\n")}

常见字段别名：
- 日期：日期 / 考勤日期 / 打卡日期 / date
- 上班：上班 / 签到 / 首次打卡 / 上班打卡 / check in
- 下班：下班 / 签退 / 末次打卡 / 下班打卡 / check out
- 状态：正常 / 迟到 / 早退 / 缺卡 / 休息 / 节假日 / 异常

若截图是列表或日历视图，请逐行提取每个日期的数据；若一行里出现“正常(09:16),正常(19:16)”这类格式，请解析括号内时间。

输出 JSON 结构：
{
  "records": [
    {
      "date": "yyyy-MM-dd",
      "name": "姓名，可为空字符串",
      "checkIn": "HH:mm 或 null",
      "checkOut": "HH:mm 或 null",
      "status": "正常/休息/节假日/迟到/早退/缺卡，可为空",
      "remark": "识别依据或异常说明，可为空"
    }
  ]
}
${retryHint}
`.trim();
}
