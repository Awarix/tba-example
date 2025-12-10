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

type OrderTypeOption = "market" | "limit";

/**
 * Bottom sheet order form - Bybit style
 * Clean, professional mobile trading interface
 */
export function OrderSheet({
  isOpen,
  onClose,
  side: initialSide,
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

  const [side, setSide] = useState<"buy" | "sell">(initialSide);
  const [orderType, setOrderType] = useState<OrderTypeOption>("limit");
  const [sizeInput, setSizeInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [leverage, setLeverage] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsBuilderApproval, setNeedsBuilderApproval] = useState(false);

  const currentPrice = getPrice(coin);
  const availableBalance = parseFloat(marginInfo.availableBalance);

  // Reset side when initialSide prop changes
  useEffect(() => {
    setSide(initialSide);
  }, [initialSide]);

  // Set initial price when sheet opens or price changes
  useEffect(() => {
    if (initialPrice) {
      setPriceInput(initialPrice.toFixed(2));
      setOrderType("limit");
    }
  }, [initialPrice]);

  // Sync price input with parent
  useEffect(() => {
    if (priceInput && onPriceChange) {
      const price = parseFloat(priceInput);
      if (!isNaN(price)) {
        onPriceChange(price);
      }
    }
  }, [priceInput, onPriceChange]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setOrderType("limit");
      setSizeInput("");
      setPriceInput("");
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  // Calculate order value
  const price = orderType === "market" ? currentPrice : priceInput;
  const priceNum = parseFloat(price || "0");
  const sizeNum = parseFloat(sizeInput || "0");
  const leverageNum = parseFloat(leverage || "1");
  const orderValue = sizeNum * priceNum;

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

    // Validate limit order has a price
    if (orderType === "limit" && (!priceInput || parseFloat(priceInput) <= 0)) {
      setError("Please enter a valid limit price");
      return;
    }

    setError(null);
    setSuccess(null);

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

      {/* Sheet - Bybit Style */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl animate-slide-up max-h-[85vh] overflow-auto">
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-surface-elevated" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2">
          <h2 className="text-base font-semibold text-text-primary">
            {coin} Perpetual
          </h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 pb-4 space-y-3">
          {/* Buy/Sell Toggle (Bybit style) */}
          <div className="flex gap-2">
            <button
              onClick={() => setSide("buy")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                side === "buy"
                  ? "bg-long text-background"
                  : "bg-surface-elevated text-text-secondary"
              }`}
            >
              Buy / Long
            </button>
            <button
              onClick={() => setSide("sell")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                side === "sell"
                  ? "bg-short text-background"
                  : "bg-surface-elevated text-text-secondary"
              }`}
            >
              Sell / Short
            </button>
          </div>
          {/* Builder fee approval */}
          {needsBuilderApproval && (
            <div className="p-2.5 rounded-lg bg-warning/10 border border-warning">
              <p className="text-xs text-warning mb-1.5">
                One-time builder fee approval required.
              </p>
              <Button variant="primary" size="sm" onClick={handleApproveBuilderFee} isLoading={isApprovingFee}>
                Approve
              </Button>
            </div>
          )}

          {/* Order type selector - Bybit style */}
          <div className="flex gap-2">
            <button
              onClick={() => setOrderType("market")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                orderType === "market"
                  ? "bg-accent text-white"
                  : "bg-surface-elevated text-text-secondary"
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType("limit")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                orderType === "limit"
                  ? "bg-accent text-white"
                  : "bg-surface-elevated text-text-secondary"
              }`}
            >
              Limit
            </button>
            <button
              className="px-3 py-2 rounded-lg bg-surface-elevated text-text-secondary"
              title="Stop orders in settings"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </div>

          {/* Limit Price - Bybit block style */}
          {orderType === "limit" && (
            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">Limit Price</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-elevated">
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-text-primary font-mono text-base outline-none"
                />
                <span className="text-xs text-text-secondary">USD</span>
              </div>
            </div>
          )}

          {/* Size/Amount - Bybit block style */}
          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">Size</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-elevated">
              <input
                type="number"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-text-primary font-mono text-base outline-none"
              />
              <span className="text-xs text-text-secondary">{coin}</span>
            </div>
          </div>

          {/* Leverage - Bybit horizontal bar style */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-text-secondary">Leverage</label>
              <span className="text-sm font-semibold text-text-primary">{leverage}x</span>
            </div>
            <div className="flex gap-1">
              {["1", "5", "10", "28", "50"].map((lev) => (
                <button
                  key={lev}
                  onClick={() => setLeverage(lev)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                    leverage === lev
                      ? "bg-accent text-white"
                      : "bg-surface-elevated text-text-secondary"
                  }`}
                >
                  {lev}x
                </button>
              ))}
            </div>
          </div>

          {/* Available Balance - Bybit style */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-elevated">
            <span className="text-xs text-text-secondary">Available</span>
            <span className="text-sm font-mono font-semibold text-long">{formatUsd(availableBalance)}</span>
          </div>

          {/* Error/Success */}
          {error && (
            <div className="p-2 rounded-lg bg-error/10 text-error text-xs">{error}</div>
          )}
          {success && (
            <div className="p-2 rounded-lg bg-success/10 text-success text-xs">{success}</div>
          )}

          {/* Large Buy/Sell Button - Bybit style */}
          <button
            onClick={handleSubmit}
            disabled={!sizeInput || parseFloat(sizeInput) <= 0 || needsBuilderApproval || isPlacingOrder}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              side === "buy"
                ? "bg-long text-background hover:bg-long/90"
                : "bg-short text-background hover:bg-short/90"
            }`}
          >
            {isPlacingOrder ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              `${side === "buy" ? "Buy" : "Sell"} ${coin}`
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default OrderSheet;
