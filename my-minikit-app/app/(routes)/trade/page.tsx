"use client";

import { useState } from "react";
import { AssetSelector } from "@/components/trading/AssetSelector";
import { MarketOrderForm } from "@/components/trading/MarketOrderForm";
import { PositionsView } from "@/components/portfolio/PositionsView";

export default function TradePage() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>("BTC");
  const [marketType] = useState<"perp" | "spot">("perp");

  return (
    <div className="min-h-screen pb-24">
      {/* Top section with asset selector */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-surface-elevated">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <AssetSelector
            selectedAsset={selectedAsset}
            onSelect={setSelectedAsset}
            marketType={marketType}
          />
        </div>
      </div>

      {/* Main trading interface */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Order Form */}
          <div className="lg:col-span-1">
            <MarketOrderForm selectedAsset={selectedAsset} />
          </div>

          {/* Right column: Positions & Market Info */}
          <div className="lg:col-span-2 space-y-6">
            <PositionsView />
          </div>
        </div>
      </div>
    </div>
  );
}

