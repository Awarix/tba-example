"use client";

import { useState, useMemo } from "react";
import { useHyperliquid } from "@/hooks/useHyperliquid";
import { formatPrice } from "@/lib/hyperliquid/utils";

// Asset/pair info type
interface AssetItem {
  name: string;
  index?: number;
  szDecimals?: number;
  maxLeverage?: number;
  tokens?: number[];
}

interface AssetSelectorProps {
  selectedAsset: string | null;
  onSelect: (asset: string) => void;
  marketType: "perp" | "spot";
}

export function AssetSelector({
  selectedAsset,
  onSelect,
  marketType,
}: AssetSelectorProps) {
  const { assets, spotPairs, prices, isLoading } = useHyperliquid();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredAssets = useMemo((): AssetItem[] => {
    const list: AssetItem[] = marketType === "perp" ? assets : spotPairs;
    if (!search) return list.slice(0, 20); // Show top 20 by default

    const searchLower = search.toLowerCase();
    return list.filter((item: AssetItem) =>
      item.name.toLowerCase().includes(searchLower)
    );
  }, [assets, spotPairs, marketType, search]);

  const currentPrice = selectedAsset ? prices?.[selectedAsset] : null;

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-border rounded-lg" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Selected asset display / trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-elevated border border-surface rounded-xl hover:border-accent transition-all shadow-md hover:shadow-lg"
      >
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-text-primary">
            {selectedAsset ?? "Select Asset"}
          </span>
          {currentPrice && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm text-text-muted">$</span>
              <span className="text-xl font-mono font-semibold text-text-primary">
                {formatPrice(currentPrice)}
              </span>
            </div>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-surface border border-surface-elevated rounded-xl shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-surface-elevated">
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-surface-elevated rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              autoFocus
            />
          </div>

          {/* Market type tabs */}
          <div className="flex border-b border-border">
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                marketType === "perp"
                  ? "text-accent border-b-2 border-accent"
                  : "text-text-muted"
              }`}
              disabled
            >
              Perpetuals
            </button>
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                marketType === "spot"
                  ? "text-accent border-b-2 border-accent"
                  : "text-text-muted"
              }`}
              disabled
            >
              Spot
            </button>
          </div>

          {/* Asset list */}
          <div className="max-h-64 overflow-y-auto">
            {filteredAssets.map((asset: AssetItem) => {
              const price = prices?.[asset.name];
              const isSelected = asset.name === selectedAsset;

              return (
                <button
                  key={asset.name}
                  onClick={() => {
                    onSelect(asset.name);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors ${
                    isSelected ? "bg-accent/10" : ""
                  }`}
                >
                  <span
                    className={`font-medium ${isSelected ? "text-accent" : "text-text-primary"}`}
                  >
                    {asset.name}
                  </span>
                  {price && (
                    <span className="font-mono text-text-secondary">
                      ${formatPrice(price)}
                    </span>
                  )}
                </button>
              );
            })}

            {filteredAssets.length === 0 && (
              <div className="px-4 py-8 text-center text-text-muted">
                No assets found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setSearch("");
          }}
        />
      )}
    </div>
  );
}
