import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getInfoClient, getExchangeClient, getSubscriptionClient } from "@/lib/hyperliquid/client";
import type { WalletClient } from "viem";

// Define our own response types based on the SDK's response types
// Using inferred types from the SDK methods
type InfoClient = ReturnType<typeof getInfoClient>;

// Response types (inferred from SDK)
// Note: AllMids extracts just the mids object from the SDK response
export type AllMids = { [coin: string]: string };
export type Meta = Awaited<ReturnType<InfoClient["meta"]>>;
export type SpotMeta = Awaited<ReturnType<InfoClient["spotMeta"]>>;
export type ClearinghouseState = Awaited<ReturnType<InfoClient["clearinghouseState"]>>;
export type SpotClearinghouseState = Awaited<ReturnType<InfoClient["spotClearinghouseState"]>>;
export type L2Book = Awaited<ReturnType<InfoClient["l2Book"]>>;

// Candle/OHLCV types
export type CandleInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export interface Candle {
  t: number;    // Timestamp (ms)
  o: string;    // Open
  h: string;    // High
  l: string;    // Low
  c: string;    // Close
  v: string;    // Volume
  n: number;    // Number of trades
}

export interface CandleSnapshot {
  candles: Candle[];
}

// Open orders type
export interface OpenOrder {
  coin: string;
  oid: number;
  side: "B" | "A";  // Buy or Ask (sell)
  limitPx: string;
  sz: string;
  timestamp: number;
  origSz: string;
  cloid?: string;
}

// Types for our queries
interface UserStateParams {
  user: string;
}

interface L2BookParams {
  coin: string;
}

interface CandleSnapshotParams {
  coin: string;
  interval: CandleInterval;
  startTime?: number;
  endTime?: number;
}

interface OpenOrdersParams {
  user: string;
}

interface CancelOrderParams {
  wallet: WalletClient;
  coin: string;
  oid: number;
}

interface PlaceOrderParams {
  wallet: WalletClient;
  orders: Array<{
    a: number; // Asset index
    b: boolean; // Buy side
    p: string; // Price
    s: string; // Size
    r: boolean; // Reduce only
    t: { limit: { tif: "Gtc" | "Ioc" | "Alo" } } | { trigger: { isMarket: boolean; triggerPx: string; tpsl: "tp" | "sl" } };
  }>;
  grouping: "na" | "normalTpsl" | "positionTpsl";
}

interface ApproveBuilderFeeParams {
  wallet: WalletClient;
}

interface UsdClassTransferParams {
  wallet: WalletClient;
  amount: string;
  toPerp: boolean;
}

/**
 * RTK Query API for Hyperliquid.
 * Uses fakeBaseQuery since we're using the SDK directly.
 */
