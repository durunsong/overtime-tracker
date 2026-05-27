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
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" {...register("beforeStartNotCount")} />
            9:30 前打卡不额外算工时
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" {...register("lunchBreakEnabled")} />
            启用午休扣减
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" {...register("weekendEnabled")} />
            周末打卡按加班统计，最多算 8 小时
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" {...register("holidayEnabled")} />
            节假日纳入统计
          </label>
          <p className="md:col-span-2 xl:col-span-3 text-sm text-slate-400">
            双休制建议开启“9:30 前打卡不额外算工时”和“周末打卡按加班统计”。周末 9:30 前到且 19:00 后走，最多按 8 小时；9:30 后到会从 8 小时里扣掉迟到分钟。
          </p>
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
