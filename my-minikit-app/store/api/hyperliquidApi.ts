import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getInfoClient, getExchangeClient } from "@/lib/hyperliquid/client";
import type { WalletClient } from "viem";

// Define our own response types based on the SDK's response types
// Using inferred types from the SDK methods
type InfoClient = ReturnType<typeof getInfoClient>;

// Response types (inferred from SDK)
export type AllMids = Awaited<ReturnType<InfoClient["allMids"]>>;
export type Meta = Awaited<ReturnType<InfoClient["meta"]>>;
export type SpotMeta = Awaited<ReturnType<InfoClient["spotMeta"]>>;
export type ClearinghouseState = Awaited<ReturnType<InfoClient["clearinghouseState"]>>;
export type SpotClearinghouseState = Awaited<ReturnType<InfoClient["spotClearinghouseState"]>>;
export type L2Book = Awaited<ReturnType<InfoClient["l2Book"]>>;

// Types for our queries
interface UserStateParams {
  user: string;
}

interface L2BookParams {
  coin: string;
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
  tagTypes: ["UserState", "Prices", "OrderBook", "Meta"],
  endpoints: (builder) => ({
    // Get all mid prices
    allMids: builder.query<AllMids, void>({
      queryFn: async () => {
        try {
          const info = getInfoClient();
          const data = await info.allMids();
          return { data };
        } catch (error) {
          return { error: { message: String(error) } };
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
  usePlaceOrderMutation,
  useApproveBuilderFeeMutation,
  useUsdClassTransferMutation,
} = hyperliquidApi;
