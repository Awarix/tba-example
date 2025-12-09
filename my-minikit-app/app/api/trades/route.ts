import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { trades, type NewTrade } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * Validation schema for creating a new trade
 */
const createTradeSchema = z.object({
  walletAddress: z.string().min(1).regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  fid: z.number().int().positive().optional(),
  pair: z.string().min(1),
  marketType: z.enum(["perp", "spot"]),
  orderType: z.enum(["market", "limit", "stop", "tp", "sl"]),
  side: z.enum(["buy", "sell"]),
  size: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Size must be a positive number",
  }),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Price must be a positive number",
  }),
  leverage: z.number().int().min(1).max(100).optional(),
  hlOrderId: z.string().optional(),
  status: z.enum(["pending", "filled", "cancelled", "failed"]).default("pending"),
});

/**
 * Query params for fetching trades
 */
const querySchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  pair: z.string().optional(),
  status: z.enum(["pending", "filled", "cancelled", "failed"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * POST /api/trades - Log a new trade
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validated = createTradeSchema.parse(body);

    const newTrade: NewTrade = {
      walletAddress: validated.walletAddress.toLowerCase(),
      fid: validated.fid,
      pair: validated.pair.toUpperCase(),
      marketType: validated.marketType,
      orderType: validated.orderType,
      side: validated.side,
      size: validated.size,
      price: validated.price,
      leverage: validated.leverage,
      hlOrderId: validated.hlOrderId,
      status: validated.status,
    };

    const db = getDb();
    const [inserted] = await db.insert(trades).values(newTrade).returning();

    return NextResponse.json({ success: true, trade: inserted }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating trade:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create trade" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/trades - Fetch trades for a wallet
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validated = querySchema.parse(searchParams);

    // Build conditions
    const conditions = [];
    if (validated.walletAddress) {
      conditions.push(eq(trades.walletAddress, validated.walletAddress.toLowerCase()));
    }
    if (validated.pair) {
      conditions.push(eq(trades.pair, validated.pair.toUpperCase()));
    }
    if (validated.status) {
      conditions.push(eq(trades.status, validated.status));
    }

    // Query trades
    const db = getDb();
    const result = await db
      .select()
      .from(trades)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(trades.createdAt))
      .limit(validated.limit)
      .offset(validated.offset);

    return NextResponse.json({
      success: true,
      trades: result,
      pagination: {
        limit: validated.limit,
        offset: validated.offset,
        count: result.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error fetching trades:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trades" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/trades - Update trade status (for order fills/cancellations)
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const updateSchema = z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "filled", "cancelled", "failed"]),
      filledPrice: z.string().optional(),
      fees: z.string().optional(),
      builderFee: z.string().optional(),
    });

    const validated = updateSchema.parse(body);

    const updateData: Partial<typeof trades.$inferInsert> = {
      status: validated.status,
    };

    if (validated.filledPrice) {
      updateData.filledPrice = validated.filledPrice;
    }
    if (validated.fees) {
      updateData.fees = validated.fees;
    }
    if (validated.builderFee) {
      updateData.builderFee = validated.builderFee;
    }
    if (validated.status === "filled") {
      updateData.filledAt = new Date();
    }

    const db = getDb();
    const [updated] = await db
      .update(trades)
      .set(updateData)
      .where(eq(trades.id, validated.id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Trade not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, trade: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating trade:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update trade" },
      { status: 500 }
    );
  }
}
