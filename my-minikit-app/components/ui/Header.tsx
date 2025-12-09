"use client";

import { Wallet } from "@coinbase/onchainkit/wallet";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import Link from "next/link";

export function Header() {
  const { context } = useMiniKit();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-surface-elevated shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent via-primary to-long flex items-center justify-center shadow-lg shadow-accent/20">
            <span className="text-xl font-bold text-background">H</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              HypApp
            </h1>
            <p className="text-xs text-text-muted -mt-0.5">
              Hyperliquid Trading
            </p>
          </div>
        </Link>

        {/* User info + Wallet */}
        <div className="flex items-center gap-3">
          {/* Farcaster profile */}
          {context?.user && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated">
              {context.user.pfpUrl && (
                <Image
                  src={context.user.pfpUrl}
                  alt={context.user.username ?? "User"}
                  width={24}
                  height={24}
                  className="rounded-full ring-2 ring-primary/20"
                  unoptimized
                />
              )}
              <span className="text-sm font-medium text-text-primary hidden sm:inline">
                @{context.user.username}
              </span>
            </div>
          )}

          {/* Wallet */}
          <div className="[&>div>button]:!bg-accent [&>div>button]:hover:!bg-accent/90 [&>div>button]:!text-white [&>div>button]:!rounded-lg [&>div>button]:!px-4 [&>div>button]:!py-2 [&>div>button]:!text-sm [&>div>button]:!font-medium [&>div>button]:!shadow-lg [&>div>button]:!shadow-accent/20 [&>div>button]:!transition-all">
            <Wallet />
          </div>
        </div>
      </div>
    </header>
  );
}
