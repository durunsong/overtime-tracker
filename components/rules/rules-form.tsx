"use client";

import { useEffect, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
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

function FormSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <h3 className="border-b border-white/10 pb-2 text-sm font-medium text-slate-200">{title}</h3>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2 text-sm text-slate-300", className)}>
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

function ToggleCard({
  title,
  description,
  highlight,
  children,
}: {
  title: string;
  description: string;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex gap-3 rounded-md border p-3 text-sm text-slate-300",
        highlight
          ? "border-cyan-300/20 bg-cyan-300/[0.04]"
          : "border-white/10 bg-white/[0.03]",
      )}
    >
      <span className="mt-0.5 shrink-0">{children}</span>
      <span className="min-w-0 space-y-1">
        <span className={cn("font-medium", highlight ? "text-cyan-50" : "text-slate-100")}>{title}</span>
        <span className="block text-xs leading-5 text-slate-500">{description}</span>
      </span>
    </label>
  );
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <FormSection title="基础信息">
            <Field label="规则名称" className="max-w-md">
              <Input {...register("name")} placeholder="例如：弹性工时 / 固定 9 点班" />
            </Field>
          </FormSection>

          <FormSection title="工作日时段">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="上班时间">
                <Controller
                  control={control}
                  name="startTime"
                  render={({ field }) => (
                    <TimePicker value={field.value} onChange={field.onChange} aria-label="选择上班时间" />
                  )}
                />
              </Field>
              <Field label="下班时间">
                <Controller
                  control={control}
                  name="endTime"
                  render={({ field }) => (
                    <TimePicker value={field.value} onChange={field.onChange} aria-label="选择下班时间" />
                  )}
                />
              </Field>
              <Field
                label="标准工作分钟"
                hint={`约 ${standardHours} 小时，用于月报标准工时与非工作日封顶。`}
              >
                <Input type="number" {...register("standardWorkMinutes", { valueAsNumber: true })} />
              </Field>
              <Field label="加班开始时间">
                <Controller
                  control={control}
                  name="overtimeStartTime"
                  render={({ field }) => (
                    <TimePicker
                      value={field.value}
                      onChange={field.onChange}
                      aria-label="选择加班开始时间"
                    />
                  )}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="午休扣减">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="午休开始时间">
                <Controller
                  control={control}
                  name="lunchBreakStartTime"
                  render={({ field }) => (
                    <TimePicker
                      value={field.value}
                      onChange={field.onChange}
                      aria-label="选择午休开始时间"
                    />
                  )}
                />
              </Field>
              <Field label="午休分钟">
                <Input type="number" {...register("lunchBreakMinutes", { valueAsNumber: true })} />
              </Field>
              <ToggleCard
                title="启用午休扣减"
                description={`按 ${lunchWindow} 与实际出勤重叠部分扣减。`}
              >
                <input type="checkbox" {...register("lunchBreakEnabled")} />
              </ToggleCard>
            </div>
          </FormSection>

          <FormSection title="统计开关">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ToggleCard
                title="早到不多算"
                description={`${startTime} 前到岗仍从 ${startTime} 开始计算。`}
              >
                <input type="checkbox" {...register("beforeStartNotCount")} />
              </ToggleCard>
              <ToggleCard
                title="周末加班"
                description={`普通周末按 ${standardHours} 小时封顶统计，迟到和午休会扣减。`}
                highlight
              >
                <input type="checkbox" {...register("weekendEnabled")} />
              </ToggleCard>
              <ToggleCard
                title="节假日统计"
                description="用于法定节假日口径，和普通双休周末分开控制。"
              >
                <input type="checkbox" {...register("holidayEnabled")} />
              </ToggleCard>
            </div>
          </FormSection>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-6">
            <Button type="button" variant="secondary" onClick={() => reset(defaultWorkRule)}>
              恢复系统默认模板
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4" /> 保存并重新计算
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
