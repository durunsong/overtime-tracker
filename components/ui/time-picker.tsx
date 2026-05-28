"use client";

import * as React from "react";
import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

const hourOptions = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const minuteOptions = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
};

export function TimePicker({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "选择时间",
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const parsed = parseTime(value);
  const selectedHour = parsed?.hour ?? "09";
  const selectedMinute = parsed?.minute ?? "30";

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

  function selectPart(part: "hour" | "minute", nextValue: string) {
    const nextHour = part === "hour" ? nextValue : selectedHour;
    const nextMinute = part === "minute" ? nextValue : selectedMinute;
    onChange(`${nextHour}:${nextMinute}`);
  }

  return (
    <div ref={rootRef} className={cn("relative", open ? "z-[120]" : "z-0", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-white/12 bg-slate-950/60 px-3 text-sm text-white outline-none transition hover:border-cyan-200/45 hover:bg-white/8 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
      >
        <span className={cn("tabular-nums", value ? "text-white" : "text-slate-500")}>
          {parsed ? `${parsed.hour}:${parsed.minute}` : "选择时间"}
        </span>
        <Clock3 className="h-4 w-4 text-cyan-200/80" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[130] w-56 rounded-lg border border-cyan-200/20 bg-slate-950/96 p-3 text-white shadow-[0_22px_70px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">选择时间</div>
              <div className="text-xs text-slate-500">小时 / 分钟</div>
            </div>
            <div className="rounded-md bg-cyan-300 px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-950">
              {selectedHour}:{selectedMinute}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <TimeColumn
              label="时"
              options={hourOptions}
              value={selectedHour}
              onSelect={(nextValue) => selectPart("hour", nextValue)}
            />
            <TimeColumn
              label="分"
              options={minuteOptions}
              value={selectedMinute}
              onSelect={(nextValue) => selectPart("minute", nextValue)}
            />
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
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
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-cyan-200 transition hover:text-cyan-100"
            >
              完成
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TimeColumn({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  const activeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center" });
  }, [value]);

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-1">
      <div className="px-2 py-1 text-xs font-medium text-slate-500">{label}</div>
      <div className="max-h-48 space-y-1 overflow-y-auto pr-1 [scrollbar-color:rgba(103,232,249,0.45)_transparent] [scrollbar-width:thin]">
        {options.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              ref={active ? activeRef : undefined}
              type="button"
              onClick={() => onSelect(option)}
              className={cn(
                "h-8 w-full rounded-md text-sm font-medium tabular-nums transition",
                active
                  ? "bg-cyan-300 text-slate-950 shadow-[0_0_18px_rgba(103,232,249,0.28)]"
                  : "text-slate-200 hover:bg-white/10 hover:text-white",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return null;
  }

  return { hour: match[1], minute: match[2] };
}
