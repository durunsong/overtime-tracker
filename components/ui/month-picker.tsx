"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1).padStart(2, "0"),
  label: `${index + 1}月`,
}));

type MonthPickerProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  allowClear?: boolean;
  "aria-label"?: string;
};

export function MonthPicker({
  value,
  onChange,
  className,
  allowClear = false,
  "aria-label": ariaLabel = "选择月份",
}: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(() => getYear(value));
  const rootRef = React.useRef<HTMLDivElement>(null);
  const selected = parseMonth(value);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectMonth(month: string) {
    onChange(`${viewYear}-${month}`);
    setOpen(false);
  }

  function toggleOpen() {
    setOpen((current) => {
      if (!current) {
        setViewYear(getYear(value));
      }
      return !current;
    });
  }

  function selectCurrentMonth() {
    const now = new Date();
    const currentYear = now.getFullYear();
    setViewYear(currentYear);
    onChange(`${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative min-w-[9.75rem]", open ? "z-[120]" : "z-0", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={toggleOpen}
        className="flex h-10 w-full items-center justify-between gap-3 rounded-md border border-white/12 bg-slate-950/60 px-3 text-sm text-white outline-none transition hover:border-cyan-200/45 hover:bg-white/8 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
      >
        <span className={cn("whitespace-nowrap font-semibold tabular-nums", value ? "text-white" : "text-slate-500")}>
          {selected ? `${selected.year}年 ${selected.month}月` : "选择月份"}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-cyan-200/80" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[130] w-64 rounded-lg border border-cyan-200/20 bg-slate-950/96 p-3 text-white shadow-[0_22px_70px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((year) => year - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="上一年"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="rounded-md border border-white/10 bg-white/[0.06] px-4 py-1.5 text-sm font-semibold tabular-nums text-cyan-50">
              {viewYear}
            </div>
            <button
              type="button"
              onClick={() => setViewYear((year) => year + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="下一年"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {monthOptions.map((month) => {
              const active = selected?.year === viewYear && selected.month === Number(month.value);
              return (
                <button
                  key={month.value}
                  type="button"
                  onClick={() => selectMonth(month.value)}
                  className={cn(
                    "h-9 rounded-md text-sm font-medium transition",
                    active
                      ? "bg-cyan-300 text-slate-950 shadow-[0_0_22px_rgba(103,232,249,0.35)]"
                      : "text-slate-200 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {month.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            {allowClear ? (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-xs font-medium text-slate-400 transition hover:text-white"
              >
                清除
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={selectCurrentMonth}
              className="text-xs font-medium text-cyan-200 transition hover:text-cyan-100"
            >
              本月
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getYear(value: string) {
  return parseMonth(value)?.year ?? new Date().getFullYear();
}

function parseMonth(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}