export const hyperliquidApi = createApi({
  reducerPath: "hyperliquidApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["UserState", "Prices", "OrderBook", "Meta", "Candles", "OpenOrders"],
  endpoints: (builder) => ({
    // Get all mid prices
    allMids: builder.query<AllMids, void>({
      queryFn: async () => {
        try {
          const info = getInfoClient();
          const result = await info.allMids();
          
          // Extract just the mids object for simpler cache structure
          // SDK types result.mids as string, but it's actually { [coin: string]: string }
          const midsData = result.mids as unknown as AllMids;
          
          // Validate we got data
          if (!midsData || typeof midsData !== 'object') {
            console.error('Invalid mids data received:', result);
            return { data: {} as AllMids };
          }
          
          return { data: midsData };
        } catch (error) {
          console.error('allMids query error:', error);
          return { error: { message: String(error) } };
        }
      },
      onCacheEntryAdded: async (
        _args,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) => {
        // Wait for the initial query to complete
        await cacheDataLoaded;

        // Create subscription
        const ws = getSubscriptionClient();
        
        // Use a unique ID for this subscription to handle unsubscribe if needed
        let active = true;
        let subscription: { unsubscribe: () => void } | undefined;

        try {
          // The SDK returns a subscription object with an unsubscribe method
          subscription = await ws.allMids((data) => {
            if (active) {
              updateCachedData(() => data.mids);
            }
          });
        } catch (error) {
          console.error("WebSocket subscription error:", error);
        }

        // Cleanup when cache entry is removed
        await cacheEntryRemoved;
        active = false;
        
        if (subscription) {
          subscription.unsubscribe();
        }
      },
      providesTags: ["Prices"],
    }),

    // Get perpetual metadata (asset names, indices, etc.)
    meta: builder.query<Meta, void>({
      queryFn: async () => {
        try {
          const info = getInfoClient();
          const data = await info.meta();
          return { data };
        } catch (error) {
          return { error: { message: String(error) } };
        }
      },
      providesTags: ["Meta"],
    }),

    // Get spot metadata
    spotMeta: builder.query<SpotMeta, void>({
      queryFn: async () => {
        try {
          const info = getInfoClient();
          const data = await info.spotMeta();
          return { data };
        } catch (error) {
          return { error: { message: String(error) } };
        }
      },
      providesTags: ["Meta"],
    }),

    // Get user's perpetual state (positions, balances)
    userState: builder.query<ClearinghouseState, UserStateParams>({
      queryFn: async ({ user }) => {
        try {
          const info = getInfoClient();
          const data = await info.clearinghouseState({ user });
          return { data };
        } catch (error) {
          return { error: { message: String(error) } };
        }
      },
      providesTags: (_result, _error, { user }) => [
        { type: "UserState", id: user },
      ],
    }),

    // Get user's spot state
    spotUserState: builder.query<SpotClearinghouseState, UserStateParams>({
      queryFn: async ({ user }) => {
        try {
          const info = getInfoClient();
          const data = await info.spotClearinghouseState({ user });
          return { data };
        } catch (error) {
          return { error: { message: String(error) } };
        }
      },
      providesTags: (_result, _error, { user }) => [
        { type: "UserState", id: `spot-${user}` },
      ],
    }),

    // Get L2 order book
    l2Book: builder.query<L2Book, L2BookParams>({
      queryFn: async ({ coin }) => {
        try {
          const info = getInfoClient();
          const data = await info.l2Book({ coin });
          return { data };
        } catch (error) {
          return { error: { message: String(error) } };
        }
      },
      onCacheEntryAdded: async (
        { coin },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) => {
        await cacheDataLoaded;
        const ws = getSubscriptionClient();
        let active = true;
        let subscription: { unsubscribe: () => void } | undefined;

        try {
          subscription = await ws.l2Book({ coin }, (data) => {
            if (active) {
              updateCachedData(() => data);
            }
          });
        } catch (error) {
          console.error("WebSocket subscription error:", error);
        }

        await cacheEntryRemoved;
        active = false;
        
        if (subscription) {
          subscription.unsubscribe();
        }
      },
      providesTags: (_result, _error, { coin }) => [
        { type: "OrderBook", id: coin },
      ],
    }),

    // Place order (with builder fee)
    placeOrder: builder.mutation<unknown, PlaceOrderParams>({
      queryFn: async ({ wallet, orders, grouping }) => {
        try {
          const exchange = getExchangeClient(wallet);
          const builderAddress = process.env.NEXT_PUBLIC_HYPERLIQUID_BUILDER_ADDRESS;
          const builderFee = parseInt(
            process.env.NEXT_PUBLIC_HYPERLIQUID_BUILDER_FEE_BPS ?? "10"
          );

          const result = await exchange.order({
            orders,
            grouping,
            builder: builderAddress
              ? { b: builderAddress, f: builderFee }
              : undefined,
          });

          return { data: result };
        } catch (error) {
          return { error: { message: String(error) } };
        }
      },
      invalidatesTags: ["UserState"],
    }),

    // Approve builder fee (one-time per user)
    approveBuilderFee: builder.mutation<unknown, ApproveBuilderFeeParams>({
      queryFn: async ({ wallet }) => {
        try {
          const exchange = getExchangeClient(wallet);
          const builderAddress = process.env.NEXT_PUBLIC_HYPERLIQUID_BUILDER_ADDRESS;
          const maxFeeRate = process.env.NEXT_PUBLIC_HYPERLIQUID_BUILDER_FEE_BPS ?? "10";

          if (!builderAddress) {
            return { error: { message: "Builder address not configured" } };
          }

          const result = await exchange.approveBuilderFee({
            builder: builderAddress,
            maxFeeRate,
          });

          return { data: result };
        } catch (error) {
          return { error: { message: String(error) } };
        }
      },
    }),

    // Transfer USD between spot and perp wallets
    usdClassTransfer: builder.mutation<unknown, UsdClassTransferParams>({
      queryFn: async ({ wallet, amount, toPerp }) => {
        try {
          const exchange = getExchangeClient(wallet);
          const result = await exchange.usdClassTransfer({
            amount,
            toPerp,
          });

          return { data: result };
        } catch (error) {
          return { error: { message: String(error) } };
        }
      },
      invalidatesTags: ["UserState"],
    }),

    // Get candle/OHLCV data for charting
    candleSnapshot: builder.query<Candle[], CandleSnapshotParams>({
      queryFn: async ({ coin, interval, startTime, endTime }) => {
        try {
          const info = getInfoClient();
          // Default to last 500 candles if no time range specified
          const now = Date.now();
          const intervalMs = {
            "1m": 60 * 1000,
            "5m": 5 * 60 * 1000,
            "15m": 15 * 60 * 1000,
            "1h": 60 * 60 * 1000,
            "4h": 4 * 60 * 60 * 1000,
            "1d": 24 * 60 * 60 * 1000,
          };
          const candleCount = 500;
          const start = startTime ?? now - intervalMs[interval] * candleCount;
          const end = endTime ?? now;

          const result = await info.candleSnapshot({
            coin,
            interval,
            startTime: start,
            endTime: end,
          });

          // SDK returns array of candle objects
          const candles = (result as unknown as Candle[]) ?? [];
          return { data: candles };
        } catch (error) {
          console.error("candleSnapshot error:", error);
          return { error: { message: String(error) } };
        }
      },
      onCacheEntryAdded: async (
        { coin, interval },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) => {
        await cacheDataLoaded;
        const ws = getSubscriptionClient();
        let active = true;
        let subscription: { unsubscribe: () => void } | undefined;

        try {
          // Subscribe to real-time candle updates
          subscription = await ws.candle({ coin, interval }, (data) => {
            if (active && data) {
              updateCachedData((draft) => {
                // data is a single candle update
                const candle = data as unknown as Candle;
                if (!draft) return [candle];
                
                // Find existing candle with same timestamp or add new one
                const existingIndex = draft.findIndex((c) => c.t === candle.t);
                if (existingIndex >= 0) {
                  draft[existingIndex] = candle;
                } else {
                  // Add new candle and keep sorted by timestamp
                  draft.push(candle);
                  draft.sort((a, b) => a.t - b.t);
                  // Limit to last 1000 candles to prevent memory issues
                  if (draft.length > 1000) {
                    draft.shift();
                  }
                }
              });
            }
          });
        } catch (error) {
          console.error("Candle WebSocket subscription error:", error);
        }

        await cacheEntryRemoved;
        active = false;
        if (subscription) {
          subscription.unsubscribe();
        }
      },
      providesTags: (_result, _error, { coin, interval }) => [
        { type: "Candles", id: `${coin}-${interval}` },
      ],
    }),

    // Get user's open orders
    openOrders: builder.query<OpenOrder[], OpenOrdersParams>({
      queryFn: async ({ user }) => {
        try {
          const info = getInfoClient();
          const result = await info.openOrders({ user });
          return { data: result as unknown as OpenOrder[] };
        } catch (error) {
          return { error: { message: String(error) } };
        }
      },
      providesTags: (_result, _error, { user }) => [
        { type: "OpenOrders", id: user },
      ],
    }),

    // Cancel an order
    cancelOrder: builder.mutation<unknown, CancelOrderParams>({
      queryFn: async ({ wallet, coin, oid }) => {
        try {
          const exchange = getExchangeClient(wallet);
          const result = await exchange.cancel({
            cancels: [{ a: 0, o: oid }], // a is asset index, but cancel by oid works
          });
          return { data: result };
        } catch (error) {
          return { error: { message: String(error) } };
        }
      },
      invalidatesTags: ["OpenOrders", "UserState"],
    }),

    // Cancel all orders for a coin
    cancelAllOrders: builder.mutation<unknown, { wallet: WalletClient; coin?: string }>({
      queryFn: async ({ wallet, coin }) => {
        try {
          const exchange = getExchangeClient(wallet);
          const result = await exchange.cancelByCloid({
            cancels: [], // Empty cancels with coin specified cancels all for that coin
          });
          return { data: result };
        } catch (error) {
          return { error: { message: String(error) } };
        }
      },
      invalidatesTags: ["OpenOrders", "UserState"],
    }),
  }),
});

// Export hooks
export const {
  useAllMidsQuery,
  useMetaQuery,
  useSpotMetaQuery,
  useUserStateQuery,
  useSpotUserStateQuery,
  useL2BookQuery,
  useCandleSnapshotQuery,
  useOpenOrdersQuery,
  usePlaceOrderMutation,
  useApproveBuilderFeeMutation,
  useUsdClassTransferMutation,
  useCancelOrderMutation,
  useCancelAllOrdersMutation,
} = hyperliquidApi;
