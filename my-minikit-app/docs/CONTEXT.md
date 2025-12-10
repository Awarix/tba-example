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
6. **Chart Colors**: lightweight-charts canvas doesn't support oklch colors - must use hex/rgba.

## Key Implementation Details

### Order Sheet Design (Bybit Mobile Style)
The order form follows Bybit's professional mobile trading interface:
- **Compact Layout**: Smaller gaps (`gap-2`, `gap-3`), padding (`py-2`, `py-2.5`), and font sizes (`text-xs`, `text-sm`)
- **No Redundancy**: Removed mark price (visible on chart), TP/SL inputs, Est. Value, and Margin Required
- **Key Elements**:
  - Buy/Long and Sell/Short toggle at top (green/red)
  - Market/Limit/Settings buttons (stop orders hidden in settings)
  - Input blocks with `bg-surface-elevated` rounded backgrounds
  - Horizontal leverage bar (1x-50x)
  - Available balance display (green text)
  - Large Buy/Sell button at bottom (full-width, rounded, prominent)

### Lightweight Charts v5 API
The chart uses the new v5 API with series definitions. **Important**: Canvas rendering doesn't support oklch colors - use hex/rgba.

**React Ref Pattern:** Uses callback ref (`setContainerElement`) instead of `useRef` to ensure chart initializes after DOM element is mounted. This solves timing issues with dynamic imports (`ssr: false`).

**Event Handler Memory Management:** Click handlers must use `useRef` to store function reference. The `lightweight-charts` library requires the EXACT same function reference for both `subscribeClick` and `unsubscribeClick`. Without a ref, each effect run creates a new function, causing old listeners to accumulate and creating a memory leak where multiple handlers fire on each click.

**Preserving Zoom/Scroll Position:** Critical for UX - chart must NOT reset user's position on data updates:
- Use `series.setData()` when candle count changes (new candles added) or on initial load
- Use `series.update()` for real-time updates to existing candles (prevents full re-render)
- Only call `fitContent()` on initial load, not on subsequent updates
- Track initial load state with `isInitialLoadRef` and candle count with `previousCandlesLengthRef`
- Reset initial load flag when coin/interval changes
- This prevents the chart from losing scroll position during WebSocket updates

**Scaling Configuration:** Match TradingView's scaling behavior:
- `rightOffset: 12` - space on right side
- `barSpacing: 6` - default spacing between candles
- `minBarSpacing: 0.5` - minimum when zoomed in
- `fixLeftEdge: false`, `fixRightEdge: false` - allow scrolling beyond data
- Price scale: `top: 0.1, bottom: 0.25` margins
- Volume: uses bottom 20% of chart (`scaleMargins: { top: 0.8, bottom: 0 }`)

```typescript
import { CandlestickSeries, HistogramSeries } from "lightweight-charts";

// Use callback ref to get container element
const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);
const isInitialLoadRef = useRef(true);
const previousCandlesLengthRef = useRef(0);

// Initialize chart when container is available
useEffect(() => {
  if (!containerElement) return;
  const chart = createChart(containerElement, {
    timeScale: {
      rightOffset: 12,
      barSpacing: 6,
      minBarSpacing: 0.5,
      fixLeftEdge: false,
      fixRightEdge: false,
    },
  });
  // ...
}, [containerElement]);

// Update data without resetting position
useEffect(() => {
  const hasNewCandles = candles.length !== previousCandlesLengthRef.current;
  
  if (isInitialLoadRef.current || hasNewCandles) {
    // Use setData() when new candles are added
    series.setData(allCandles);
    
    if (isInitialLoadRef.current) {
      chart.timeScale().fitContent();
      isInitialLoadRef.current = false;
    }
  } else {
    // Use update() for real-time updates to preserve scroll
    series.update(lastCandle);
  }
  
  previousCandlesLengthRef.current = candles.length;
}, [candles]);

// Reset on coin/interval change
useEffect(() => {
  isInitialLoadRef.current = true;
}, [coin, interval]);
```

Reference: [lightweight-charts API docs](https://tradingview.github.io/lightweight-charts/docs)

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
