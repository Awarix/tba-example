"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import dynamic from "next/dynamic";

// Components
import { ChartHeader } from "@/components/trading/ChartHeader";
import { IntervalPills } from "@/components/trading/IntervalPills";
import { ChartToolbar, type DrawingTool } from "@/components/trading/ChartToolbar";
import { TradeTabs, type TradeTab } from "@/components/trading/TradeTabs";
import { OrderBook } from "@/components/trading/OrderBook";
import { OpenOrders } from "@/components/trading/OpenOrders";
import { TradeHistory } from "@/components/trading/TradeHistory";
import { StickyTradeBar } from "@/components/trading/StickyTradeBar";
import { OrderSheet } from "@/components/trading/OrderSheet";
import { AssetSelector } from "@/components/trading/AssetSelector";

// Types
import type { CandleInterval } from "@/store/api/hyperliquidApi";

// Dynamic import for chart (client-side only due to lightweight-charts)
const TradingChart = dynamic(
  () => import("@/components/trading/TradingChart").then((mod) => mod.TradingChart),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-surface">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    ),
  }
);

/**
 * Trade page with mobile-first, DEXScreener-inspired layout
 * - Full-width chart at top
 * - Tabbed sections below (Order Book, Orders, History)
 * - Sticky Long/Short buttons above navigation
 * - Bottom sheet order form
 */
export default function TradePage() {
  const { isConnected } = useAccount();

  // Asset selection
  const [selectedAsset, setSelectedAsset] = useState<string | null>("BTC");
  const [showAssetSelector, setShowAssetSelector] = useState(false);

  // Chart state
  const [interval, setInterval] = useState<CandleInterval>("15m");
  const [drawingTool, setDrawingTool] = useState<DrawingTool>("cursor");

  // Tab state
  const [activeTab, setActiveTab] = useState<TradeTab>("orderbook");

  // Order sheet state
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");

  // Price lines for chart
  const [limitPrice, setLimitPrice] = useState<number | null>(null);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | null>(null);
  const [stopLossPrice, setStopLossPrice] = useState<number | null>(null);

  // Handle price click from chart or order book
  const handlePriceClick = useCallback((price: number | string) => {
    const priceNum = typeof price === "string" ? parseFloat(price) : price;
    setLimitPrice(priceNum);
    // Open order sheet if not already open
    if (!orderSheetOpen) {
      setOrderSheetOpen(true);
    }
  }, [orderSheetOpen]);

  // Handle Long button click
  const handleLongClick = useCallback(() => {
    setOrderSide("buy");
    setOrderSheetOpen(true);
  }, []);

  // Handle Short button click
  const handleShortClick = useCallback(() => {
    setOrderSide("sell");
    setOrderSheetOpen(true);
  }, []);

  // Handle asset selection
  const handleAssetSelect = useCallback((asset: string | null) => {
    setSelectedAsset(asset);
    setShowAssetSelector(false);
    // Reset price lines on asset change
    setLimitPrice(null);
    setTakeProfitPrice(null);
    setStopLossPrice(null);
  }, []);

  return (
    <div className="flex flex-col min-h-screen pb-32">
      {/* Chart Header - compact asset info */}
      <ChartHeader
        coin={selectedAsset ?? "BTC"}
        onCoinClick={() => setShowAssetSelector(true)}
      />

      {/* Interval Pills */}
      <IntervalPills
        interval={interval}
        onIntervalChange={setInterval}
      />

      {/* Chart Section */}
      <div className="relative flex-shrink-0 h-[45vh] min-h-[280px] max-h-[400px] bg-surface">
        {/* Chart */}
        {selectedAsset && (
          <TradingChart
            coin={selectedAsset}
            interval={interval}
            onPriceClick={handlePriceClick}
            entryPrice={null}
            takeProfitPrice={takeProfitPrice}
            stopLossPrice={stopLossPrice}
            onTakeProfitDrag={setTakeProfitPrice}
            onStopLossDrag={setStopLossPrice}
          />
        )}

        {/* Drawing Tools Toolbar */}
        <ChartToolbar
          activeTool={drawingTool}
          onToolChange={setDrawingTool}
        />
      </div>

      {/* Tabbed Sections */}
      <div className="flex-1 min-h-[200px]">
        <TradeTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          openOrdersCount={0} // TODO: Connect to actual count
          orderBookContent={
            <OrderBook
              coin={selectedAsset ?? "BTC"}
              onPriceClick={(price) => handlePriceClick(price)}
              maxRows={8}
            />
          }
          ordersContent={
            <OpenOrders
              onPriceClick={(price) => handlePriceClick(price)}
            />
          }
          historyContent={
            <TradeHistory
              trades={[]} // TODO: Connect to actual trade history
              isLoading={false}
            />
          }
        />
      </div>

      {/* Sticky Trade Bar */}
      <StickyTradeBar
        onLongClick={handleLongClick}
        onShortClick={handleShortClick}
        disabled={!isConnected || !selectedAsset}
        coin={selectedAsset ?? ""}
      />

      {/* Order Sheet (Bottom Sheet) */}
      <OrderSheet
        isOpen={orderSheetOpen}
        onClose={() => setOrderSheetOpen(false)}
        side={orderSide}
        coin={selectedAsset ?? "BTC"}
        initialPrice={limitPrice}
        onPriceChange={setLimitPrice}
        onTpChange={setTakeProfitPrice}
        onSlChange={setStopLossPrice}
      />

      {/* Asset Selector Modal */}
      {showAssetSelector && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowAssetSelector(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-surface rounded-t-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 rounded-full bg-surface-elevated" />
            </div>
            <div className="px-4 pb-4">
              <h2 className="text-lg font-bold text-text-primary mb-4">Select Asset</h2>
              <AssetSelector
                selectedAsset={selectedAsset}
                onSelect={handleAssetSelect}
                marketType="perp"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
