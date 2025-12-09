"use client";

import { useAllMidsQuery } from "@/store/api/hyperliquidApi";
import { formatPrice } from "@/lib/hyperliquid/utils";

interface ChartHeaderProps {
  coin: string;
  onCoinClick: () => void;
  prevClose?: string | null;
}

/**
 * Compact header showing asset, price, and 24h change
 * Mobile-first design for DEXScreener-style layout
 */
export function ChartHeader({ coin, onCoinClick, prevClose }: ChartHeaderProps) {
  const { data: prices } = useAllMidsQuery();
  
  const currentPrice = prices?.[coin];
  const priceNum = currentPrice ? parseFloat(currentPrice) : 0;
  const prevNum = prevClose ? parseFloat(prevClose) : priceNum;
  const change = prevNum > 0 ? ((priceNum - prevNum) / prevNum) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-surface border-b border-surface-elevated">
      {/* Left: Asset selector */}
      <button
        onClick={onCoinClick}
        className="flex items-center gap-2 px-2 py-1 rounded-lg bg-background hover:bg-surface-elevated transition-colors"
      >
        <span className="text-lg font-bold text-text-primary">{coin}</span>
        <svg
          className="w-4 h-4 text-text-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Center: Price and change */}
      <div className="flex items-center gap-3">
        <span className="text-lg font-mono font-bold text-text-primary">
          ${formatPrice(currentPrice ?? "0")}
        </span>
        <span
          className={`text-sm font-mono font-semibold px-2 py-0.5 rounded ${
            isPositive
              ? "text-long bg-long/10"
              : "text-short bg-short/10"
          }`}
        >
          {isPositive ? "+" : ""}{change.toFixed(2)}%
        </span>
      </div>

      {/* Right: Menu button */}
      <button className="p-2 rounded-lg hover:bg-surface-elevated transition-colors">
        <svg
          className="w-5 h-5 text-text-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>
    </div>
  );
}

export default ChartHeader;
