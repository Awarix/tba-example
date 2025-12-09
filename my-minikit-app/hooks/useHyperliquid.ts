"use client";

import { useCallback, useMemo } from "react";
import { useAccount, useWalletClient } from "wagmi";
import {
  useAllMidsQuery,
  useMetaQuery,
  useSpotMetaQuery,
  useUserStateQuery,
  useSpotUserStateQuery,
  useL2BookQuery,
  usePlaceOrderMutation,
  useApproveBuilderFeeMutation,
} from "@/store/api/hyperliquidApi";
import {
  findPerpAssetIndex,
  parseOrderStatus,
} from "@/lib/hyperliquid/utils";
import { BUILDER_CONFIG } from "@/lib/hyperliquid/client";

// Position type for our app
interface Position {
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
interface AssetInfo {
  index: number;
  name: string;
  szDecimals: number;
  maxLeverage: number;
}

// Spot pair info type
interface SpotPairInfo {
  name: string;
  tokens: number[];
}

/**
 * Order parameters for placing a trade.
 */
export interface PlaceOrderParams {
  symbol: string;
  side: "buy" | "sell";
  size: string;
  price?: string; // Undefined for market orders
  reduceOnly?: boolean;
  orderType: "market" | "limit";
}

/**
 * Main hook for Hyperliquid trading functionality.
 */
export function useHyperliquid() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Queries
  const { data: prices, isLoading: pricesLoading } = useAllMidsQuery();
  const { data: meta, isLoading: metaLoading } = useMetaQuery();
  const { data: spotMeta, isLoading: spotMetaLoading } = useSpotMetaQuery();
  const {
    data: userState,
    isLoading: userStateLoading,
    refetch: refetchUserState,
  } = useUserStateQuery({ user: address ?? "" }, { skip: !address });
  const {
    data: spotUserState,
    isLoading: spotUserStateLoading,
    refetch: refetchSpotUserState,
  } = useSpotUserStateQuery({ user: address ?? "" }, { skip: !address });

  // Mutations
  const [placeOrderMutation, { isLoading: isPlacingOrder }] =
    usePlaceOrderMutation();
  const [approveBuilderFeeMutation, { isLoading: isApprovingFee }] =
    useApproveBuilderFeeMutation();

  /**
   * Get available assets for trading.
   */
  const assets = useMemo((): AssetInfo[] => {
    if (!meta) return [];
    return meta.universe.map((asset: { name: string; szDecimals: number; maxLeverage: number }, index: number) => ({
      index,
      name: asset.name,
      szDecimals: asset.szDecimals,
      maxLeverage: asset.maxLeverage,
    }));
  }, [meta]);

  /**
   * Get spot pairs.
   */
  const spotPairs = useMemo((): SpotPairInfo[] => {
    if (!spotMeta) return [];
    return spotMeta.universe.map((pair: { name: string; tokens: number[] }) => ({
      name: pair.name,
      tokens: pair.tokens,
    }));
  }, [spotMeta]);

  /**
   * Get current price for a symbol.
   */
  const getPrice = useCallback(
    (symbol: string): string | null => {
      if (!prices) return null;
      return prices[symbol] ?? null;
    },
    [prices]
  );

  /**
   * Get user's positions.
   */
  const positions = useMemo((): Position[] => {
    if (!userState?.assetPositions) return [];
    return userState.assetPositions
      .filter((pos) => parseFloat(pos.position.szi) !== 0)
      .map((pos) => {
        // Coin can be string or number in the API response
        const coinIndex = typeof pos.position.coin === 'string' 
          ? parseInt(pos.position.coin) 
          : pos.position.coin;
        const leverageValue = typeof pos.position.leverage === 'object' 
          ? String(pos.position.leverage.value) 
          : "1";
        
        return {
          symbol: meta?.universe[coinIndex]?.name ?? `Asset ${pos.position.coin}`,
          size: pos.position.szi,
          entryPrice: pos.position.entryPx,
          markPrice: pos.position.positionValue
            ? (
                parseFloat(pos.position.positionValue) /
                Math.abs(parseFloat(pos.position.szi))
              ).toString()
            : "0",
          unrealizedPnl: pos.position.unrealizedPnl,
          leverage: leverageValue,
          liquidationPrice: pos.position.liquidationPx ?? null,
          marginUsed: pos.position.marginUsed,
        };
      });
  }, [userState, meta]);

  /**
   * Get account margin info.
   */
  const marginInfo = useMemo(() => {
    if (!userState?.marginSummary) {
      return {
        accountValue: "0",
        totalMarginUsed: "0",
        totalNtlPos: "0",
        availableBalance: "0",
      };
    }
    return {
      accountValue: userState.marginSummary.accountValue,
      totalMarginUsed: userState.marginSummary.totalMarginUsed,
      totalNtlPos: userState.marginSummary.totalNtlPos,
      availableBalance: (
        parseFloat(userState.marginSummary.accountValue) -
        parseFloat(userState.marginSummary.totalMarginUsed)
      ).toString(),
    };
  }, [userState]);

  /**
   * Check if builder fee is approved.
   * Note: This is a simplified check - in production you'd query the actual approval status.
   */
  const isBuilderFeeApproved = useCallback(async (): Promise<boolean> => {
    // For MVP, we'll assume it needs approval if this is the first trade
    // In production, you'd check the user's approvals on Hyperliquid
    return false; // Always prompt for approval to be safe
  }, []);

