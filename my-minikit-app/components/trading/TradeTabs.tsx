"use client";

import { type ReactNode } from "react";

export type TradeTab = "orderbook" | "orders" | "history";

interface TradeTabsProps {
  activeTab: TradeTab;
  onTabChange: (tab: TradeTab) => void;
  orderBookContent: ReactNode;
  ordersContent: ReactNode;
  historyContent: ReactNode;
  openOrdersCount?: number;
}

const TABS: { id: TradeTab; label: string }[] = [
  { id: "orderbook", label: "Book" },
  { id: "orders", label: "Orders" },
  { id: "history", label: "History" },
];

/**
 * Tabbed container for Order Book, Open Orders, and Trade History
 * Mobile-first swipeable design
 */
export function TradeTabs({
  activeTab,
  onTabChange,
  orderBookContent,
  ordersContent,
  historyContent,
  openOrdersCount = 0,
}: TradeTabsProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-surface">
      {/* Tab headers */}
      <div className="flex items-center border-b border-surface-elevated">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === tab.id
                ? "text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {tab.label}
              {tab.id === "orders" && openOrdersCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-bold bg-accent text-white rounded-full min-w-[18px]">
                  {openOrdersCount}
                </span>
              )}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "orderbook" && orderBookContent}
        {activeTab === "orders" && ordersContent}
        {activeTab === "history" && historyContent}
      </div>
    </div>
  );
}

export default TradeTabs;
