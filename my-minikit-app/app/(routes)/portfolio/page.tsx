"use client";

import { useHyperliquid } from "@/hooks/useHyperliquid";
import { PositionsView } from "@/components/portfolio/PositionsView";
import { BalanceDisplay } from "@/components/funding/BalanceDisplay";
import { formatUsd, formatPnl } from "@/lib/hyperliquid/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

// Position type for calculations
interface Position {
  unrealizedPnl: string;
}

export default function PortfolioPage() {
  const { positions, marginInfo } = useHyperliquid();

  // Calculate total unrealized PnL
  const totalPnl = positions.reduce((sum: number, pos: Position) => {
    return sum + parseFloat(pos.unrealizedPnl || "0");
  }, 0);

  const pnlFormatted = formatPnl(totalPnl);

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Portfolio</h1>
          <p className="text-text-secondary">Monitor your positions and account performance</p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Account overview & Balances */}
          <div className="lg:col-span-1 space-y-6">
            {/* Account overview */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Account Overview</CardTitle>
              </CardHeader>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Account Value</p>
                  <p className="text-3xl font-mono font-bold text-text-primary">
                    {formatUsd(marginInfo.accountValue)}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Unrealized PnL</p>
                  <p
                    className={`text-3xl font-mono font-bold ${
                      pnlFormatted.isPositive
                        ? "text-long"
                        : pnlFormatted.isNegative
                          ? "text-short"
                          : "text-text-primary"
                    }`}
                  >
                    {pnlFormatted.value}
                  </p>
                </div>

                <div className="pt-4 border-t border-surface-elevated space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-text-muted">Margin Used</p>
                    <p className="font-mono font-semibold text-text-primary">
                      {formatUsd(marginInfo.totalMarginUsed)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-text-muted">Available</p>
                    <p className="font-mono font-semibold text-long">
                      {formatUsd(marginInfo.availableBalance)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Balances */}
            <BalanceDisplay />
          </div>

          {/* Right column: Positions */}
          <div className="lg:col-span-2">
            <PositionsView />
          </div>
        </div>
      </div>
    </div>
  );
}
