import { NextRequest, NextResponse } from "next/server";
import { getInfoClient } from "@/lib/hyperliquid/client";

/**
 * GET /api/orders - Fetch open orders from Hyperliquid
 * Query params: user (wallet address)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get("user");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "user (wallet address) is required" },
        { status: 400 }
      );
    }

    const info = getInfoClient();
    
    // Fetch open orders from Hyperliquid
    const openOrders = await info.openOrders({ user });

    // Fetch user fills (recent trades) for history
    const userFills = await info.userFills({ user });

    return NextResponse.json({
      success: true,
      openOrders: openOrders ?? [],
      recentFills: userFills?.slice(0, 50) ?? [], // Last 50 fills
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