  /**
   * Approve builder fee.
   */
  const approveBuilderFee = useCallback(async (): Promise<void> => {
    if (!walletClient) {
      throw new Error("Wallet not connected");
    }

    if (!BUILDER_CONFIG.isConfigured) {
      throw new Error("Builder fee not configured");
    }

    await approveBuilderFeeMutation({ wallet: walletClient }).unwrap();
  }, [walletClient, approveBuilderFeeMutation]);

  /**
   * Place a market order.
   */
  const placeMarketOrder = useCallback(
    async (params: Omit<PlaceOrderParams, "orderType" | "price">) => {
      if (!walletClient || !meta) {
        throw new Error("Wallet or metadata not available");
      }

      const assetIndex = findPerpAssetIndex(meta, params.symbol);
      if (assetIndex === null) {
        throw new Error(`Asset ${params.symbol} not found`);
      }

      // Get current price for slippage
      const currentPrice = getPrice(params.symbol);
      if (!currentPrice) {
        throw new Error(`No price available for ${params.symbol}`);
      }

      // For market orders, set a price with slippage (0.5%)
      const slippageMultiplier = params.side === "buy" ? 1.005 : 0.995;
      const orderPrice = (
        parseFloat(currentPrice) * slippageMultiplier
      ).toString();

      const result = await placeOrderMutation({
        wallet: walletClient,
        orders: [
          {
            a: assetIndex,
            b: params.side === "buy",
            p: orderPrice,
            s: params.size,
            r: params.reduceOnly ?? false,
            t: { limit: { tif: "Ioc" } }, // Immediate-or-cancel for market orders
          },
        ],
        grouping: "na",
      }).unwrap();

      const status = parseOrderStatus(result);
      if (!status.success) {
        throw new Error(status.error ?? "Order failed");
      }

      // Refetch user state after order
      await refetchUserState();

      return status;
    },
    [walletClient, meta, getPrice, placeOrderMutation, refetchUserState]
  );

  /**
   * Place a limit order.
   */
  const placeLimitOrder = useCallback(
    async (params: Omit<PlaceOrderParams, "orderType">) => {
      if (!walletClient || !meta) {
        throw new Error("Wallet or metadata not available");
      }

      if (!params.price) {
        throw new Error("Price required for limit orders");
      }

      const assetIndex = findPerpAssetIndex(meta, params.symbol);
      if (assetIndex === null) {
        throw new Error(`Asset ${params.symbol} not found`);
      }

      const result = await placeOrderMutation({
        wallet: walletClient,
        orders: [
          {
            a: assetIndex,
            b: params.side === "buy",
            p: params.price,
            s: params.size,
            r: params.reduceOnly ?? false,
            t: { limit: { tif: "Gtc" } }, // Good-til-cancelled for limit orders
          },
        ],
        grouping: "na",
      }).unwrap();

      const status = parseOrderStatus(result);
      if (!status.success) {
        throw new Error(status.error ?? "Order failed");
      }

      // Refetch user state after order
      await refetchUserState();

      return status;
    },
    [walletClient, meta, placeOrderMutation, refetchUserState]
  );

  /**
   * Close a position (market order to reduce to zero).
   */
  const closePosition = useCallback(
    async (symbol: string) => {
      const position = positions.find((p: Position) => p.symbol === symbol);
      if (!position) {
        throw new Error(`No position found for ${symbol}`);
      }

      const size = Math.abs(parseFloat(position.size)).toString();
      const side = parseFloat(position.size) > 0 ? "sell" : "buy";

      return placeMarketOrder({
        symbol,
        side,
        size,
        reduceOnly: true,
      });
    },
    [positions, placeMarketOrder]
  );

  return {
    // Data
    prices,
    assets,
    spotPairs,
    positions,
    marginInfo,
    userState,
    spotUserState,

    // Loading states
    isLoading:
      pricesLoading ||
      metaLoading ||
      spotMetaLoading ||
      userStateLoading ||
      spotUserStateLoading,
    isPlacingOrder,
    isApprovingFee,

    // Actions
    getPrice,
    placeMarketOrder,
    placeLimitOrder,
    closePosition,
    approveBuilderFee,
    isBuilderFeeApproved,

    // Refetch
    refetchUserState,
    refetchSpotUserState,

    // Builder config
    builderConfigured: BUILDER_CONFIG.isConfigured,
  };
}

// Order book level type
interface OrderBookLevel {
  price: string;
  size: string;
  total: number;
}

/**
 * Hook for fetching order book data.
 */
export function useOrderBook(coin: string) {
  const { data, isLoading, error, refetch } = useL2BookQuery(
    { coin },
    { skip: !coin }
  );

  const bids = useMemo((): OrderBookLevel[] => {
    if (!data?.levels) return [];
    return data.levels[0].map((level: { px: string; sz: string; n: number }) => ({
      price: level.px,
      size: level.sz,
      total: level.n,
    }));
  }, [data]);

  const asks = useMemo((): OrderBookLevel[] => {
    if (!data?.levels) return [];
    return data.levels[1].map((level: { px: string; sz: string; n: number }) => ({
      price: level.px,
      size: level.sz,
      total: level.n,
    }));
  }, [data]);

  return {
    bids,
    asks,
    isLoading,
    error,
    refetch,
  };
}
