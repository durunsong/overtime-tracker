"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  CalendarDays,
  Clock3,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  Plus,
  ScanLine,
  Sparkles,
  UserRound,
  Wand2,
} from "lucide-react";
import type { AuthUser } from "@/lib/auth/session";

export const DEFAULT_LANDING_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4";

export function resolveLandingVideoUrl(value?: string) {
  return value?.trim() || DEFAULT_LANDING_VIDEO_URL;
}

const landingVideoUrl = resolveLandingVideoUrl(process.env.NEXT_PUBLIC_LANDING_VIDEO_URL);

export const LANDING_COPY = {
  brand: "Overtime Tracker",
  menuItems: [
    { label: "Excel 导入", href: "/dashboard/import" },
    { label: "统计看板", href: "/dashboard" },
    { label: "月报导出", href: "/dashboard/reports" },
  ],
  auth: {
    register: "创建账号",
    login: "登录",
    workspace: "进入工作台",
  },
  heroTitle: "让每一次加班",
  heroAccent: "都清晰可见",
  category: "智能加班统计平台",
  heroDescription:
    "导入 Excel 或考勤截图，自动计算每日加班、识别异常记录，并生成可追溯的月度统计与 AI 总结。",
  primaryAction: "开始统计",
  signedInPrimaryAction: "查看本月统计",
  capabilities: ["Excel 智能导入", "精准统计", "AI 月报"],
  principle: "PRODUCT PRINCIPLE",
  quote: "真正可靠的统计，始于每一次打卡都被认真看见。",
};

export function getLandingSessionCopy(user: AuthUser | null) {
  if (!user) {
    return {
      isAuthenticated: false,
      navActionLabel: LANDING_COPY.auth.login,
      navActionHref: "/auth/login",
      secondaryActionLabel: LANDING_COPY.auth.register,
      secondaryActionHref: "/auth/register",
      heroActionLabel: LANDING_COPY.primaryAction,
      heroActionHref: "/auth/register",
      helperText: LANDING_COPY.heroDescription,
      userLabel: null,
    };
  }

  return {
    isAuthenticated: true,
    navActionLabel: LANDING_COPY.auth.workspace,
    navActionHref: "/dashboard",
    secondaryActionLabel: "账号安全",
    secondaryActionHref: "/dashboard/account",
    heroActionLabel: LANDING_COPY.signedInPrimaryAction,
    heroActionHref: "/dashboard",
    helperText: `欢迎回来，${user.name || user.email}。本月趋势、异常记录和 AI 月报都已准备好。`,
    userLabel: user.name || user.email,
  };
}

const quickLinks = [
  { label: "导入打卡数据", href: "/dashboard/import", icon: FileSpreadsheet },
  { label: "查看加班趋势", href: "/dashboard", icon: BarChart3 },
  { label: "打开 AI 助手", href: "/dashboard/ai", icon: Bot },
];

