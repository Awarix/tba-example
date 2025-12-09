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
    <div className="flex flex-col gap-4 p-4 pb-20 max-w-lg mx-auto">
      {/* Account overview */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
        </CardHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Account Value
            </p>
            <p className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">
              {formatUsd(marginInfo.accountValue)}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Unrealized PnL
            </p>
            <p
              className={`text-2xl font-mono font-bold ${
                pnlFormatted.isPositive
                  ? "text-[var(--color-long)]"
                  : pnlFormatted.isNegative
                    ? "text-[var(--color-short)]"
                    : "text-[var(--color-text-primary)]"
              }`}
            >
              {pnlFormatted.value}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--color-border)] grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Margin Used
            </p>
            <p className="font-mono text-[var(--color-text-primary)]">
              {formatUsd(marginInfo.totalMarginUsed)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Available
            </p>
            <p className="font-mono text-[var(--color-text-primary)]">
              {formatUsd(marginInfo.availableBalance)}
            </p>
          </div>
        </div>
      </Card>

      {/* Balances */}
      <BalanceDisplay />

      {/* Positions */}
      <PositionsView />
    </div>
  );
}
