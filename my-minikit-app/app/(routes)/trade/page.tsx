"use client";

import { useState } from "react";
import { AssetSelector } from "@/components/trading/AssetSelector";
import { MarketOrderForm } from "@/components/trading/MarketOrderForm";
import { PositionsView } from "@/components/portfolio/PositionsView";

export default function TradePage() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>("BTC");
  const [marketType] = useState<"perp" | "spot">("perp");

  return (
    <div className="flex flex-col gap-4 p-4 pb-20 max-w-lg mx-auto">
      {/* Asset selector */}
      <AssetSelector
        selectedAsset={selectedAsset}
        onSelect={setSelectedAsset}
        marketType={marketType}
      />

      {/* Order form */}
      <MarketOrderForm selectedAsset={selectedAsset} />

      {/* Positions */}
      <PositionsView />
    </div>
  );
}

