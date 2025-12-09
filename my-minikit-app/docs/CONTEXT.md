# Current Context

## Status: Phase 2A Complete ✅

Phase 2A has been implemented with full trading functionality including:
- TradingView candlestick chart with real-time updates
- Order book visualization with depth bars
- Limit and stop orders support
- Trade persistence API
- Mobile-first DEXScreener-inspired layout

## Completed

### Phase 1: MVP Foundation
- **Tailwind 4.1** with oklch color theme configured
- **Drizzle ORM** + Neon schema for trades table
- **RTK Query** store with Hyperliquid API endpoints
- **Multi-chain support** (Base + HyperEVM)
- Basic trading UI with market orders

### Phase 2A: Trading Core
- **TradingView Candlestick Chart** using lightweight-charts v5
  - Full-width responsive chart
  - Multiple timeframes (1m, 5m, 15m, 1H, 4H, 1D)
  - Click-to-set limit price
  - Draggable TP/SL lines
  - Volume histogram overlay
  - Drawing tools sidebar
- **Order Book Component**
  - Real-time bid/ask updates via WebSocket
  - Horizontal depth bars
  - Click price level to set limit order
  - Spread indicator
- **Advanced Order Types**
  - Market orders (existing)
  - Limit orders (GTC)
  - Stop orders
  - TP/SL integration
- **Trade Persistence**
  - `/api/trades` route (POST, GET, PATCH)
  - Trade history stored in Neon PostgreSQL
  - Order type tracking
- **Mobile-First Layout** (DEXScreener-inspired)
  - Full-width chart at top (~45vh)
  - Tabbed sections (Book, Orders, History)
  - Sticky Long/Short buttons
  - Bottom sheet order form
  - Asset selector modal

### Components Created
| Component | Purpose |
|-----------|---------|
| `TradingChart.tsx` | Candlestick chart with lightweight-charts v5 |
| `ChartHeader.tsx` | Compact asset/price header |
| `IntervalPills.tsx` | Timeframe selector |
| `ChartToolbar.tsx` | Drawing tools sidebar |
| `OrderBook.tsx` | Bid/ask depth visualization |
| `OrderForm.tsx` | Full order form (desktop) |
| `OrderSheet.tsx` | Bottom sheet order form (mobile) |
| `OpenOrders.tsx` | Open orders list with cancel |
| `TradeHistory.tsx` | Executed trades list |
| `TradeTabs.tsx` | Tabbed container |
| `StickyTradeBar.tsx` | Fixed Long/Short buttons |

## In Progress

None - Phase 2A complete, ready for testing.

## Known Issues

1. **MetaMask SDK Warning**: Build shows warning about `@react-native-async-storage/async-storage` - harmless.
2. **Funding Hooks**: `useFundHL` has placeholder implementations for 1inch Fusion and CCTP.
3. **SDK Type Inference**: The `@nktkas/hyperliquid` SDK incorrectly types some responses; we use type assertions.
4. **Trade History**: Not yet connected to actual API (mock data in component).
5. **Open Orders Count**: Badge in TradeTabs not connected to actual query.

## Key Implementation Details

### Lightweight Charts v5 API
The chart uses the new v5 API with series definitions:

```typescript
import { CandlestickSeries, HistogramSeries } from "lightweight-charts";

// Create series with v5 API
const candleSeries = chart.addSeries(CandlestickSeries, {
  upColor: "oklch(0.72 0.22 145)",
  downColor: "oklch(0.65 0.24 25)",
  // ...
});
```

### Candle Data WebSocket
Real-time candle updates via RTK Query streaming:

```typescript
candleSnapshot: builder.query<Candle[], CandleSnapshotParams>({
  queryFn: async ({ coin, interval }) => {
    const info = getInfoClient();
    const result = await info.candleSnapshot({ coin, interval, startTime, endTime });
    return { data: result };
  },
  onCacheEntryAdded: async ({ coin, interval }, { updateCachedData, cacheDataLoaded }) => {
    await cacheDataLoaded;
    const ws = getSubscriptionClient();
    await ws.candle({ coin, interval }, (data) => {
      updateCachedData((draft) => {
        // Update or add candle
      });
    });
  },
});
```

### Mobile-First Layout Pattern
Trade page follows DEXScreener's mobile UX:
- Vertical stacking (no side-by-side columns on mobile)
- Bottom sheet for order entry
- Sticky trade buttons above navigation
- Swipeable tabs for data sections

### Database Schema Update
Added `orderType` and `leverage` fields to trades table:

```typescript
export const trades = pgTable("trades", {
  // ...
  orderType: text("order_type").notNull().default("market"), // market | limit | stop | tp | sl
  leverage: integer("leverage").default(1),
  // ...
});
```

## Next Steps (Phase 2B+)

1. **Connect Trade History UI** to actual `/api/trades` endpoint
2. **Wire Open Orders count** badge to query
3. **Implement funding flow** (1inch Fusion / CCTP)
4. **Neynar integration** for social features
5. **Share trades** to Farcaster
6. **Leaderboard** implementation

## Environment Variables Required
```env
DATABASE_URL=           # Neon PostgreSQL
NEXT_PUBLIC_ONCHAINKIT_API_KEY=
NEXT_PUBLIC_HYPERLIQUID_TESTNET=true|false
HYPERLIQUID_BUILDER_ADDRESS=
HYPERLIQUID_BUILDER_FEE_BPS=
```
