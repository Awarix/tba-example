"use client";

import { useState } from "react";

export type DrawingTool = "cursor" | "line" | "hline" | "rectangle" | "fibonacci" | "measure";

interface ChartToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onFullscreen?: () => void;
}

const TOOLS: { tool: DrawingTool; icon: React.ReactNode; label: string }[] = [
  {
    tool: "cursor",
    label: "Cursor",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.64 21.97C13.14 22.21 12.54 22 12.31 21.5L10.13 16.76L7.62 18.78C7.45 18.92 7.24 19 7.02 19C6.55 19 6.16 18.61 6.16 18.14V5.51C6.16 5.04 6.55 4.65 7.02 4.65C7.24 4.65 7.45 4.73 7.62 4.87L18.45 14.24C18.78 14.54 18.83 15.04 18.54 15.37C18.38 15.55 18.15 15.66 17.91 15.68L14.25 16L16.43 20.75C16.67 21.25 16.46 21.85 15.96 22.08L13.64 21.97Z" />
      </svg>
    ),
  },
  {
    tool: "line",
    label: "Trend Line",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20L20 4" />
      </svg>
    ),
  },
  {
    tool: "hline",
    label: "Horizontal Line",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12h16" />
      </svg>
    ),
  },
  {
    tool: "rectangle",
    label: "Rectangle",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="6" width="16" height="12" rx="1" />
      </svg>
    ),
  },
  {
    tool: "fibonacci",
    label: "Fibonacci",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4v16M4 4h4M4 8h8M4 12h12M4 16h16M4 20h4" />
      </svg>
    ),
  },
  {
    tool: "measure",
    label: "Measure",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4l16 16M4 4v5M4 4h5" />
      </svg>
    ),
  },
];

/**
 * Vertical toolbar for chart drawing tools
 * Positioned on left edge of chart
 */
export function ChartToolbar({ activeTool, onToolChange, onFullscreen }: ChartToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
      {/* Toggle expand button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-2 rounded-lg bg-surface/90 backdrop-blur-sm border border-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {/* Tool buttons */}
      {isExpanded && (
        <div className="flex flex-col gap-1 p-1 rounded-lg bg-surface/90 backdrop-blur-sm border border-surface-elevated">
          {TOOLS.map(({ tool, icon, label }) => (
            <button
              key={tool}
              onClick={() => onToolChange(tool)}
              className={`p-2 rounded-md transition-colors ${
                activeTool === tool
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-background"
              }`}
              title={label}
            >
              {icon}
            </button>
          ))}

          {/* Divider */}
          <div className="h-px bg-surface-elevated my-1" />

          {/* Fullscreen button */}
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
              title="Fullscreen"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ChartToolbar;
