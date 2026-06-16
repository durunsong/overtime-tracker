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
            "hidden h-dvh flex-none flex-col border-r border-white/10 bg-slate-950/70 py-6 backdrop-blur-xl transition-[width,padding] duration-200 ease-out lg:flex",
            sidebarCollapsed ? "w-[4.75rem] px-3" : "w-72 px-5",
          )}
        >
          <div
            className={cn(
              "flex shrink-0 items-start",
              sidebarCollapsed ? "flex-col items-center gap-3" : "justify-between gap-2",
            )}
          >
            <Link
              href="/"
              className={cn(
                "flex min-w-0 items-center gap-3",
                sidebarCollapsed && "justify-center",
              )}
              title={sidebarCollapsed ? "Overtime Tracker" : undefined}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-950 ring-1 ring-cyan-200/30">
                <Image src="/icon.svg" alt="" width={40} height={40} aria-hidden="true" priority />
              </div>
              {!sidebarCollapsed ? (
                <div className="min-w-0">
                  <p className="font-semibold text-white">Overtime Tracker</p>
                  <p className="text-xs text-slate-500">智能加班统计平台</p>
                </div>
              ) : null}
            </Link>

            <SidebarToggleButton
              collapsed={sidebarCollapsed}
              onToggle={toggleSidebar}
              className={sidebarCollapsed ? "self-center" : "mt-0.5 shrink-0"}
            />
          </div>

          <nav className="mt-8 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-md py-2.5 text-sm transition",
                    sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3",
                    active
                      ? "bg-white/12 text-white"
                      : "text-slate-400 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed ? item.label : null}
                </Link>
              );
            })}
          </nav>

          {!sidebarCollapsed ? (
            <div className="mt-4 shrink-0 border-t border-white/10 pt-4">
              <p className="px-3 text-xs text-slate-500">版本 v{APP_VERSION}</p>
            </div>
          ) : null}
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
