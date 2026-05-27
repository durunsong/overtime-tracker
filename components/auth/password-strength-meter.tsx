import { CheckCircle2, Circle } from "lucide-react";
import { evaluatePasswordStrength, passwordPolicyDescription } from "@/lib/auth/password-policy";
import { cn } from "@/lib/utils";

const toneClass = {
  empty: { bar: "bg-slate-700", label: "text-slate-400" },
  weak: { bar: "bg-rose-400", label: "text-rose-300" },
  fair: { bar: "bg-amber-300", label: "text-amber-200" },
  good: { bar: "bg-emerald-300", label: "text-emerald-200" },
  strong: { bar: "bg-cyan-300", label: "text-cyan-100" },
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = evaluatePasswordStrength(password);

  return (
    <div className="rounded-md border border-white/10 bg-slate-950/48 p-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-300">密码强度</span>
        <span className={cn("font-semibold", toneClass[strength.tone].label)}>
          {strength.label}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full transition-all duration-300", toneClass[strength.tone].bar)}
          style={{ width: `${strength.percent}%` }}
        />
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{passwordPolicyDescription}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {strength.rules.map((rule) => {
          const Icon = rule.passed ? CheckCircle2 : Circle;
          return (
            <div
              key={rule.id}
              className={cn(
                "flex items-center gap-1.5 text-xs transition",
                rule.passed ? "text-emerald-200" : "text-slate-500",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {rule.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
