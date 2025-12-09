"use client";

import { useState, useEffect } from "react";
import { useHyperliquid } from "@/hooks/useHyperliquid";
import { formatPrice, formatUsd } from "@/lib/hyperliquid/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

interface OrderFormProps {
  selectedAsset: string | null;
  initialPrice?: number | null;
  initialSide?: "buy" | "sell";
  onPriceChange?: (price: number | null) => void;
  onTpChange?: (price: number | null) => void;
  onSlChange?: (price: number | null) => void;
  compact?: boolean;
}

type OrderTypeOption = "market" | "limit" | "stop";

/**
 * Full-featured order form supporting market, limit, and stop orders
 * Used inline on desktop, or can be embedded in sheets
 */
export function OrderForm({
  selectedAsset,
  initialPrice,
  initialSide = "buy",
  onPriceChange,
  onTpChange,
  onSlChange,
  compact = false,
}: OrderFormProps) {
  const {
    getPrice,
    placeMarketOrder,
    placeLimitOrder,
    approveBuilderFee,
    marginInfo,
    isPlacingOrder,
    isApprovingFee,
    builderConfigured,
  } = useHyperliquid();

  const [side, setSide] = useState<"buy" | "sell">(initialSide);
  const [orderType, setOrderType] = useState<OrderTypeOption>("market");
  const [sizeInput, setSizeInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [leverage, setLeverage] = useState("10");
  const [showTpSl, setShowTpSl] = useState(false);
  const [tpInput, setTpInput] = useState("");
  const [slInput, setSlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsBuilderApproval, setNeedsBuilderApproval] = useState(false);

  // Update side from prop
  useEffect(() => {
    setSide(initialSide);
  }, [initialSide]);

  // Set initial price when provided
  useEffect(() => {
    if (initialPrice !== null && initialPrice !== undefined) {
      setPriceInput(initialPrice.toString());
    }
  }, [initialPrice]);

  // Reset messages on input change
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [sizeInput, side, selectedAsset, priceInput, orderType]);

  // Sync price with parent
  useEffect(() => {
    if (priceInput && onPriceChange) {
      const price = parseFloat(priceInput);
      if (!isNaN(price)) {
        onPriceChange(price);
      }
    } else if (onPriceChange) {
      onPriceChange(null);
    }
  }, [priceInput, onPriceChange]);

  // Sync TP/SL with parent
  useEffect(() => {
    if (tpInput && onTpChange) {
      const price = parseFloat(tpInput);
      if (!isNaN(price)) onTpChange(price);
    } else if (onTpChange) {
      onTpChange(null);
    }
  }, [tpInput, onTpChange]);

  useEffect(() => {
    if (slInput && onSlChange) {
      const price = parseFloat(slInput);
      if (!isNaN(price)) onSlChange(price);
    } else if (onSlChange) {
      onSlChange(null);
    }
  }, [slInput, onSlChange]);

  const currentPrice = selectedAsset ? getPrice(selectedAsset) : null;
  const availableMargin = parseFloat(marginInfo.availableBalance);

  // Calculate estimated values
  const price = orderType === "market" ? currentPrice : priceInput;
  const priceNum = parseFloat(price || "0");
  const sizeNum = parseFloat(sizeInput || "0");
  const leverageNum = parseFloat(leverage || "1");

  const estimatedValue = sizeNum * priceNum;
  const marginRequired = estimatedValue / leverageNum;

  const handleApproveBuilderFee = async () => {
    try {
      setError(null);
      await approveBuilderFee();
      setNeedsBuilderApproval(false);
      setSuccess("Builder fee approved!");
    } catch (err) {
      setError(String(err));
    }
  };

  const handleSubmit = async () => {
    if (!selectedAsset || !sizeInput) return;

    setError(null);
    setSuccess(null);

    if (marginRequired > availableMargin) {
      setError(`Insufficient margin. Need ${formatUsd(marginRequired)}, have ${formatUsd(availableMargin)}`);
      return;
    }

    try {
      let result;

      if (orderType === "market") {
        result = await placeMarketOrder({
          symbol: selectedAsset,
          side,
          size: sizeInput,
        });
      } else {
        if (!priceInput) {
          setError("Price required for limit/stop orders");
          return;
        }
        result = await placeLimitOrder({
          symbol: selectedAsset,
          side,
          size: sizeInput,
          price: priceInput,
        });
      }

      if (result.success) {
        setSuccess(`Order placed! ID: ${result.orderId?.slice(0, 8)}...`);
        setSizeInput("");
        if (orderType !== "market") setPriceInput("");
      }
    } catch (err) {
      const errorMsg = String(err);
      if (errorMsg.includes("builder") || errorMsg.includes("approval")) {
        setNeedsBuilderApproval(true);
        setError("Builder fee approval required.");
      } else {
        setError(errorMsg);
      }
    }
  };

  const isLong = side === "buy";

  return (
    <Card className={compact ? "p-3" : ""}>
      {!compact && (
        <CardHeader>
          <CardTitle>Order</CardTitle>
        </CardHeader>
      )}

      <div className={compact ? "space-y-3" : "space-y-4"}>
        {/* Builder fee approval */}
        {needsBuilderApproval && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning">
            <p className="text-sm text-warning mb-2">
              One-time builder fee approval required.
            </p>
            <Button variant="primary" size="sm" onClick={handleApproveBuilderFee} isLoading={isApprovingFee}>
              Approve
            </Button>
          </div>
        )}

        {/* Current price */}
        {selectedAsset && currentPrice && (
          <div className="p-3 rounded-lg bg-background">
            <p className="text-xs text-text-secondary mb-0.5">{selectedAsset} Price</p>
            <p className="text-xl font-mono font-semibold text-text-primary">
              ${formatPrice(currentPrice)}
            </p>
          </div>
        )}

        {/* Buy/Sell toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setSide("buy")}
            className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
              isLong
                ? "bg-long text-background"
                : "bg-surface-elevated text-text-secondary hover:text-long"
            }`}
          >
            Long
          </button>
          <button
            onClick={() => setSide("sell")}
            className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
              !isLong
                ? "bg-short text-white"
                : "bg-surface-elevated text-text-secondary hover:text-short"
            }`}
          >
            Short
          </button>
        </div>

        {/* Order type selector */}
        <div className="flex gap-1.5">
          {(["market", "limit", "stop"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                orderType === type
                  ? "bg-accent text-white"
                  : "bg-background text-text-secondary hover:text-text-primary"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Price input (for limit/stop) */}
        {orderType !== "market" && (
          <Input
            type="number"
            label={orderType === "stop" ? "Trigger Price" : "Limit Price"}
            placeholder="0.00"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            suffix="USD"
          />
        )}

        {/* Size input */}
        <Input
          type="number"
          label="Size"
          placeholder="0.00"
          value={sizeInput}
          onChange={(e) => setSizeInput(e.target.value)}
          suffix={selectedAsset ?? "—"}
        />

        {/* Leverage selector */}
        <div>
          <label className="text-xs text-text-secondary block mb-1.5">Leverage</label>
          <div className="flex gap-1.5">
            {["1", "5", "10", "20", "50"].map((lev) => (
              <button
                key={lev}
                onClick={() => setLeverage(lev)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  leverage === lev
                    ? "bg-accent text-white"
                    : "bg-background text-text-secondary hover:text-text-primary"
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>

        {/* TP/SL toggle */}
        <button
          onClick={() => setShowTpSl(!showTpSl)}
          className="flex items-center justify-between w-full p-2.5 rounded-lg bg-background text-sm"
        >
          <span className="text-text-secondary">TP / SL</span>
          <svg
            className={`w-4 h-4 text-text-secondary transition-transform ${showTpSl ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* TP/SL inputs */}
        {showTpSl && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              label="Take Profit"
              placeholder="TP"
              value={tpInput}
              onChange={(e) => setTpInput(e.target.value)}
            />
            <Input
              type="number"
              label="Stop Loss"
              placeholder="SL"
              value={slInput}
              onChange={(e) => setSlInput(e.target.value)}
            />
          </div>
        )}

        {/* Order summary */}
        <div className="p-2.5 rounded-lg bg-background space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-text-secondary">Est. Value</span>
            <span className="font-mono text-text-primary">{formatUsd(estimatedValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Margin Req.</span>
            <span className="font-mono text-text-primary">{formatUsd(marginRequired)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Available</span>
            <span className="font-mono text-long">{formatUsd(availableMargin)}</span>
          </div>
        </div>

        {/* Error/Success */}
        {error && (
          <div className="p-2.5 rounded-lg bg-error/10 text-error text-xs">{error}</div>
        )}
        {success && (
          <div className="p-2.5 rounded-lg bg-success/10 text-success text-xs">{success}</div>
        )}

        {/* Submit button */}
        <Button
          variant={isLong ? "long" : "short"}
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          isLoading={isPlacingOrder}
          disabled={
            !selectedAsset ||
            !sizeInput ||
            parseFloat(sizeInput) <= 0 ||
            needsBuilderApproval ||
            (orderType !== "market" && !priceInput)
          }
        >
          {isLong ? "Long" : "Short"} {selectedAsset ?? "—"}
        </Button>

        {/* Builder fee notice */}
        {builderConfigured && (
          <p className="text-xs text-center text-text-muted">Builder fee applies</p>
        )}
      </div>
    </Card>
  );
}

export default OrderForm;
