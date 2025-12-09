"use client";

import { Wallet } from "@coinbase/onchainkit/wallet";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Image from "next/image";

export function Header() {
  const { context } = useMiniKit();

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo/Title */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-text-primary">HypApp</span>
        </div>

        {/* User info + Wallet */}
        <div className="flex items-center gap-3">
          {/* Farcaster profile */}
          {context?.user && (
            <div className="flex items-center gap-2">
              {context.user.pfpUrl && (
                <Image
                  src={context.user.pfpUrl}
                  alt={context.user.username ?? "User"}
                  width={28}
                  height={28}
                  className="rounded-full"
                  unoptimized
                />
              )}
              <span className="text-sm text-text-secondary hidden sm:inline">
                @{context.user.username}
              </span>
            </div>
          )}

          {/* Wallet */}
          <Wallet />
        </div>
      </div>
    </header>
  );
}
