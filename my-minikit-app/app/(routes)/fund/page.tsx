"use client";

import { DepositFlow } from "@/components/funding/DepositFlow";
import { BalanceDisplay } from "@/components/funding/BalanceDisplay";
import { Card } from "@/components/ui/Card";

export default function FundPage() {
  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Fund Account</h1>
          <p className="text-text-secondary">Deposit funds to start trading on Hyperliquid</p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Balances */}
          <div className="space-y-6">
            <BalanceDisplay />

            {/* Info section */}
            <Card>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">ℹ️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    How Funding Works
                  </h3>
                  <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
                    <li>USDC on Base is swapped to USDHL on HyperEVM</li>
                    <li>USDHL is transferred to your Hyperliquid trading wallet</li>
                    <li>Ready to trade perpetuals and spot markets!</li>
                  </ol>
                </div>
              </div>
            </Card>

            {/* Security note */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🔒</span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    Security First
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Your private keys never leave your wallet. All transactions are signed securely through Base App.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right column: Deposit flow */}
          <div>
            <DepositFlow />
            
            {/* Disclaimer */}
            <p className="mt-6 text-xs text-center text-text-muted">
              Trading involves risk. Only trade with funds you can afford to lose.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
