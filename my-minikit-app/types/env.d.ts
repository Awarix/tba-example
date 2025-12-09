/**
 * Type definitions for environment variables.
 */

declare namespace NodeJS {
  interface ProcessEnv {
    // App
    NEXT_PUBLIC_URL: string;
    NEXT_PUBLIC_ONCHAINKIT_API_KEY: string;

    // Hyperliquid
    NEXT_PUBLIC_HYPERLIQUID_TESTNET?: string;
    NEXT_PUBLIC_HYPERLIQUID_BUILDER_ADDRESS?: string;
    NEXT_PUBLIC_HYPERLIQUID_BUILDER_FEE_BPS?: string;

    // Database
    DATABASE_URL?: string;

    // 1inch
    ONEINCH_API_KEY?: string;

    // Neynar
    NEYNAR_API_KEY?: string;
  }
}

