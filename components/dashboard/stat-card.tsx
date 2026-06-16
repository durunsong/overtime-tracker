import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  helper,
  extra,
  icon: Icon,
  tone = "cyan",
}: {
  title: string;
  value: string;
  helper: string;
  extra?: string;
  icon: LucideIcon;
  tone?: "cyan" | "emerald" | "amber" | "rose";
}) {
  const toneClass = {
    cyan: "text-cyan-200 bg-cyan-300/10",
    emerald: "text-emerald-200 bg-emerald-300/10",
    amber: "text-amber-200 bg-amber-300/10",
    rose: "text-rose-200 bg-rose-300/10",
  }[tone];

  return (
    <Card className="p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{helper}</p>
          {extra ? <p className="mt-1 text-xs text-slate-500">{extra}</p> : null}
        </div>
        <div className={cn("rounded-md p-2.5", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
