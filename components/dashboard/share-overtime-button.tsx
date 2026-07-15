"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getCurrentMonth } from "@/lib/date/month";
import type { ApiResponse } from "@/types/api";

type ShareResponse = {
  token: string;
  url: string;
};

const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const month = String(index + 1).padStart(2, "0");
  return { month, label: `${index + 1}月` };
});

export function ShareOvertimeButton() {
  const currentMonth = getCurrentMonth();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(currentMonth);
  const [viewYear, setViewYear] = useState(() => Number(currentMonth.slice(0, 4)));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, open]);

  function openMonthDialog() {
    setViewYear(Number(month.slice(0, 4)));
    setOpen(true);
  }

  async function shareOvertime() {
    setLoading(true);
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      const payload = (await response.json()) as ApiResponse<ShareResponse>;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "生成分享链接失败");
      }

      try {
        await navigator.clipboard.writeText(payload.data.url);
        toast.success("分享链接已复制", {
          description: `已生成 ${formatMonthLabel(month)} 的免登录数据快照。`,
        });
      } catch {
        window.prompt("分享链接已生成，请复制后发送给对方", payload.data.url);
      }
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "生成分享链接失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={openMonthDialog} disabled={loading}>
        <Share2 className="h-4 w-4" />
        分享我的加班数据
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-month-title"
          onClick={() => !loading && setOpen(false)}
        >
          <form
            className="w-full max-w-md rounded-xl border border-white/12 bg-slate-950 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            onSubmit={(event) => {
              event.preventDefault();
              void shareOvertime();
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="share-month-title" className="flex items-center gap-2 text-base font-semibold text-white">
                  <CalendarDays className="h-4 w-4 text-cyan-200" />
                  选择分享月份
                </h2>
                <p className="mt-1 text-sm text-slate-400">分享链接会保存所选月份当时的数据快照。</p>
              </div>
              <button
                type="button"
                aria-label="关闭月份选择"
                disabled={loading}
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                aria-label="上一年"
                disabled={loading}
                onClick={() => setViewYear((year) => year - 1)}
                className="rounded-md p-2 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-semibold tabular-nums text-cyan-50">{viewYear}年</span>
              <button
                type="button"
                aria-label="下一年"
                disabled={loading}
                onClick={() => setViewYear((year) => year + 1)}
                className="rounded-md p-2 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <fieldset className="mt-3 grid grid-cols-3 gap-2">
              <legend className="sr-only">分享月份</legend>
              {monthOptions.map((option) => {
                const value = `${viewYear}-${option.month}`;
                const selected = month === value;
                return (
                  <label
                    key={option.month}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition ${
                      selected
                        ? "border-cyan-300/60 bg-cyan-300/12 text-cyan-50"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="share-month"
                      value={value}
                      checked={selected}
                      autoFocus={selected}
                      disabled={loading}
                      onChange={(event) => setMonth(event.target.value)}
                      className="h-4 w-4 accent-cyan-300"
                    />
                    {option.label}
                  </label>
                );
              })}
            </fieldset>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-xs text-slate-400">
                已选择 <span className="font-medium text-slate-200">{formatMonthLabel(month)}</span>
              </p>
              <Button type="submit" size="sm" disabled={loading}>
                <Share2 className="h-4 w-4" />
                {loading ? "生成中" : "生成并复制"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-");
  return `${year}年${Number(monthNumber)}月`;
}
