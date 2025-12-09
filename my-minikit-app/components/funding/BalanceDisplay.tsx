"use client";

import { useEffect, useState } from "react";
import { useFundHL, type FundingBalances } from "@/hooks/useFundHL";
import { formatUsd } from "@/lib/hyperliquid/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

export function BalanceDisplay() {
  const { getBalances, hlPerpMargin } = useFundHL();
  const [balances, setBalances] = useState<FundingBalances | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      setIsLoading(true);
      const result = await getBalances();
      setBalances(result);
      setIsLoading(false);
    };

    fetchBalances();
    // Refresh every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [getBalances]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balances</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-border rounded w-24 mb-1" />
              <div className="h-6 bg-border rounded w-32" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Balances</CardTitle>
      </CardHeader>
      <div className="space-y-3">
        {/* Base USDC */}
        <div className="p-4 rounded-xl bg-background border border-surface-elevated hover:border-accent/30 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Base Chain</p>
                <p className="text-sm font-semibold text-text-primary">USDC</p>
              </div>
            </div>
            <p className="text-xl font-mono font-bold text-text-primary">
              {formatUsd(balances?.baseUsdc ?? "0")}
            </p>
          </div>
        </div>

        {/* HyperEVM USDHL */}
        <div className="p-4 rounded-xl bg-background border border-surface-elevated hover:border-accent/30 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">HyperEVM</p>
                <p className="text-sm font-semibold text-text-primary">USDHL</p>
              </div>
            </div>
            <p className="text-xl font-mono font-bold text-text-primary">
              {formatUsd(balances?.hyperEvmUsdhl ?? "0")}
            </p>
          </div>
        </div>

        {/* HL Trading Margin - Highlighted */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border-2 border-accent/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <span className="text-lg">🎯</span>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Hyperliquid</p>
                <p className="text-sm font-semibold text-text-primary">Trading Margin</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-mono font-bold text-text-primary">
                {formatUsd(hlPerpMargin)}
              </p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
