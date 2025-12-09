"use client";

import { useState } from "react";
import { useFundHL, getBridgeUrl, getHyperUnitUrl } from "@/hooks/useFundHL";
import { useOpenUrl } from "@coinbase/onchainkit/minikit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

export function DepositFlow() {
  const {
    fundingState,
    transferToHLWallet,
    oneClickFund,
    reset,
    hlPerpMargin,
  } = useFundHL();
  const openUrl = useOpenUrl();

  const [amount, setAmount] = useState("");
  const [showManualBridge, setShowManualBridge] = useState(false);

  const handleOneClickFund = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      await oneClickFund(amount);
    } catch (error) {
      // Error is handled in the hook and shown via fundingState
      console.error("Funding error:", error);
    }
  };

  const handleTransferOnly = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      await transferToHLWallet(amount, true);
    } catch (error) {
      console.error("Transfer error:", error);
    }
  };

  const handleOpenBridge = () => {
    openUrl(getBridgeUrl());
  };

  const handleOpenHyperUnit = () => {
    openUrl(getHyperUnitUrl());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit to Hyperliquid</CardTitle>
      </CardHeader>

      {/* Current margin display */}
      <div className="mb-4 p-3 rounded-lg bg-[var(--color-background)]">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Current Trading Margin
        </p>
        <p className="text-2xl font-mono font-semibold text-[var(--color-text-primary)]">
          ${parseFloat(hlPerpMargin).toFixed(2)}
        </p>
      </div>

      {/* Amount input */}
      <div className="mb-4">
        <Input
          type="number"
          label="Amount (USDC)"
          placeholder="100"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          suffix="USDC"
        />
      </div>

      {/* Status message */}
      {fundingState.step !== "idle" && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            fundingState.step === "error"
              ? "bg-[var(--color-error)]/10 text-[var(--color-error)]"
              : fundingState.step === "complete"
                ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
          }`}
        >
          {fundingState.step === "swapping" && "Swapping USDC → USDHL..."}
          {fundingState.step === "transferring" &&
            "Transferring to HL wallet..."}
          {fundingState.step === "complete" && "Deposit complete!"}
          {fundingState.step === "error" && fundingState.error}
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        {/* One-click fund (when cross-chain is ready) */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleOneClickFund}
          isLoading={
            fundingState.step === "swapping" ||
            fundingState.step === "transferring"
          }
          disabled={!amount || parseFloat(amount) <= 0}
        >
          Fund ${amount || "0"} → HL Trading
        </Button>

        {/* Transfer only (for users who already have USDHL) */}
        <Button
          variant="secondary"
          size="md"
          className="w-full"
          onClick={handleTransferOnly}
          isLoading={fundingState.step === "transferring"}
          disabled={!amount || parseFloat(amount) <= 0}
        >
          Transfer USDHL → Perp Wallet
        </Button>

        {/* Manual bridge options */}
        <div className="pt-3 border-t border-[var(--color-border)]">
          <button
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-2 flex items-center gap-1"
            onClick={() => setShowManualBridge(!showManualBridge)}
          >
            {showManualBridge ? "▼" : "▶"} Manual Bridge Options
          </button>

          {showManualBridge && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={handleOpenBridge}
              >
                🌉 Hyperliquid Bridge
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={handleOpenHyperUnit}
              >
                💱 HyperUnit (Fiat → Crypto)
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reset button if error */}
      {fundingState.step === "error" && (
        <Button variant="ghost" size="sm" className="mt-4 w-full" onClick={reset}>
          Try Again
        </Button>
      )}
    </Card>
  );
}

