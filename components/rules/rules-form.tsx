"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import { defaultWorkRule, type WorkRuleInput } from "@/types/attendance";

function formatLunchWindow(rule: Pick<WorkRuleInput, "lunchBreakStartTime" | "lunchBreakMinutes">) {
  const [hourText, minuteText] = rule.lunchBreakStartTime.split(":");
  const startHour = Number(hourText);
  const startMinute = Number(minuteText);
  const totalMinutes = startHour * 60 + startMinute + rule.lunchBreakMinutes;
  const endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;
  return `${rule.lunchBreakStartTime}-${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
}

export function RulesForm() {
  const { control, register, handleSubmit, reset } = useForm<WorkRuleInput>({
    defaultValues: defaultWorkRule,
  });
  const watchedRule = useWatch({ control });

  useEffect(() => {
    let active = true;

    async function loadRule() {
      const response = await fetch("/api/rules");
      const result = await response.json();
      if (active && result.success && result.data) {
        reset(result.data);
      }
    }

    void loadRule();
    return () => {
      active = false;
    };
  }, [reset]);

  async function onSubmit(values: WorkRuleInput) {
    const response = await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json();
    if (result.success) {
      toast.success(result.message ?? "规则已保存");
      if (result.data) {
        reset(result.data);
      }
    } else {
      toast.error(result.error ?? "保存失败");
    }
  }

  const lunchWindow =
    watchedRule.lunchBreakStartTime && watchedRule.lunchBreakMinutes != null
      ? formatLunchWindow({
          lunchBreakStartTime: watchedRule.lunchBreakStartTime,
          lunchBreakMinutes: watchedRule.lunchBreakMinutes,
        })
      : formatLunchWindow(defaultWorkRule);
  const startTime = watchedRule.startTime ?? defaultWorkRule.startTime;
  const standardHours = Math.round(
    ((watchedRule.standardWorkMinutes ?? defaultWorkRule.standardWorkMinutes) / 60) * 10,
  ) / 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle>个人工作规则</CardTitle>
        <p className="text-sm text-slate-400">
          每位用户独立配置上下班、午休与加班口径。保存后会按新规则重新计算你的历史打卡记录。
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <h3 className="md:col-span-2 xl:col-span-3 text-sm font-medium text-slate-200">基础信息</h3>
            <label className="space-y-2 text-sm text-slate-300 md:col-span-2 xl:col-span-3">
              规则名称
              <Input {...register("name")} placeholder="例如：弹性工时 / 固定 9 点班" />
            </label>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <h3 className="md:col-span-2 xl:col-span-3 text-sm font-medium text-slate-200">工作日时段</h3>
            <label className="space-y-2 text-sm text-slate-300">
              上班时间
              <Controller
                control={control}
                name="startTime"
                render={({ field }) => (
                  <TimePicker value={field.value} onChange={field.onChange} aria-label="选择上班时间" />
                )}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              下班时间
              <Controller
                control={control}
                name="endTime"
                render={({ field }) => (
                  <TimePicker value={field.value} onChange={field.onChange} aria-label="选择下班时间" />
                )}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              标准工作分钟
              <Input type="number" {...register("standardWorkMinutes", { valueAsNumber: true })} />
              <span className="block text-xs text-slate-500">约 {standardHours} 小时，用于月报标准工时与非工作日封顶。</span>
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              加班开始时间
              <Controller
                control={control}
                name="overtimeStartTime"
                render={({ field }) => (
                  <TimePicker value={field.value} onChange={field.onChange} aria-label="选择加班开始时间" />
                )}
              />
            </label>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <h3 className="md:col-span-2 xl:col-span-3 text-sm font-medium text-slate-200">午休扣减</h3>
            <label className="space-y-2 text-sm text-slate-300">
              午休开始时间
              <Controller
                control={control}
                name="lunchBreakStartTime"
                render={({ field }) => (
                  <TimePicker value={field.value} onChange={field.onChange} aria-label="选择午休开始时间" />
                )}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              午休分钟
              <Input type="number" {...register("lunchBreakMinutes", { valueAsNumber: true })} />
            </label>
            <label className="grid min-h-24 gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300 md:col-span-2 xl:col-span-3">
              <span className="flex items-center gap-2 font-medium text-slate-100">
                <input type="checkbox" {...register("lunchBreakEnabled")} />
                启用午休扣减
              </span>
              <span className="text-xs leading-5 text-slate-500">
                按 {lunchWindow} 与实际出勤重叠部分扣减。
              </span>
            </label>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-medium text-slate-200">统计开关</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="grid min-h-24 gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
                <span className="flex items-center gap-2 font-medium text-slate-100">
                  <input type="checkbox" {...register("beforeStartNotCount")} />
                  早到不多算
                </span>
                <span className="text-xs leading-5 text-slate-500">
                  {startTime} 前到岗仍从 {startTime} 开始计算。
                </span>
              </label>
              <label className="grid min-h-24 gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/[0.04] p-3 text-sm text-slate-300">
                <span className="flex items-center gap-2 font-medium text-cyan-50">
                  <input type="checkbox" {...register("weekendEnabled")} />
                  周末加班
                </span>
                <span className="text-xs leading-5 text-slate-400">
                  普通周末按 {standardHours} 小时封顶统计，迟到和午休会扣减。
                </span>
              </label>
              <label className="grid min-h-24 gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
                <span className="flex items-center gap-2 font-medium text-slate-100">
                  <input type="checkbox" {...register("holidayEnabled")} />
                  节假日统计
                </span>
                <span className="text-xs leading-5 text-slate-500">
                  用于法定节假日口径，和普通双休周末分开控制。
                </span>
              </label>
            </div>
          </section>

          <div>
            <Button type="button" variant="secondary" onClick={() => reset(defaultWorkRule)}>
              恢复系统默认模板
            </Button>
            <Button type="submit" className="ml-2">
              <Save className="h-4 w-4" /> 保存并重新计算
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
