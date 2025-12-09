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
      {label && (
        <label className="text-sm text-[var(--color-text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          className={`
            w-full bg-[var(--color-background)] border border-[var(--color-border)]
            rounded-lg px-3 py-2 text-[var(--color-text-primary)]
            font-mono text-base
            placeholder:text-[var(--color-text-muted)]
            focus:outline-none focus:border-[var(--color-accent)]
            transition-colors duration-150
            ${suffix ? "pr-12" : ""}
            ${error ? "border-[var(--color-error)]" : ""}
            ${className}
          `}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <span className="text-sm text-[var(--color-error)]">{error}</span>
      )}
    </div>
  );
});

