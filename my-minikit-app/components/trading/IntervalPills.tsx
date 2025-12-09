"use client";

import type { CandleInterval } from "@/store/api/hyperliquidApi";

interface IntervalPillsProps {
  interval: CandleInterval;
  onIntervalChange: (interval: CandleInterval) => void;
}

const INTERVALS: { value: CandleInterval; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
];

/**
 * Time interval selector pills
 * Compact horizontal layout for mobile
 */
export function IntervalPills({ interval, onIntervalChange }: IntervalPillsProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-surface border-b border-surface-elevated">
      {/* Interval pills */}
      <div className="flex items-center gap-1">
        {INTERVALS.map((int) => (
          <button
            key={int.value}
            onClick={() => onIntervalChange(int.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              interval === int.value
                ? "bg-accent text-white"
                : "bg-background text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
            }`}
          >
            {int.label}
          </button>
        ))}
      </div>

      {/* Chart type indicator */}
      <div className="flex items-center gap-2">
        <button className="p-1.5 rounded-md bg-background text-text-secondary hover:text-text-primary transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 4h6v16H9V4zm-5 8h4v8H4v-8zm16 4h-4v4h4v-4z" />
          </svg>
        </button>
        <button className="p-1.5 rounded-md bg-background text-text-secondary hover:text-text-primary transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h4l3-9 4 18 3-9h4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default IntervalPills;
