import type { Meta, SpotMeta } from "@/store/api/hyperliquidApi";

/**
 * Utility functions for working with Hyperliquid data.
 */

/**
 * Find asset index by symbol for perpetuals.
 */
export function findPerpAssetIndex(meta: Meta, symbol: string): number | null {
  const index = meta.universe.findIndex(
    (asset: { name: string }) => asset.name.toUpperCase() === symbol.toUpperCase()
  );
  return index >= 0 ? index : null;
}

/**
 * Find asset info by symbol for perpetuals.
 */
export function findPerpAsset(meta: Meta, symbol: string) {
  return meta.universe.find(
    (asset: { name: string }) => asset.name.toUpperCase() === symbol.toUpperCase()
  );
}

/**
 * Find token index for spot trading.
 * Spot uses token indices which differ from perp asset indices.
 */
export function findSpotTokenIndex(
  spotMeta: SpotMeta,
  symbol: string
): number | null {
  const token = spotMeta.tokens.find(
    (t: { name: string; index: number }) => t.name.toUpperCase() === symbol.toUpperCase()
  );
  return token?.index ?? null;
}

/**
 * Format price for display.
 * Handles large and small numbers appropriately.
 */
export function formatPrice(price: string | number, decimals = 2): string {
  const num = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(num)) return "—";

  if (num >= 1000) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  if (num >= 1) {
    return num.toFixed(decimals);
  }

  // For small numbers, show more decimals
  return num.toPrecision(4);
}

/**
 * Format size for display.
 */
export function formatSize(size: string | number, decimals = 4): string {
  const num = typeof size === "string" ? parseFloat(size) : size;

  if (isNaN(num)) return "—";

  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format USD value for display.
 */
export function formatUsd(value: string | number, decimals = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "—";

  const formatted = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return num < 0 ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Format PnL with color indicator.
 */
export function formatPnl(
  pnl: string | number
): { value: string; isPositive: boolean; isNegative: boolean } {
  const num = typeof pnl === "string" ? parseFloat(pnl) : pnl;

  if (isNaN(num)) {
    return { value: "—", isPositive: false, isNegative: false };
  }

  return {
    value: formatUsd(num),
    isPositive: num > 0,
    isNegative: num < 0,
  };
}

/**
 * Format percentage for display.
 */
export function formatPercent(value: string | number, decimals = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "—";

  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(decimals)}%`;
}

/**
 * Calculate notional value of a position.
 */
export function calculateNotional(size: string, price: string): number {
  return Math.abs(parseFloat(size)) * parseFloat(price);
}

/**
 * Calculate PnL percentage.
 */
export function calculatePnlPercent(
  pnl: string | number,
  margin: string | number
): number {
  const pnlNum = typeof pnl === "string" ? parseFloat(pnl) : pnl;
  const marginNum = typeof margin === "string" ? parseFloat(margin) : margin;

  if (isNaN(pnlNum) || isNaN(marginNum) || marginNum === 0) {
    return 0;
  }

  return (pnlNum / marginNum) * 100;
}

// Type for order status response
interface OrderStatusData {
  resting?: { oid: string | number };
  filled?: { oid: string | number };
  error?: string;
}

/**
 * Parse Hyperliquid order response for status.
 */
export function parseOrderStatus(response: unknown): {
  success: boolean;
  orderId?: string;
  error?: string;
} {
  if (!response || typeof response !== "object") {
    return { success: false, error: "Invalid response" };
  }

  const res = response as { status?: string; response?: unknown };

  if (res.status === "ok" && res.response) {
    const inner = res.response as { type?: string; data?: { statuses?: OrderStatusData[] } };
    if (inner.type === "order") {
      const statuses = inner.data?.statuses;
      if (statuses?.[0]?.resting?.oid) {
        return {
          success: true,
          orderId: String(statuses[0].resting.oid),
        };
      }
      if (statuses?.[0]?.filled?.oid) {
        return {
          success: true,
          orderId: String(statuses[0].filled.oid),
        };
      }
    }
  }

  if (res.status === "err") {
    return { success: false, error: String(res.response) };
  }

  return { success: false, error: "Unknown response format" };
}
