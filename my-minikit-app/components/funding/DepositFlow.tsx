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
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">💸</span>
          Deposit Funds
        </CardTitle>
      </CardHeader>

      {/* Current margin display */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Current Trading Balance</p>
        <p className="text-3xl font-mono font-bold text-text-primary">
          ${parseFloat(hlPerpMargin).toFixed(2)}
        </p>
      </div>

      {/* Amount input */}
      <div className="mb-6">
        <Input
          type="number"
          label="Deposit Amount"
          placeholder="100.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          suffix="USDC"
        />
        {amount && parseFloat(amount) > 0 && (
          <p className="mt-2 text-sm text-text-muted">
            You will receive <span className="font-semibold text-text-primary">${amount}</span> in trading margin
          </p>
        )}
      </div>

      {/* Status message */}
      {fundingState.step !== "idle" && (
        <div
          className={`mb-6 p-4 rounded-xl border ${
            fundingState.step === "error"
              ? "bg-error/10 border-error/30 text-error"
              : fundingState.step === "complete"
                ? "bg-success/10 border-success/30 text-success"
                : "bg-accent/10 border-accent/30 text-accent"
          }`}
        >
          <div className="flex items-center gap-3">
            {fundingState.step === "swapping" && (
              <>
                <div className="animate-spin text-xl">⚡</div>
                <div>
                  <p className="font-semibold">Swapping funds...</p>
                  <p className="text-sm opacity-80">Converting USDC → USDHL</p>
                </div>
              </>
            )}
            {fundingState.step === "transferring" && (
              <>
                <div className="animate-pulse text-xl">📤</div>
                <div>
                  <p className="font-semibold">Transferring...</p>
                  <p className="text-sm opacity-80">Sending to HL wallet</p>
                </div>
              </>
            )}
            {fundingState.step === "complete" && (
              <>
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold">Deposit complete!</p>
                  <p className="text-sm opacity-80">Funds ready for trading</p>
                </div>
              </>
            )}
            {fundingState.step === "error" && (
              <>
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm opacity-80">{fundingState.error}</p>
                </div>
              </>
            )}
          </div>
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
        <div className="pt-4 border-t border-surface-elevated">
          <button
            className="w-full text-sm text-text-secondary hover:text-text-primary mb-3 flex items-center justify-between px-2 py-1 rounded-lg hover:bg-surface-elevated transition-colors"
            onClick={() => setShowManualBridge(!showManualBridge)}
          >
            <span className="font-medium">Alternative Funding Methods</span>
            <span className="text-lg transition-transform" style={{ transform: showManualBridge ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          </button>

          {showManualBridge && (
            <div className="space-y-2 animate-fade-in">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start hover:bg-surface-elevated"
                onClick={handleOpenBridge}
              >
                <span className="text-lg mr-2">🌉</span>
                <div className="text-left">
                  <p className="font-medium">Hyperliquid Bridge</p>
                  <p className="text-xs text-text-muted">Official bridge</p>
                </div>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start hover:bg-surface-elevated"
                onClick={handleOpenHyperUnit}
              >
                <span className="text-lg mr-2">💱</span>
                <div className="text-left">
                  <p className="font-medium">HyperUnit</p>
                  <p className="text-xs text-text-muted">Buy crypto with fiat</p>
                </div>
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
