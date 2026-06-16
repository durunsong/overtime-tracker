"use client";

import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore } from "react";
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
import { APP_VERSION } from "@/lib/app-meta";
import { Button } from "@/components/ui/button";
import { ShareOvertimeButton } from "@/components/dashboard/share-overtime-button";
import type { AuthUser } from "@/lib/auth/session";

const SIDEBAR_COLLAPSED_KEY = "ot-sidebar-collapsed";
const SIDEBAR_COLLAPSED_EVENT = "ot-sidebar-collapsed-change";

function subscribeSidebarCollapsed(onStoreChange: () => void) {
  window.addEventListener(SIDEBAR_COLLAPSED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(SIDEBAR_COLLAPSED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSidebarCollapsedSnapshot() {
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

function getSidebarCollapsedServerSnapshot() {
  return false;
}

function setSidebarCollapsedStorage(next: boolean) {
  window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
  window.dispatchEvent(new Event(SIDEBAR_COLLAPSED_EVENT));
}

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
  const sidebarCollapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot,
  );
  const avatarSeed = getInitialAvatarSeed(user);
  const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(avatarSeed)}`;

  function toggleSidebar() {
    setSidebarCollapsedStorage(!sidebarCollapsed);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#070b12] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="relative flex h-full min-h-0">
        <aside
          className={cn(
            "hidden h-dvh w-72 flex-none flex-col overflow-hidden border-r border-white/10 bg-slate-950/70 px-3 py-6 backdrop-blur-xl transition-[width] duration-300 ease-in-out lg:flex",
            sidebarCollapsed && "w-[4.75rem]",
          )}
        >
          <div className="relative flex h-10 shrink-0 items-center overflow-hidden">
            <Link
              href="/"
              className={cn(
                "flex min-w-0 items-center gap-3 overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out",
                sidebarCollapsed
                  ? "pointer-events-none max-w-0 opacity-0"
                  : "max-w-full flex-1 pr-10 opacity-100",
              )}
              tabIndex={sidebarCollapsed ? -1 : undefined}
              aria-hidden={sidebarCollapsed}
              title={sidebarCollapsed ? "Overtime Tracker" : undefined}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-950 ring-1 ring-cyan-200/30">
                <Image src="/icon.svg" alt="" width={40} height={40} aria-hidden="true" priority />
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="truncate whitespace-nowrap font-semibold text-white">Overtime Tracker</p>
                <p className="truncate whitespace-nowrap text-xs text-slate-500">智能加班统计平台</p>
              </div>
            </Link>

            <SidebarToggleButton
              collapsed={sidebarCollapsed}
              onToggle={toggleSidebar}
              className={cn(
                "absolute top-1/2 z-10 shrink-0 -translate-y-1/2 transition-[left,transform] duration-300 ease-in-out",
                sidebarCollapsed ? "left-1/2 -translate-x-1/2" : "left-[calc(100%-2rem)] translate-x-0",
              )}
            />
          </div>

          <nav className="mt-8 min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center overflow-hidden rounded-md py-2.5 text-sm transition-colors",
                    sidebarCollapsed ? "justify-center px-2" : "px-3",
                    active
                      ? "bg-white/12 text-white"
                      : "text-slate-400 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span
                    className={cn(
                      "block overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin-left] duration-300 ease-in-out",
                      sidebarCollapsed ? "ml-0 max-w-0 opacity-0" : "ml-3 max-w-[10rem] opacity-100",
                    )}
                    aria-hidden={sidebarCollapsed}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div
            className={cn(
              "mt-4 shrink-0 overflow-hidden border-white/10 transition-[max-height,opacity,border-color,margin-top,padding-top] duration-300 ease-in-out",
              sidebarCollapsed
                ? "max-h-0 border-t-0 opacity-0"
                : "max-h-12 border-t pt-4 opacity-100",
            )}
            aria-hidden={sidebarCollapsed}
          >
            <p className="truncate whitespace-nowrap px-3 text-xs text-slate-500">版本 v{APP_VERSION}</p>
          </div>
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
                  <div className="min-w-0 text-left">
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

function SidebarToggleButton({
  collapsed,
  onToggle,
  className,
}: {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
      aria-expanded={!collapsed}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-slate-400 transition hover:bg-white/8 hover:text-white",
        className,
      )}
    >
      <SidebarLayoutIcon />
    </button>
  );
}

function SidebarLayoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 18"
      className="h-[18px] w-[18px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1.5" y="1.5" width="15" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M6.5 1.5V16.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
