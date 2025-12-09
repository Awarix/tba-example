"use client";

import { useMemo } from "react";
import { useOrderBook } from "@/hooks/useHyperliquid";
import { formatPrice } from "@/lib/hyperliquid/utils";

interface OrderBookProps {
  coin: string;
  onPriceClick?: (price: string) => void;
  maxRows?: number;
}

interface OrderBookRowProps {
  price: string;
  size: string;
  total: number;
  side: "bid" | "ask";
  depthPercent: number;
  onClick?: () => void;
}

/**
 * Single row in the order book
 */
function OrderBookRow({ price, size, total, side, depthPercent, onClick }: OrderBookRowProps) {
  const isBid = side === "bid";
  const bgColor = isBid ? "bg-long/10" : "bg-short/10";
  const textColor = isBid ? "text-long" : "text-short";
  const depthColor = isBid ? "bg-long/20" : "bg-short/20";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-2 py-1.5 hover:${bgColor} transition-colors relative group`}
    >
      {/* Depth bar background */}
      <div
        className={`absolute inset-y-0 ${isBid ? "left-0" : "right-0"} ${depthColor} transition-all`}
        style={{ width: `${Math.min(depthPercent, 100)}%` }}
      />

      {/* Price */}
      <span className={`relative z-10 font-mono text-sm ${textColor} group-hover:underline`}>
        {formatPrice(price)}
      </span>

      {/* Size */}
      <span className="relative z-10 font-mono text-sm text-text-secondary">
        {parseFloat(size).toFixed(4)}
      </span>

      {/* Total (number of orders) */}
      <span className="relative z-10 font-mono text-xs text-text-muted w-8 text-right">
        {total}
      </span>
    </button>
  );
}

/**
 * Order Book component showing bid/ask depth
 * Mobile-optimized with horizontal depth bars
 */
export function OrderBook({ coin, onPriceClick, maxRows = 10 }: OrderBookProps) {
  const { bids, asks, isLoading } = useOrderBook(coin);

  // Calculate cumulative volumes for depth visualization
  const { processedBids, processedAsks } = useMemo(() => {
    const bidVolumes = bids.slice(0, maxRows).map((b) => parseFloat(b.size));
    const askVolumes = asks.slice(0, maxRows).map((a) => parseFloat(a.size));

    const maxBidVolume = Math.max(...bidVolumes, 0);
    const maxAskVolume = Math.max(...askVolumes, 0);
    const maxVol = Math.max(maxBidVolume, maxAskVolume);

    const processedBids = bids.slice(0, maxRows).map((b) => ({
      ...b,
      depthPercent: maxVol > 0 ? (parseFloat(b.size) / maxVol) * 100 : 0,
    }));

    const processedAsks = asks.slice(0, maxRows).map((a) => ({
      ...a,
      depthPercent: maxVol > 0 ? (parseFloat(a.size) / maxVol) * 100 : 0,
    }));

    return { processedBids, processedAsks };
  }, [bids, asks, maxRows]);

  // Calculate spread
  const spread = useMemo(() => {
    if (asks.length === 0 || bids.length === 0) return null;
    const bestAsk = parseFloat(asks[0].price);
    const bestBid = parseFloat(bids[0].price);
    const spreadValue = bestAsk - bestBid;
    const spreadPercent = ((spreadValue / bestAsk) * 100).toFixed(3);
    return { value: spreadValue, percent: spreadPercent };
  }, [asks, bids]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted text-sm">
        Select an asset to view order book
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-surface-elevated text-xs text-text-muted">
        <span>Price (USD)</span>
        <span>Size ({coin})</span>
        <span className="w-8 text-right">#</span>
      </div>

      {/* Asks (sells) - reversed to show lowest at bottom */}
      <div className="flex flex-col-reverse flex-1 overflow-hidden">
        {processedAsks.map((ask, i) => (
          <OrderBookRow
            key={`ask-${i}-${ask.price}`}
            price={ask.price}
            size={ask.size}
            total={ask.total}
            side="ask"
            depthPercent={ask.depthPercent}
            onClick={() => onPriceClick?.(ask.price)}
          />
        ))}
      </div>

      {/* Spread indicator */}
      <div className="flex items-center justify-center px-2 py-2 bg-background border-y border-surface-elevated">
        {spread ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">Spread</span>
            <span className="font-mono text-text-primary">
              ${spread.value.toFixed(2)}
            </span>
            <span className="text-text-muted">({spread.percent}%)</span>
          </div>
        ) : (
          <span className="text-text-muted text-xs">--</span>
        )}
      </div>

      {/* Bids (buys) */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {processedBids.map((bid, i) => (
          <OrderBookRow
            key={`bid-${i}-${bid.price}`}
            price={bid.price}
            size={bid.size}
            total={bid.total}
            side="bid"
            depthPercent={bid.depthPercent}
            onClick={() => onPriceClick?.(bid.price)}
          />
        ))}
      </div>

      {/* Empty state */}
      {processedBids.length === 0 && processedAsks.length === 0 && (
        <div className="flex items-center justify-center flex-1 text-text-muted text-sm">
          No orders available
        </div>
      )}
    </div>
  );
}

export default OrderBook;
