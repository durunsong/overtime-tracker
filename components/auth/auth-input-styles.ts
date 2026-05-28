import { cn } from "@/lib/utils";

export function passwordInputClassName(className?: string) {
  return cn(
    "h-10 w-full rounded-md border border-white/12 bg-slate-950/60 px-3 pr-12 text-sm text-white outline-none transition [color-scheme:dark] placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50",
    className,
  );
}

export function passwordToggleButtonClassName() {
  return "absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-slate-500 transition hover:bg-white/8 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/25";
}
