import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getAuthenticatedAuthRedirectUrl } from "@/lib/auth/callback-url";
import { getCurrentUser } from "@/lib/auth/session";

const stats = [
  { label: "本月出勤", value: "26 天", tone: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100" },
  { label: "累计加班", value: "42.5h", tone: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" },
  { label: "待确认异常", value: "5 项", tone: "border-amber-300/25 bg-amber-300/10 text-amber-100" },
];

const capabilities = [
  { icon: FileSpreadsheet, title: "Excel 导入", desc: "识别字段、预览异常、确认后写入考勤记录。" },
  { icon: CalendarClock, title: "规则计算", desc: "按工作规则计算有效出勤、加班分钟和月度汇总。" },
  { icon: Sparkles, title: "AI 分析", desc: "基于真实数据生成月报总结与异常排查建议。" },
];

const timeline = ["登录账号", "导入考勤", "校验异常", "生成月报"];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [user, headerStore] = await Promise.all([getCurrentUser(), headers()]);
  const redirectUrl = getAuthenticatedAuthRedirectUrl(
    headerStore.get("x-auth-current-path"),
    headerStore.get("x-auth-callback-url"),
  );

  if (user && redirectUrl) {
    redirect(redirectUrl);
  }

  return (
    <main className="auth-shell relative min-h-screen overflow-hidden bg-[#05070d] px-5 py-6 text-white">
      <div className="auth-grid pointer-events-none fixed inset-0 opacity-65" />
      <div className="auth-scanline pointer-events-none fixed inset-0" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.22),transparent_62%)]" />
      <div className="pointer-events-none fixed bottom-[-10rem] left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-300 text-slate-950 shadow-[0_0_28px_rgba(103,232,249,0.32)] transition group-hover:scale-105">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-white">Overtime Tracker</p>
            <p className="text-xs text-slate-500">账号安全中心</p>
          </div>
        </Link>
        <Link className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-200/40 hover:text-cyan-100" href="/">
          返回首页
        </Link>
      </nav>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-10 py-10 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="hidden min-w-0 flex-col gap-7 xl:flex">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
              Secure attendance intelligence
            </p>
            <h1 className="max-w-none whitespace-nowrap text-4xl font-semibold leading-tight text-white 2xl:text-5xl">
              登录后继续管理加班、月报与 AI 分析
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300">
              把考勤导入、规则配置、异常排查、月报导出和 AI 总结放进同一个工作台。入口保持安全、清晰、可排障，适合真实办公场景反复使用。
            </p>
          </div>

          <div className="grid max-w-3xl grid-cols-3 gap-3">
            {stats.map((item) => (
              <div key={item.label} className={`rounded-md border p-4 shadow-[0_18px_60px_rgba(2,6,23,0.24)] backdrop-blur ${item.tone}`}>
                <p className="text-2xl font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-xs">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="grid max-w-3xl gap-3">
            {capabilities.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="auth-reveal flex items-start gap-4 rounded-md border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_70px_rgba(2,6,23,0.24)] backdrop-blur"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <span className="mt-0.5 rounded-md border border-cyan-300/20 bg-cyan-300/10 p-2 text-cyan-100">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid max-w-3xl gap-4 rounded-md border border-sky-300/20 bg-sky-300/[0.07] p-5 text-sm text-sky-50 shadow-[0_24px_80px_rgba(2,6,23,0.28)] backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="rounded-md border border-sky-200/20 bg-sky-200/10 p-2 text-sky-100">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="font-medium">密码强度与账号安全同步校验</p>
                <p className="mt-1 leading-6 text-sky-100/75">
                  注册、重置和修改密码统一要求至少 8 位，并且同时包含字母和数字。提交前会即时提示缺失项，接口侧也会再次校验。
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {timeline.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-md border border-white/10 bg-black/15 px-3 py-2 text-xs text-slate-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md [perspective:1200px] xl:mx-0">
          <div className="auth-card-3d relative overflow-hidden rounded-lg border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.13),rgba(255,255,255,0.07))] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
            <div className="absolute right-5 top-5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
              Secure
            </div>
            {children}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Activity className="h-3.5 w-3.5 text-cyan-200" />
            所有认证请求都会返回可排障的错误信息
          </div>
        </div>
      </section>
    </main>
  );
}
