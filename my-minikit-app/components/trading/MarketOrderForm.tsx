"use client";

import { useState, useEffect } from "react";
import { useHyperliquid } from "@/hooks/useHyperliquid";
import { formatPrice, formatUsd } from "@/lib/hyperliquid/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

interface MarketOrderFormProps {
  selectedAsset: string | null;
}

export function MarketOrderForm({ selectedAsset }: MarketOrderFormProps) {
  const {
    getPrice,
    placeMarketOrder,
    approveBuilderFee,
    marginInfo,
    isPlacingOrder,
    isApprovingFee,
    builderConfigured,
  } = useHyperliquid();

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [sizeInput, setSizeInput] = useState("");
  const [leverage, setLeverage] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsBuilderApproval, setNeedsBuilderApproval] = useState(false);

  // Reset messages on input change
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [sizeInput, side, selectedAsset]);

  const currentPrice = selectedAsset ? getPrice(selectedAsset) : null;
  const availableMargin = parseFloat(marginInfo.availableBalance);

  // Calculate estimated order value
  const estimatedValue =
    sizeInput && currentPrice
      ? parseFloat(sizeInput) * parseFloat(currentPrice)
      : 0;

  // Calculate margin required (with leverage)
  const marginRequired = estimatedValue / parseFloat(leverage || "1");

  const handleApproveBuilderFee = async () => {
    try {
      setError(null);
      await approveBuilderFee();
      setNeedsBuilderApproval(false);
      setSuccess("Builder fee approved! You can now trade.");
    } catch (err) {
      setError(String(err));
    }
  };

  const handleSubmit = async () => {
    if (!selectedAsset || !sizeInput) return;

    setError(null);
    setSuccess(null);

    // Check margin
    if (marginRequired > availableMargin) {
      setError(
        `Insufficient margin. Need ${formatUsd(marginRequired)}, have ${formatUsd(availableMargin)}`
      );
      return;
    }

    try {
      const result = await placeMarketOrder({
        symbol: selectedAsset,
        side,
        size: sizeInput,
      });

      if (result.success) {
        setSuccess(`Order placed! ID: ${result.orderId?.slice(0, 8)}...`);
        setSizeInput("");
      }
    } catch (err) {
      const errorMsg = String(err);
      // Check if it's a builder fee approval error
      if (errorMsg.includes("builder") || errorMsg.includes("approval")) {
        setNeedsBuilderApproval(true);
        setError("Builder fee approval required before first trade.");
      } else {
        setError(errorMsg);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Order</CardTitle>
      </CardHeader>

      {/* Builder fee approval prompt */}
      {needsBuilderApproval && (
        <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning">
          <p className="text-sm text-warning mb-2">
            One-time builder fee approval required to trade through this app.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApproveBuilderFee}
            isLoading={isApprovingFee}
          >
            Approve Builder Fee
          </Button>
        </div>
      )}

      {/* Current price */}
      {selectedAsset && currentPrice && (
        <div className="mb-4 p-3 rounded-lg bg-background">
          <p className="text-sm text-text-secondary">{selectedAsset} Price</p>
          <p className="text-2xl font-mono font-semibold text-text-primary">
            ${formatPrice(currentPrice)}
          </p>
        </div>
      )}

      {/* Buy/Sell toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSide("buy")}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            side === "buy"
              ? "bg-long text-background"
              : "bg-surface-elevated text-text-secondary hover:text-long"
          }`}
        >
          Long
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            side === "sell"
              ? "bg-short text-white"
              : "bg-surface-elevated text-text-secondary hover:text-short"
          }`}
        >
          Short
        </button>
      </div>

      {/* Size input */}
      <div className="mb-4">
        <Input
          type="number"
          label="Size"
          placeholder="0.00"
          value={sizeInput}
          onChange={(e) => setSizeInput(e.target.value)}
          suffix={selectedAsset ?? "—"}
        />
      </div>

      {/* Leverage selector */}
      <div className="mb-4">
        <label className="text-sm text-text-secondary block mb-2">
          Leverage
        </label>
        <div className="flex gap-2">
          {["1", "2", "5", "10", "20"].map((lev) => (
            <button
              key={lev}
              onClick={() => setLeverage(lev)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                leverage === lev
                  ? "bg-accent text-white"
                  : "bg-surface-elevated text-text-secondary hover:text-text-primary"
              }`}
            >
              {lev}x
            </button>
          ))}
        </div>
      </div>

      {/* Order summary */}
      <div className="mb-4 p-3 rounded-lg bg-background space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Est. Value</span>
          <span className="font-mono text-text-primary">
            {formatUsd(estimatedValue)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Margin Required</span>
          <span className="font-mono text-text-primary">
            {formatUsd(marginRequired)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Available</span>
          <span className="font-mono text-text-primary">
            {formatUsd(availableMargin)}
          </span>
        </div>
      </div>

      {/* Error/Success messages */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 text-error text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-success/10 text-success text-sm">
          {success}
        </div>
      )}

      {/* Submit button */}
      <Button
        variant={side === "buy" ? "long" : "short"}
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        isLoading={isPlacingOrder}
        disabled={
          !selectedAsset ||
          !sizeInput ||
          parseFloat(sizeInput) <= 0 ||
          needsBuilderApproval
        }
      >
        {side === "buy" ? "Long" : "Short"} {selectedAsset ?? "—"}
      </Button>

      {/* Builder fee notice */}
      {builderConfigured && (
        <p className="mt-3 text-xs text-center text-text-muted">
          Builder fee applies to all trades
        </p>
      )}
    </Card>
  );
}
