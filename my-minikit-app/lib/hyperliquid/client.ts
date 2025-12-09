import {
  InfoClient,
  ExchangeClient,
  SubscriptionClient,
  HttpTransport,
  WebSocketTransport,
} from "@nktkas/hyperliquid";
import type { WalletClient } from "viem";

/**
 * Hyperliquid client configuration and factories.
 * Uses @nktkas/hyperliquid SDK for fully-typed API access.
 */

// Singleton InfoClient for read operations (no wallet needed)
let infoClient: InfoClient | null = null;
let subscriptionClient: SubscriptionClient | null = null;

/**
 * Get the singleton InfoClient for read-only operations.
 * Creates a new instance if one doesn't exist.
 */
export function getInfoClient(): InfoClient {
  if (!infoClient) {
    infoClient = new InfoClient({
      transport: new HttpTransport({
        // Mainnet by default - set NEXT_PUBLIC_HYPERLIQUID_TESTNET=true for testnet
        isTestnet: process.env.NEXT_PUBLIC_HYPERLIQUID_TESTNET === "true",
      }),
    });
  }
  return infoClient;
}

/**
 * Get the singleton SubscriptionClient for real-time updates.
 * Creates a new instance if one doesn't exist.
 */
export function getSubscriptionClient(): SubscriptionClient {
  if (!subscriptionClient) {
    subscriptionClient = new SubscriptionClient({
      transport: new WebSocketTransport({
        // Mainnet by default - set NEXT_PUBLIC_HYPERLIQUID_TESTNET=true for testnet
        isTestnet: process.env.NEXT_PUBLIC_HYPERLIQUID_TESTNET === "true",
      }),
    });
  }
  return subscriptionClient;
}

/**
 * Wrapper to adapt viem WalletClient to the SDK's expected wallet interface.
 * The SDK expects a wallet that can sign typed data.
 */
function createWalletAdapter(walletClient: WalletClient) {
  return {
    address: walletClient.account?.address,
    signTypedData: async (params: {
      domain: {
        name: string;
        version: string;
        chainId: number;
        verifyingContract: `0x${string}`;
      };
      types: { [key: string]: { name: string; type: string }[] };
      primaryType: string;
      message: Record<string, unknown>;
    }) => {
      if (!walletClient.account) {
        throw new Error("No account connected to wallet client");
      }
      return walletClient.signTypedData({
        account: walletClient.account,
        domain: params.domain,
        types: params.types,
        primaryType: params.primaryType,
        message: params.message,
      });
    },
  };
}

/**
 * Create an ExchangeClient for trading operations.
 * Requires a wallet for signing transactions.
 *
 * Note: This creates a new client each time because the wallet may change.
 * The wallet from MiniKit/wagmi is used for signing.
 */
export function getExchangeClient(wallet: WalletClient) {
  const walletAdapter = createWalletAdapter(wallet);
  
  // Using type assertion due to SDK type complexity with wallet adapters
  // The wallet adapter we create is compatible with the SDK's expectations
  return new ExchangeClient({
    transport: new HttpTransport({
      isTestnet: process.env.NEXT_PUBLIC_HYPERLIQUID_TESTNET === "true",
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wallet: walletAdapter as any,
  });
}

/**
 * Builder fee configuration.
 * Used to charge fees on all trades through our app.
 */
export const BUILDER_CONFIG = {
  get address(): string | undefined {
    return process.env.NEXT_PUBLIC_HYPERLIQUID_BUILDER_ADDRESS;
  },
  get feeBps(): number {
    return parseInt(process.env.NEXT_PUBLIC_HYPERLIQUID_BUILDER_FEE_BPS ?? "10");
  },
  get isConfigured(): boolean {
    return !!this.address;
  },
} as const;

/**
 * Helper to create builder fee params for orders.
 * Returns undefined if builder is not configured.
 */
export function getBuilderParams():
  | { b: string; f: number }
  | undefined {
  if (!BUILDER_CONFIG.isConfigured || !BUILDER_CONFIG.address) {
    return undefined;
  }
  return {
    b: BUILDER_CONFIG.address,
    f: BUILDER_CONFIG.feeBps,
  };
}
