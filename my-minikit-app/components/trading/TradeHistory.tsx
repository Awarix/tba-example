"use client";

import { useState } from "react";
import { formatPrice, formatUsd } from "@/lib/hyperliquid/utils";

// Mock type for trade history (will be replaced with actual DB type)
interface Trade {
  id: string;
  pair: string;
  side: "buy" | "sell";
  size: string;
  price: string;
  value: string;
  fees: string;
  pnl?: string;
  timestamp: number;
  status: "filled" | "cancelled";
}

interface TradeHistoryProps {
  trades?: Trade[];
  isLoading?: boolean;
}

/**
 * Trade history list showing executed trades
 */
export function TradeHistory({ trades = [], isLoading = false }: TradeHistoryProps) {
  const [filter, setFilter] = useState<"all" | "buy" | "sell">("all");

  const filteredTrades = trades.filter((t) => {
    if (filter === "all") return true;
    return t.side === filter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-surface-elevated">
        {(["all", "buy", "sell"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filter === f
                ? "bg-accent text-white"
                : "bg-background text-text-secondary hover:text-text-primary"
            }`}
          >
            {f === "all" ? "All" : f === "buy" ? "Longs" : "Shorts"}
          </button>
        ))}
      </div>

      {/* Trade list */}
      <div className="flex-1 overflow-auto">
        {filteredTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No trade history</p>
            <p className="text-xs text-text-muted mt-1">Your executed trades will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-elevated">
            {filteredTrades.map((trade) => (
              <TradeHistoryRow key={trade.id} trade={trade} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Single trade history row
 */
function TradeHistoryRow({ trade }: { trade: Trade }) {
  const isBuy = trade.side === "buy";
  const pnl = trade.pnl ? parseFloat(trade.pnl) : null;
  const isProfitable = pnl !== null && pnl > 0;

  return (
    <div className="p-3">
      <div className="flex items-start justify-between mb-1">
        {/* Trade info */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            isBuy ? "bg-long/10 text-long" : "bg-short/10 text-short"
          }`}>
            {isBuy ? "LONG" : "SHORT"}
          </span>
          <span className="font-semibold text-text-primary">{trade.pair}</span>
        </div>

        {/* PnL */}
        {pnl !== null && (
          <span className={`font-mono text-sm font-semibold ${
            isProfitable ? "text-long" : "text-short"
          }`}>
            {isProfitable ? "+" : ""}{formatUsd(pnl)}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-text-muted">Price</span>
          <p className="font-mono text-text-secondary">${formatPrice(trade.price)}</p>
        </div>
        <div>
          <span className="text-text-muted">Size</span>
          <p className="font-mono text-text-secondary">{parseFloat(trade.size).toFixed(4)}</p>
        </div>
        <div>
          <span className="text-text-muted">Value</span>
          <p className="font-mono text-text-secondary">{formatUsd(parseFloat(trade.value))}</p>
        </div>
      </div>

      {/* Timestamp and fees */}
      <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
        <span>{new Date(trade.timestamp).toLocaleString()}</span>
        <span>Fee: {formatUsd(parseFloat(trade.fees))}</span>
      </div>
    </div>
  );
}

export default TradeHistory;
