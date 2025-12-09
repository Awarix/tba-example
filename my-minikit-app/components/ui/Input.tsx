"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, suffix, className = "", ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-text-secondary">{label}</label>}
      <div className="relative">
        <input
          ref={ref}
          className={`
            w-full bg-background border border-border
            rounded-lg px-3 py-2 text-text-primary
            font-mono text-base
            placeholder:text-text-muted
            focus:outline-none focus:border-accent
            transition-colors duration-150
            ${suffix ? "pr-12" : ""}
            ${error ? "border-error" : ""}
            ${className}
          `}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
            {suffix}
          </span>
        )}
      </div>
      {error && <span className="text-sm text-error">{error}</span>}
    </div>
  );
});
