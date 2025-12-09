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
        <CardTitle>Balances</CardTitle>
      </CardHeader>
      <div className="space-y-4">
        {/* Base USDC */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-text-secondary">Base USDC</p>
            <p className="text-lg font-mono text-text-primary">
              {formatUsd(balances?.baseUsdc ?? "0")}
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-blue-500" title="Base Chain" />
        </div>

        {/* HyperEVM USDHL */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-text-secondary">HyperEVM USDHL</p>
            <p className="text-lg font-mono text-text-primary">
              {formatUsd(balances?.hyperEvmUsdhl ?? "0")}
            </p>
          </div>
          <div
            className="w-2 h-2 rounded-full bg-emerald-500"
            title="HyperEVM"
          />
        </div>

        {/* HL Trading Margin */}
        <div className="flex justify-between items-center pt-3 border-t border-border">
          <div>
            <p className="text-sm text-text-secondary">HL Trading Margin</p>
            <p className="text-xl font-mono font-semibold text-text-primary">
              {formatUsd(hlPerpMargin)}
            </p>
          </div>
          <div className="px-2 py-0.5 rounded bg-accent text-xs font-medium">
            READY
          </div>
        </div>
      </div>
    </Card>
  );
}
