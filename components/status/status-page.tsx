import Link from "next/link";
import { ArrowLeft, BarChart3, Home, LockKeyhole, Radar, SearchX, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StatusPageProps = {
  code: "403" | "404";
  eyebrow: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

const statusConfig = {
  "403": {
    icon: ShieldAlert,
    glow: "from-rose-500/30 via-amber-300/18 to-cyan-300/10",
    badge: "border-rose-300/25 bg-rose-300/10 text-rose-100",
  },
  "404": {
    icon: SearchX,
    glow: "from-cyan-300/28 via-sky-400/16 to-emerald-300/10",
    badge: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  },
};

export function StatusPage({
  code,
  eyebrow,
  title,
  description,
  primaryHref = "/dashboard",
  primaryLabel = "返回工作台",
  secondaryHref = "/",
  secondaryLabel = "回到首页",
}: StatusPageProps) {
  const config = statusConfig[code];
  const Icon = config.icon;

  return (
    <main className="status-scene relative min-h-dvh overflow-hidden bg-[#05070d] text-white">
      <div className="status-grid pointer-events-none absolute inset-0" />
      <div className={cn("pointer-events-none absolute inset-x-0 top-[-18rem] h-[42rem] bg-[radial-gradient(ellipse_at_top,rgba(103,232,249,0.32),rgba(14,165,233,0.14),transparent_68%)] blur-3xl", config.glow)} />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />

      <section className="relative z-10 mx-auto grid min-h-dvh max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1fr)] lg:px-10">
        <div className="space-y-7">
          <Link href="/" className="inline-flex items-center gap-3 text-sm text-slate-300 transition hover:text-cyan-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-300 text-slate-950 shadow-[0_0_28px_rgba(103,232,249,0.35)]">
              <BarChart3 className="h-5 w-5" />
            </span>
            Overtime Tracker
          </Link>

          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-[0.32em] text-cyan-200/70">{eyebrow}</p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-6xl">{title}</h1>
            <p className="max-w-xl text-base leading-8 text-slate-300">{description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={primaryHref}>
                <Home className="h-4 w-4" />
                {primaryLabel}
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={secondaryHref}>
                <ArrowLeft className="h-4 w-4" />
                {secondaryLabel}
              </Link>
            </Button>
          </div>
        </div>

        <div className="status-panel relative mx-auto aspect-square w-full max-w-[34rem]">
          <div className="status-orbit status-orbit-a" />
          <div className="status-orbit status-orbit-b" />
          <div className="status-orbit status-orbit-c" />
          <div className="status-sweep" />
          <div className="status-core">
            <span className={cn("mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", config.badge)}>
              <Icon className="h-3.5 w-3.5" />
              状态码 {code}
            </span>
            <p className="status-code font-mono text-[7rem] font-semibold leading-none tracking-normal sm:text-[9rem]">
              {code}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {code === "403" ? "权限校验没有通过，当前账号无法继续访问该资源。" : "目标路径没有匹配到可用页面，导航信号已重新校准。"}
            </p>
          </div>
          <div className="status-chip left-4 top-12">
            <Radar className="h-4 w-4 text-cyan-100" />
            路由扫描中
          </div>
          <div className="status-chip bottom-16 right-0">
            <LockKeyhole className="h-4 w-4 text-amber-100" />
            访问边界已保护
          </div>
        </div>
      </section>
    </main>
  );
}
