import {
  pgTable,
  text,
  timestamp,
  decimal,
  integer,
} from "drizzle-orm/pg-core";

/**
 * Minimal MVP schema - wallet address is the primary identity.
 * No User/Session tables for MVP - that's post-MVP with Neynar SIWE.
 */

/**
 * Trade logs for analytics and revenue tracking.
 * Linked to wallet address, not user account.
 */
export const trades = pgTable("trades", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Identity (wallet-based for MVP)
  walletAddress: text("wallet_address").notNull(),
  fid: integer("fid"), // Optional: Farcaster ID if available from context

  // Trade details
  pair: text("pair").notNull(), // "BTC", "ETH", etc.
  marketType: text("market_type").notNull(), // "perp" | "spot"
  side: text("side").notNull(), // "buy" | "sell"
  size: decimal("size", { precision: 30, scale: 18 }).notNull(),
  price: decimal("price", { precision: 30, scale: 18 }).notNull(),

  // Execution
  status: text("status").notNull().default("pending"), // "pending" | "filled" | "cancelled" | "failed"
  hlOrderId: text("hl_order_id"), // Hyperliquid order ID
  filledPrice: decimal("filled_price", { precision: 30, scale: 18 }),
  fees: decimal("fees", { precision: 30, scale: 18 }),

  // Builder fee tracking (for revenue)
  builderFee: decimal("builder_fee", { precision: 30, scale: 18 }),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  filledAt: timestamp("filled_at"),
});

/**
 * Builder fee approvals - track which wallets have approved our builder fee.
 * Required before first trade to ensure we get fees.
 */
export const builderFeeApprovals = pgTable("builder_fee_approvals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  walletAddress: text("wallet_address").notNull().unique(),
  approvedAt: timestamp("approved_at").defaultNow().notNull(),
  txHash: text("tx_hash"),
});

// Type exports for use in application code
export type Trade = typeof trades.$inferSelect;
export type NewTrade = typeof trades.$inferInsert;
export type BuilderFeeApproval = typeof builderFeeApprovals.$inferSelect;
export type NewBuilderFeeApproval = typeof builderFeeApprovals.$inferInsert;

