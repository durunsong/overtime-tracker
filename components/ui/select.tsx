"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  "aria-label"?: string;
};

export function Select({
  value,
  onChange,
  options,
  className,
  "aria-label": ariaLabel = "选择选项",
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

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

  function selectOption(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative", open ? "z-[120]" : "z-0", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-white/12 bg-slate-950/60 px-3 text-sm font-medium text-white outline-none transition hover:border-cyan-200/45 hover:bg-white/8 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
      >
        <span className="truncate">{selected?.label ?? "请选择"}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-cyan-200/80 transition-transform",
            open ? "rotate-180" : "",
          )}
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[130] w-full min-w-40 overflow-hidden rounded-lg border border-cyan-200/20 bg-slate-950/96 p-1.5 text-white shadow-[0_22px_70px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl">
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1 [scrollbar-color:rgba(103,232,249,0.45)_transparent] [scrollbar-width:thin]">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectOption(option.value)}
                  className={cn(
                    "flex h-9 w-full items-center justify-between gap-2 rounded-md px-2.5 text-left text-sm font-medium transition",
                    active
                      ? "bg-cyan-300 text-slate-950 shadow-[0_0_20px_rgba(103,232,249,0.3)]"
                      : "text-slate-200 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {active ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
