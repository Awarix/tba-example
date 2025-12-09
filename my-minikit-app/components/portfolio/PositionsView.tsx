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
  const { positions, marginInfo, closePosition, isPlacingOrder, isLoading } =
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
        <CardTitle>Positions</CardTitle>
        <span className="text-sm text-text-secondary">{positions.length} open</span>
      </CardHeader>

      {/* Account summary */}
      <div className="mb-4 p-3 rounded-lg bg-background grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-text-muted">Account Value</p>
          <p className="font-mono font-semibold text-text-primary">
            ${formatPrice(marginInfo.accountValue)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Available</p>
          <p className="font-mono font-semibold text-text-primary">
            ${formatPrice(marginInfo.availableBalance)}
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 text-error text-sm">
          {error}
        </div>
      )}

      {/* Positions list */}
      {positions.length === 0 ? (
        <div className="py-8 text-center text-text-muted">No open positions</div>
      ) : (
        <div className="space-y-3">
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
                className={`p-3 rounded-lg bg-background border-l-2 ${isLong ? "border-l-long" : "border-l-short"}`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">
                      {position.symbol}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
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
                    <p className="font-mono font-semibold">{pnl.value}</p>
                    <p className="text-xs">{formatPercent(pnlPercent)}</p>
                  </div>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-text-muted text-xs">Size</p>
                    <p className="font-mono text-text-primary">
                      {formatSize(position.size)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs">Entry</p>
                    <p className="font-mono text-text-primary">
                      ${formatPrice(position.entryPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs">Mark</p>
                    <p className="font-mono text-text-primary">
                      ${formatPrice(position.markPrice)}
                    </p>
                  </div>
                </div>

                {/* Liquidation price */}
                {position.liquidationPrice && (
                  <div className="text-xs text-text-muted mb-3">
                    Liq: ${formatPrice(position.liquidationPrice)}
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
