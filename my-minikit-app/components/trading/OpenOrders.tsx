"use client";

import { useAccount, useWalletClient } from "wagmi";
import { useOpenOrdersQuery, useCancelOrderMutation } from "@/store/api/hyperliquidApi";
import { formatPrice } from "@/lib/hyperliquid/utils";
import { Button } from "@/components/ui/Button";

interface OpenOrdersProps {
  onPriceClick?: (price: string) => void;
}

/**
 * List of open orders with cancel functionality
 */
export function OpenOrders({ onPriceClick }: OpenOrdersProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { data: orders, isLoading, refetch } = useOpenOrdersQuery(
    { user: address ?? "" },
    { skip: !address, pollingInterval: 5000 }
  );
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

  const handleCancel = async (coin: string, oid: number) => {
    if (!walletClient) return;
    try {
      await cancelOrder({ wallet: walletClient, coin, oid }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-muted">
        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-sm">Connect wallet to view orders</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-muted">
        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm">No open orders</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-surface-elevated">
      {orders.map((order) => {
        const isBuy = order.side === "B";
        const filled = parseFloat(order.origSz) - parseFloat(order.sz);
        const fillPercent = (filled / parseFloat(order.origSz)) * 100;

        return (
          <div key={order.oid} className="p-3">
            <div className="flex items-start justify-between mb-2">
              {/* Order info */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    isBuy ? "bg-long/10 text-long" : "bg-short/10 text-short"
                  }`}>
                    {isBuy ? "LONG" : "SHORT"}
                  </span>
                  <span className="font-semibold text-text-primary">{order.coin}</span>
                </div>
                <button
                  onClick={() => onPriceClick?.(order.limitPx)}
                  className="font-mono text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  @ ${formatPrice(order.limitPx)}
                </button>
              </div>

              {/* Cancel button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCancel(order.coin, order.oid)}
                isLoading={isCancelling}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>

            {/* Size and fill info */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">
                Size: <span className="font-mono text-text-secondary">{parseFloat(order.sz).toFixed(4)}</span>
                {filled > 0 && (
                  <span className="text-long ml-1">
                    ({fillPercent.toFixed(1)}% filled)
                  </span>
                )}
              </span>
              <span className="text-text-muted">
                {new Date(order.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Fill progress bar */}
            {filled > 0 && (
              <div className="mt-2 h-1 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-long rounded-full transition-all"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default OpenOrders;