export function LandingPage({ user = null }: { user?: AuthUser | null }) {
  const sessionCopy = getLandingSessionCopy(user);
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <main className="landing-shell relative min-h-screen overflow-x-hidden bg-black text-white">
      <div aria-hidden="true" className="absolute inset-0 z-0 bg-black" />
      {!videoFailed ? (
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover"
          src={landingVideoUrl}
          muted
          autoPlay
          loop
          playsInline
          preload="auto"
          onError={() => setVideoFailed(true)}
        />
      ) : (
        <div aria-hidden="true" className="landing-fallback absolute inset-0 z-0" />
      )}
      <div aria-hidden="true" className="absolute inset-0 z-[1] bg-black/35" />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2] bg-[linear-gradient(90deg,rgba(0,0,0,0.22),transparent_56%,rgba(0,0,0,0.18))]"
      />

      <div className="relative z-10 flex min-h-screen">
        <section className="relative flex min-h-[100svh] w-full flex-col p-4 lg:w-[52%] lg:p-6">
          <div aria-hidden="true" className="liquid-glass-strong absolute inset-4 rounded-3xl lg:inset-6" />

          <div className="relative z-10 flex min-h-[calc(100svh-2rem)] flex-col px-5 py-5 sm:px-8 sm:py-7 lg:min-h-[calc(100svh-3rem)] lg:px-10">
            <nav className="flex items-center justify-between gap-4">
              <Link
                href="/"
                className="flex min-w-0 items-center gap-3 transition-transform hover:scale-105 active:scale-95"
              >
                <span className="liquid-glass flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                  <Clock3 size={19} aria-hidden="true" />
                </span>
                <span className="truncate text-lg font-semibold tracking-[-0.04em] sm:text-2xl">
                  {LANDING_COPY.brand}
                </span>
              </Link>

              <details className="group relative">
                <summary className="liquid-glass flex list-none items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-white/80 transition-transform hover:scale-105 active:scale-95 [&::-webkit-details-marker]:hidden">
                  <Menu size={16} aria-hidden="true" />
                  <span>菜单</span>
                </summary>
                <div className="liquid-glass-strong absolute right-0 top-12 z-30 w-44 rounded-2xl p-2">
                  {LANDING_COPY.menuItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block rounded-xl px-3 py-2.5 text-sm text-white/70 transition-all hover:scale-[1.02] hover:bg-white/10 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            </nav>

            <div className="my-auto flex flex-col items-center py-10 text-center sm:py-12">
              <div className="liquid-glass mb-7 flex h-20 w-20 items-center justify-center rounded-[1.75rem] shadow-[0_22px_70px_rgba(0,0,0,0.18)]">
                <Clock3 size={38} strokeWidth={1.4} aria-hidden="true" />
              </div>

              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.32em] text-white/50">
                {LANDING_COPY.category}
              </p>
              <h1 className="max-w-2xl text-4xl font-medium leading-[0.98] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
                {LANDING_COPY.heroTitle}
                <span className="landing-serif mt-2 block font-medium text-white/80">
                  {LANDING_COPY.heroAccent}
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
                {sessionCopy.helperText}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={sessionCopy.heroActionHref}
                  className="liquid-glass-strong flex items-center gap-3 rounded-full py-2 pl-5 pr-2 text-sm font-medium transition-transform hover:scale-105 active:scale-95"
                >
                  <span>{sessionCopy.heroActionLabel}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                    <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </Link>
                <Link
                  href={sessionCopy.secondaryActionHref}
                  className="px-3 py-2 text-sm text-white/60 transition-all hover:scale-105 hover:text-white active:scale-95"
                >
                  {sessionCopy.secondaryActionLabel}
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {LANDING_COPY.capabilities.map((capability) => (
                  <span
                    key={capability}
                    className="liquid-glass rounded-full px-4 py-2 text-[11px] text-white/70"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>

            <blockquote className="mx-auto w-full max-w-lg pb-1 text-center">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/40">
                {LANDING_COPY.principle}
              </p>
              <p className="mt-3 text-sm leading-6 text-white/80 sm:text-base">
                “真正可靠的统计，始于
                <span className="landing-serif text-lg text-white">每一次打卡</span>
                都被认真看见。”
              </p>
              <footer className="mt-3 flex items-center justify-center gap-3 text-[9px] tracking-[0.24em] text-white/40">
                <span aria-hidden="true" className="h-px w-8 bg-white/25" />
                OVERTIME TRACKER
                <span aria-hidden="true" className="h-px w-8 bg-white/25" />
              </footer>
            </blockquote>
          </div>
        </section>

        <aside className="relative hidden min-h-screen w-[48%] flex-col p-6 pl-0 lg:flex">
          <div className="flex items-center justify-between gap-4">
            <div className="liquid-glass flex items-center gap-1 rounded-full p-1.5">
              {quickLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:scale-105 hover:text-white/80 active:scale-95"
                >
                  <item.icon size={15} aria-hidden="true" />
                </Link>
              ))}
              <Link
                href="/dashboard"
                aria-label="进入工作台"
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform hover:scale-105 active:scale-95"
              >
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={sessionCopy.secondaryActionHref}
                className="liquid-glass flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
                aria-label={sessionCopy.secondaryActionLabel}
              >
                <Sparkles size={18} aria-hidden="true" />
              </Link>
              <Link
                href={sessionCopy.navActionHref}
                className="liquid-glass flex items-center gap-2 rounded-full px-4 py-3 text-xs font-medium text-white/80 transition-transform hover:scale-105 active:scale-95"
              >
                {sessionCopy.userLabel ? <UserRound size={15} aria-hidden="true" /> : null}
                <span className="max-w-28 truncate">{sessionCopy.userLabel || sessionCopy.navActionLabel}</span>
              </Link>
            </div>
          </div>

          <div className="liquid-glass mt-8 w-60 rounded-3xl p-5">
            <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <LayoutDashboard size={15} aria-hidden="true" />
            </div>
            <h2 className="text-base font-medium tracking-[-0.02em]">进入你的工时空间</h2>
            <p className="mt-2 text-xs leading-5 text-white/50">
              从原始打卡到清晰月报，一条完整、可追溯的数据路径。
            </p>
          </div>

          <div className="liquid-glass mt-auto rounded-[2.5rem] p-3">
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/dashboard/import"
                className="liquid-glass group rounded-3xl p-5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                    <Wand2 size={17} aria-hidden="true" />
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/35">01</span>
                </div>
                <h3 className="mt-10 text-lg font-medium tracking-[-0.03em]">智能处理</h3>
                <p className="mt-2 text-xs leading-5 text-white/50">识别 Excel 与考勤截图，自动校验异常。</p>
              </Link>

              <Link
                href="/dashboard/calendar"
                className="liquid-glass group rounded-3xl p-5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                    <BookOpen size={17} aria-hidden="true" />
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/35">02</span>
                </div>
                <h3 className="mt-10 text-lg font-medium tracking-[-0.03em]">趋势档案</h3>
                <p className="mt-2 text-xs leading-5 text-white/50">按日历回看工时，让变化与异常有迹可循。</p>
              </Link>
            </div>

            <Link
              href="/dashboard/reports"
              className="liquid-glass mt-3 flex items-center gap-4 rounded-3xl p-3 transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="liquid-glass relative flex h-16 w-24 shrink-0 items-end justify-center gap-1 overflow-hidden rounded-2xl px-3 pb-3">
                {[38, 56, 44, 72, 52, 82, 66].map((height, index) => (
                  <span
                    key={`${height}-${index}`}
                    className="w-1.5 rounded-full bg-white/60"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium tracking-[-0.02em]">月度工时洞察</p>
                <p className="mt-1 text-xs leading-5 text-white/45">趋势、异常与 AI 总结，沉淀为可导出的月报。</p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Plus size={17} aria-hidden="true" />
              </span>
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-between px-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
            <span className="flex items-center gap-2"><ScanLine size={13} /> Data ready</span>
            <span className="flex items-center gap-2"><CalendarDays size={13} /> Monthly view</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
