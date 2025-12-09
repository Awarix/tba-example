"use client";

interface StickyTradeBarProps {
  onLongClick: () => void;
  onShortClick: () => void;
  disabled?: boolean;
  coin?: string;
}

/**
 * Sticky bottom bar with Long/Short buttons
 * Always visible above navigation
 */
export function StickyTradeBar({
  onLongClick,
  onShortClick,
  disabled = false,
  coin = "",
}: StickyTradeBarProps) {
  return (
    <div className="fixed bottom-16 left-0 right-0 z-20 px-4 py-3 bg-surface/95 backdrop-blur-sm border-t border-surface-elevated">
      <div className="flex gap-3 max-w-7xl mx-auto">
        <button
          onClick={onLongClick}
          disabled={disabled}
          className="flex-1 py-3.5 rounded-xl font-bold text-base bg-long text-background hover:bg-long/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          Long {coin}
        </button>
        <button
          onClick={onShortClick}
          disabled={disabled}
          className="flex-1 py-3.5 rounded-xl font-bold text-base bg-short text-white hover:bg-short/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          Short {coin}
        </button>
      </div>
    </div>
  );
}

export default StickyTradeBar;
