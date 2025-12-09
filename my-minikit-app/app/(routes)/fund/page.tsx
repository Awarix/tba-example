"use client";

import { DepositFlow } from "@/components/funding/DepositFlow";
import { BalanceDisplay } from "@/components/funding/BalanceDisplay";

export default function FundPage() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-20 max-w-lg mx-auto">
      {/* Balances overview */}
      <BalanceDisplay />

      {/* Deposit flow */}
      <DepositFlow />

      {/* Info section */}
      <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
          How Funding Works
        </h3>
        <ol className="text-sm text-[var(--color-text-secondary)] space-y-2 list-decimal list-inside">
          <li>USDC on Base is swapped to USDHL on HyperEVM</li>
          <li>USDHL is transferred to your Hyperliquid trading wallet</li>
          <li>Ready to trade perpetuals and spot markets!</li>
        </ol>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-center text-[var(--color-text-muted)]">
        Trading involves risk. Only trade with funds you can afford to lose.
      </p>
    </div>
  );
}

