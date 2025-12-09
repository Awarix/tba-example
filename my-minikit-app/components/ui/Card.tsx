"use client";

import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "default", className = "", children, ...props },
  ref
) {
  const variants = {
    default: "bg-[var(--color-surface)] border-[var(--color-border)]",
    elevated:
      "bg-[var(--color-surface-elevated)] border-[var(--color-border)]",
  };

  return (
    <div
      ref={ref}
      className={`border rounded-xl p-4 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ className = "", children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-between mb-4 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  function CardTitle({ className = "", children, ...props }, ref) {
    return (
      <h3
        ref={ref}
        className={`text-lg font-semibold text-[var(--color-text-primary)] ${className}`}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

