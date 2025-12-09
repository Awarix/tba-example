"use client";

import { useState, useEffect } from "react";
import { useHyperliquid } from "@/hooks/useHyperliquid";
import { formatPrice, formatUsd } from "@/lib/hyperliquid/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface OrderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  side: "buy" | "sell";
  coin: string;
  initialPrice?: number | null;
  onPriceChange?: (price: number | null) => void;
  onTpChange?: (price: number | null) => void;
  onSlChange?: (price: number | null) => void;
}

type OrderTypeOption = "market" | "limit" | "stop";

/**
 * Bottom sheet order form
 * Slides up when Long/Short is tapped
 */
export function OrderSheet({
  isOpen,
  onClose,
  side,
  coin,
  initialPrice,
  onPriceChange,
  onTpChange,
  onSlChange,
}: OrderSheetProps) {
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

  const currentPrice = getPrice(coin);
  const availableMargin = parseFloat(marginInfo.availableBalance);

  // Set initial price when sheet opens
  useEffect(() => {
    if (isOpen && initialPrice) {
      setPriceInput(initialPrice.toString());
    }
  }, [isOpen, initialPrice]);

  // Sync price input with parent
  useEffect(() => {
    if (priceInput && onPriceChange) {
      const price = parseFloat(priceInput);
      if (!isNaN(price)) {
        onPriceChange(price);
      }
    }
  }, [priceInput, onPriceChange]);

  // Sync TP/SL with parent
  useEffect(() => {
    if (tpInput && onTpChange) {
      const price = parseFloat(tpInput);
      if (!isNaN(price)) {
        onTpChange(price);
      }
    } else if (onTpChange) {
      onTpChange(null);
    }
  }, [tpInput, onTpChange]);

  useEffect(() => {
    if (slInput && onSlChange) {
      const price = parseFloat(slInput);
      if (!isNaN(price)) {
        onSlChange(price);
      }
    } else if (onSlChange) {
      onSlChange(null);
    }
  }, [slInput, onSlChange]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

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
    if (!coin || !sizeInput) return;

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
          symbol: coin,
          side,
          size: sizeInput,
        });
      } else {
        result = await placeLimitOrder({
          symbol: coin,
          side,
          size: sizeInput,
          price: priceInput,
        });
      }

      if (result.success) {
        setSuccess(`Order placed!`);
        setSizeInput("");
        setPriceInput("");
        setTimeout(onClose, 1500);
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

  if (!isOpen) return null;

  const isLong = side === "buy";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl animate-slide-up max-h-[85vh] overflow-auto">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 rounded-full bg-surface-elevated" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-surface-elevated">
          <h2 className={`text-lg font-bold ${isLong ? "text-long" : "text-short"}`}>
            {isLong ? "Long" : "Short"} {coin}
          </h2>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
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
          <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <span className="text-sm text-text-secondary">Mark Price</span>
            <span className="text-lg font-mono font-semibold text-text-primary">
              ${formatPrice(currentPrice ?? "0")}
            </span>
          </div>

          {/* Order type selector */}
          <div className="flex gap-2">
            {(["market", "limit", "stop"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
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
            suffix={coin}
          />

          {/* Leverage selector */}
          <div>
            <label className="text-sm text-text-secondary block mb-2">Leverage</label>
            <div className="flex gap-1.5">
              {["1", "5", "10", "20", "50"].map((lev) => (
                <button
                  key={lev}
                  onClick={() => setLeverage(lev)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
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
            className="flex items-center justify-between w-full p-3 rounded-lg bg-background"
          >
            <span className="text-sm text-text-secondary">Take Profit / Stop Loss</span>
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
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                label="Take Profit"
                placeholder="TP Price"
                value={tpInput}
                onChange={(e) => setTpInput(e.target.value)}
                className="text-long"
              />
              <Input
                type="number"
                label="Stop Loss"
                placeholder="SL Price"
                value={slInput}
                onChange={(e) => setSlInput(e.target.value)}
                className="text-short"
              />
            </div>
          )}

          {/* Order summary */}
          <div className="p-3 rounded-lg bg-background space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Est. Value</span>
              <span className="font-mono text-text-primary">{formatUsd(estimatedValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Margin Required</span>
              <span className="font-mono text-text-primary">{formatUsd(marginRequired)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Available</span>
              <span className="font-mono text-long">{formatUsd(availableMargin)}</span>
            </div>
          </div>

          {/* Error/Success */}
          {error && (
            <div className="p-3 rounded-lg bg-error/10 text-error text-sm">{error}</div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-success/10 text-success text-sm">{success}</div>
          )}

          {/* Submit button */}
          <Button
            variant={isLong ? "long" : "short"}
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            isLoading={isPlacingOrder}
            disabled={!sizeInput || parseFloat(sizeInput) <= 0 || needsBuilderApproval}
          >
            {isLong ? "Long" : "Short"} {coin}
          </Button>

          {builderConfigured && (
            <p className="text-xs text-center text-text-muted">Builder fee applies</p>
          )}
        </div>
      </div>
    </>
  );
}

export default OrderSheet;
