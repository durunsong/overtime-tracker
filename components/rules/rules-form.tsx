"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import { defaultWorkRule, type WorkRuleInput } from "@/types/attendance";

export function RulesForm() {
  const { control, register, handleSubmit, reset } = useForm<WorkRuleInput>({
    defaultValues: defaultWorkRule,
  });

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
      toast.success("规则已保存");
    } else {
      toast.error(result.error ?? "保存失败");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>工作规则配置</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2 text-sm text-slate-300">
            规则名称
            <Input {...register("name")} />
          </label>
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
          <label className="space-y-2 text-sm text-slate-300">
            午休分钟
            <Input type="number" {...register("lunchBreakMinutes", { valueAsNumber: true })} />
          </label>
          <fieldset className="md:col-span-2 xl:col-span-3">
            <legend className="mb-3 text-sm font-medium text-slate-200">统计开关</legend>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="grid min-h-24 gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
                <span className="flex items-center gap-2 font-medium text-slate-100">
                  <input type="checkbox" {...register("beforeStartNotCount")} />
                  早到不多算
                </span>
                <span className="text-xs leading-5 text-slate-500">9:30 前到岗仍从 9:30 开始计算。</span>
              </label>
              <label className="grid min-h-24 gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
                <span className="flex items-center gap-2 font-medium text-slate-100">
                  <input type="checkbox" {...register("lunchBreakEnabled")} />
                  午休扣减
                </span>
                <span className="text-xs leading-5 text-slate-500">按 12:00-13:30 与实际出勤重叠部分扣减。</span>
              </label>
              <label className="grid min-h-24 gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/[0.04] p-3 text-sm text-slate-300">
                <span className="flex items-center gap-2 font-medium text-cyan-50">
                  <input type="checkbox" {...register("weekendEnabled")} />
                  周末加班
                </span>
                <span className="text-xs leading-5 text-slate-400">普通周末按 8 小时封顶统计，迟到和午休会扣减。</span>
              </label>
              <label className="grid min-h-24 gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
                <span className="flex items-center gap-2 font-medium text-slate-100">
                  <input type="checkbox" {...register("holidayEnabled")} />
                  节假日统计
                </span>
                <span className="text-xs leading-5 text-slate-500">用于法定节假日口径，和普通双休周末分开控制。</span>
              </label>
            </div>
          </fieldset>
          <div className="md:col-span-2 xl:col-span-3">
            <Button type="submit">
              <Save className="h-4 w-4" /> 保存为默认规则
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
