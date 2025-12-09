"use client";

import { useState } from "react";
import { useHyperliquid } from "@/hooks/useHyperliquid";
import {
  formatPrice,
  formatSize,
  formatPnl,
  formatPercent,
  calculatePnlPercent,
} from "@/lib/hyperliquid/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

// Position type
interface Position {
  symbol: string;
  size: string;
  entryPrice: string;
  markPrice: string;
  unrealizedPnl: string;
  leverage: string;
  liquidationPrice: string | null;
  marginUsed: string;
}

export function PositionsView() {
  const { positions, closePosition, isPlacingOrder, isLoading } =
    useHyperliquid();
  const [closingSymbol, setClosingSymbol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClosePosition = async (symbol: string) => {
    setClosingSymbol(symbol);
    setError(null);

    try {
      await closePosition(symbol);
    } catch (err) {
      setError(`Failed to close ${symbol}: ${String(err)}`);
    } finally {
      setClosingSymbol(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse p-3 rounded-lg bg-background">
              <div className="h-5 bg-border rounded w-24 mb-2" />
              <div className="h-4 bg-border rounded w-32" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Positions</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">{positions.length} position{positions.length !== 1 ? 's' : ''}</span>
          {positions.length > 0 && (
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          )}
        </div>
      </CardHeader>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 text-error text-sm">
          {error}
        </div>
      )}

      {/* Positions list */}
      {positions.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-elevated flex items-center justify-center">
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-text-muted mb-2">No open positions</p>
          <p className="text-sm text-text-muted">Open a position from the Trade page to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {positions.map((position: Position) => {
            const isLong = parseFloat(position.size) > 0;
            const pnl = formatPnl(position.unrealizedPnl);
            const pnlPercent = calculatePnlPercent(
              position.unrealizedPnl,
              position.marginUsed
            );
            const isClosing = closingSymbol === position.symbol;

            return (
              <div
                key={position.symbol}
                className={`p-4 rounded-xl bg-background border-l-4 ${isLong ? "border-l-long shadow-lg shadow-long/5" : "border-l-short shadow-lg shadow-short/5"} hover:shadow-xl transition-shadow`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-text-primary">
                      {position.symbol}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-semibold ${
                        isLong
                          ? "bg-long/20 text-long"
                          : "bg-short/20 text-short"
                      }`}
                    >
                      {isLong ? "LONG" : "SHORT"} {position.leverage}x
                    </span>
                  </div>
                  <div
                    className={`text-right ${pnl.isPositive ? "text-long" : pnl.isNegative ? "text-short" : "text-text-secondary"}`}
                  >
                    <p className="text-lg font-mono font-bold">{pnl.value}</p>
                    <p className="text-xs font-semibold">{formatPercent(pnlPercent)}</p>
                  </div>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-surface rounded-lg p-2">
                    <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Size</p>
                    <p className="font-mono font-semibold text-text-primary">
                      {formatSize(position.size)}
                    </p>
                  </div>
                  <div className="bg-surface rounded-lg p-2">
                    <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Entry</p>
                    <p className="font-mono font-semibold text-text-primary">
                      ${formatPrice(position.entryPrice)}
                    </p>
                  </div>
                  <div className="bg-surface rounded-lg p-2">
                    <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Mark</p>
                    <p className="font-mono font-semibold text-text-primary">
                      ${formatPrice(position.markPrice)}
                    </p>
                  </div>
                </div>

                {/* Liquidation price */}
                {position.liquidationPrice && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20 mb-3">
                    <span className="text-warning text-sm">⚠️</span>
                    <span className="text-xs text-warning font-medium">
                      Liquidation: ${formatPrice(position.liquidationPrice)}
                    </span>
                  </div>
                )}

                {/* Close button */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => handleClosePosition(position.symbol)}
                  isLoading={isClosing}
                  disabled={isPlacingOrder}
                >
                  Close Position
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
