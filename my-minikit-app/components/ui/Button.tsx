"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "long" | "short" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) {
    const baseStyles =
      "font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-background)] disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-[var(--color-accent)] text-white hover:opacity-90 focus:ring-[var(--color-accent)]",
      secondary:
        "bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-border)] focus:ring-[var(--color-border)]",
      long: "bg-[var(--color-long)] text-[var(--color-background)] hover:opacity-90 focus:ring-[var(--color-long)]",
      short:
        "bg-[var(--color-short)] text-white hover:opacity-90 focus:ring-[var(--color-short)]",
      ghost:
        "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] focus:ring-[var(--color-border)]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

