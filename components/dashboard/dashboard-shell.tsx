"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bot,
  CalendarDays,
  CalendarClock,
  FileSpreadsheet,
  Gauge,
  KeyRound,
  LogOut,
  Settings2,
  Table2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShareOvertimeButton } from "@/components/dashboard/share-overtime-button";
import type { AuthUser } from "@/lib/auth/session";

const navItems = [
  { href: "/dashboard", label: "统计看板", icon: Gauge },
  { href: "/dashboard/calendar", label: "月历排班", icon: CalendarDays },
  { href: "/dashboard/records", label: "打卡记录", icon: Table2 },
  { href: "/dashboard/import", label: "AI 导入中心", icon: FileSpreadsheet },
  { href: "/dashboard/reports", label: "月报", icon: CalendarClock },
  { href: "/dashboard/rules", label: "规则", icon: Settings2 },
  { href: "/dashboard/ai", label: "AI 分析", icon: Bot },
  { href: "/dashboard/account", label: "账号安全", icon: KeyRound },
];

export function DashboardShell({ children, user }: { children: React.ReactNode; user: AuthUser }) {
  const pathname = usePathname();
  const avatarSeed = getInitialAvatarSeed(user);
  const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(avatarSeed)}`;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#070b12] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="relative flex h-full min-h-0">
        <aside className="hidden h-dvh w-72 flex-none overflow-y-auto border-r border-white/10 bg-slate-950/70 px-5 py-6 backdrop-blur-xl lg:block">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-slate-950 ring-1 ring-cyan-200/30">
              <Image src="/icon.svg" alt="" width={40} height={40} aria-hidden="true" priority />
            </div>
            <div>
              <p className="font-semibold text-white">Overtime Tracker</p>
              <p className="text-xs text-slate-500">智能加班统计平台</p>
            </div>
          </Link>

          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-white/12 text-white"
                      : "text-slate-400 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex h-dvh min-w-0 flex-1 flex-col overflow-y-auto">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-[#070b12]/82 px-4 py-4 backdrop-blur-xl md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
                  Workforce Analytics
                </p>
                <h1 className="mt-1 text-xl font-semibold text-white">加班统计工作台</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-2 md:flex">
                  <Image
                    src={avatarUrl}
                    alt={`${user.name} 的头像`}
                    width={28}
                    height={28}
                    unoptimized
                    className="h-7 w-7 shrink-0 rounded-full border border-white/10 bg-slate-900"
                  />
                  <div className="min-w-0 text-right">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/dashboard/import">导入数据</Link>
                </Button>
                <ShareOvertimeButton />
                <Button asChild size="sm">
                  <Link href="/dashboard/reports">生成月报</Link>
                </Button>
                <Button variant="ghost" size="icon" title="退出登录" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>
          <div className="min-h-0 px-4 py-6 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function getInitialAvatarSeed(user: AuthUser) {
  const source = (user.name || user.email).trim();
  return Array.from(source).slice(0, 2).join("") || "OT";
}
