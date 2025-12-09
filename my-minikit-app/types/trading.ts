import { z } from "zod";

/**
 * Trading-related types and validation schemas.
 */

// Order side
export const OrderSideSchema = z.enum(["buy", "sell"]);
export type OrderSide = z.infer<typeof OrderSideSchema>;

// Order type
export const OrderTypeSchema = z.enum(["market", "limit", "stop"]);
export type OrderType = z.infer<typeof OrderTypeSchema>;

// Market type
export const MarketTypeSchema = z.enum(["perp", "spot"]);
export type MarketType = z.infer<typeof MarketTypeSchema>;

// Time in force
export const TimeInForceSchema = z.enum(["Gtc", "Ioc", "Alo"]);
export type TimeInForce = z.infer<typeof TimeInForceSchema>;

// Order input schema for validation
export const OrderInputSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  side: OrderSideSchema,
  size: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Size must be a positive number" }
  ),
  price: z.string().optional(),
  orderType: OrderTypeSchema,
  reduceOnly: z.boolean().optional().default(false),
  leverage: z.string().optional().default("1"),
});
export type OrderInput = z.infer<typeof OrderInputSchema>;

// Position type
export interface Position {
  symbol: string;
  size: string;
  entryPrice: string;
  markPrice: string;
  unrealizedPnl: string;
  leverage: string;
  liquidationPrice: string | null;
  marginUsed: string;
}

// Asset info type
export interface AssetInfo {
  index: number;
  name: string;
  szDecimals: number;
  maxLeverage: number;
}

// Margin info type
export interface MarginInfo {
  accountValue: string;
  totalMarginUsed: string;
  totalNtlPos: string;
  availableBalance: string;
}

// Order result type
export interface OrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

// Funding balances type
export interface FundingBalances {
  baseUsdc: string;
  hyperEvmUsdhl: string;
  hlPerpMargin: string;
  hlSpotBalance: string;
  isLoading: boolean;
  error: string | null;
}

// Funding state type
export interface FundingState {
  step: "idle" | "swapping" | "transferring" | "complete" | "error";
  txHash: string | null;
  error: string | null;
}

