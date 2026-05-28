"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, disabled, readOnly, onChange, type = "text", ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    const [hasValue, setHasValue] = React.useState(() => Boolean(props.value ?? props.defaultValue));
    const canClear = !disabled && !readOnly && type !== "hidden" && hasValue;

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    React.useEffect(() => {
      if (props.value !== undefined) {
        setHasValue(String(props.value).length > 0);
      }
    }, [props.value]);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      setHasValue(event.target.value.length > 0);
      onChange?.(event);
    }

    function clearValue() {
      const input = innerRef.current;
      if (!input) {
        return;
      }
      const valueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      valueSetter?.call(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
      setHasValue(false);
    }

    return (
      <div className={cn("relative", className)}>
        <input
          ref={innerRef}
          type={type}
          disabled={disabled}
          readOnly={readOnly}
          onChange={handleChange}
          className={cn(
            "h-10 w-full rounded-md border border-white/12 bg-slate-950/60 px-3 text-sm text-white outline-none transition [color-scheme:dark] placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50",
            canClear ? "pr-10" : "",
          )}
          {...props}
        />
        {canClear ? (
          <button
            type="button"
            aria-label="清除输入内容"
            onClick={clearValue}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/25"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
