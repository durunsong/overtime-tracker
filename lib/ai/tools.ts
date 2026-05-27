import type { MonthlyReportView } from "@/types/report";
import type { StreamTextOnFinishCallback, ToolSet } from "ai";
import { buildMonthlySummaryPrompt, buildQuestionPrompt } from "./prompts";
import { generateAiText, streamAiText } from "./client";

export async function summarizeMonthlyReport(report: MonthlyReportView) {
  if (report.records.length === 0) {
    return "当前月份没有考勤数据，无法生成月报总结。";
  }

  return generateAiText(buildMonthlySummaryPrompt(report));
}

export function streamMonthlyReportSummary(
  report: MonthlyReportView,
  options?: { onFinish?: StreamTextOnFinishCallback<ToolSet> },
) {
  if (report.records.length === 0) {
    throw new Error("当前月份没有考勤数据，无法生成月报总结。");
  }

  return streamAiText(buildMonthlySummaryPrompt(report), options);
}

export async function answerAttendanceQuestion(
  report: MonthlyReportView,
  question: string,
) {
  if (report.records.length === 0) {
    return "当前月份没有考勤数据，无法回答该问题。";
  }

  return generateAiText(buildQuestionPrompt(report, question));
}

export function streamAttendanceQuestion(report: MonthlyReportView, question: string) {
  if (report.records.length === 0) {
    throw new Error("当前月份没有考勤数据，无法回答该问题。");
  }

  return streamAiText(buildQuestionPrompt(report, question));
}
