"use client";
import { ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { base } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";
import { store } from "@/store/store";
import { hyperEvm } from "@/lib/chains";

/**
 * Root provider that wraps the entire app.
 * Provides:
 * - Redux store (RTK Query)
 * - OnchainKit (MiniKit, wallet, identity)
 * - Multi-chain support (Base + HyperEVM)
 */
export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        chain={base}
        config={{
          appearance: {
            mode: "dark",
          },
          wallet: {
            display: "modal",
            preference: "all",
          },
        }}
        miniKit={{
          enabled: true,
          autoConnect: true,
          notificationProxyUrl: undefined,
        }}
      >
        {children}
      </OnchainKitProvider>
    </ReduxProvider>
  );
}

// Export chain configs for use elsewhere
export { base, hyperEvm };
