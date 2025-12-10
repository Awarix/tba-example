# Changelog

## [0.2.3] - 2025-12-10

### Changed
- **Order Sheet Redesign** (Bybit mobile app style)
  - Removed mark price display (user sees it on chart above)
  - Redesigned Buy/Long and Sell/Short toggle with cleaner styling
  - Created Bybit-style input blocks for Limit Price and Size with rounded backgrounds
  - Moved stop orders to settings icon (visual indicator only)
  - Removed TP/SL, Est. Value, and Margin Required displays
  - Added Available HL USD balance display (green text)
  - Added large Buy/Sell button at bottom (full-width, rounded)
  - Redesigned leverage selector as horizontal bar (1x, 5x, 10x, 28x, 50x)
  - Improved spacing and sizing to match Bybit's compact mobile layout
  - Smaller gaps, padding, and font sizes for professional appearance

### Fixed
- **Chart Click Handler Duplicate**: Removed duplicate chart click subscription that caused `onPriceClick` to fire twice
  - Click handler was subscribed in both initialization effect and dedicated click effect
  - Kept only the dedicated effect which properly handles callback updates
- **Order Sheet Price Sync**: Re-added parent callback sync for price changes
  - `onPriceChange` callback now properly called when user changes price
  - Parent state stays in sync when user manually changes prices
- **Limit Order Validation**: Added validation to prevent submitting limit orders without a price
  - Shows error message: "Please enter a valid limit price"
  - Prevents API errors from empty price submissions
- **Chart Data Display on Scroll**: Fixed empty chart when scaling timeline beyond default range
  - Use `setData()` only when new candles are added (length changes) or on initial load
  - Use `update()` for real-time updates to existing candles to prevent full re-renders
  - Prevents chart from losing scroll position on WebSocket updates
  - Only `fitContent()` is called on initial load to preserve zoom/scroll
- **TP/SL Persistence**: Removed effects that cleared TP/SL values on order sheet open
  - TP/SL values set via chart dragging now persist when opening order form
  - Order sheet no longer interferes with chart-based TP/SL management
- **Volume Price Scale Display**: Hidden volume price scale labels from chart
  - Configured volume series to use hidden left price scale (`priceScaleId: "left"`)
  - Added `leftPriceScale: { visible: false }` to chart configuration
  - Removed confusing volume numbers appearing on right side
  - Volume histogram still visible but without distracting price labels
  - Only candlestick price scale now shown, matching professional trading interfaces
- **Wallet Connection Pre-flight**: Restored wallet connection check for order form access
  - Long/Short buttons disabled until wallet is connected
  - Prevents users from accessing order form in invalid state
- **Chart Click Handler Memory Leak**: Fixed event listener accumulation causing multiple callbacks
  - Used `useRef` to store click handler function reference for proper unsubscribe
  - Ensures old event listeners are removed before adding new ones
  - Prevents memory leak where multiple handlers fire on each chart click
  - `lightweight-charts` requires exact same function reference for subscribe/unsubscribe

## [0.2.2] - 2025-12-10

### Changed
- **Order Sheet UX Improvements** (Bybit-style professional layout)
  - Added Buy/Sell toggle buttons at top of order sheet (green/red highlighting)
  - Users can now switch between Long/Short without closing the sheet
  - Changed default order type to "limit" when price is clicked on chart
  - Price input auto-fills when clicking on chart or order book
  - Improved header: Shows "{COIN} Perpetual" instead of "Long/Short {COIN}"
  - Form auto-resets when sheet closes

- **Improved Crosshair Visibility**
  - Increased crosshair opacity from 0.5 to 0.8 for better visibility
  - Added explicit width and style properties for solid lines
  - Price and time labels always visible on crosshair

### Fixed
- **Chart Price Click Handling**: Fixed price input to update immediately when initialPrice prop changes
  - Price now captured correctly when clicking on chart
  - Auto-switches to limit order when price is set via chart click
  - Order sheet responds to price changes in real-time

## [0.2.1] - 2025-12-10

### Fixed
- **Candlestick Chart Not Displaying**: Fixed React ref timing issue where chart container wasn't ready during initialization
  - Changed from `useRef` to callback ref pattern (`setContainerElement` state)
  - Chart initialization effect now depends on `containerElement` state
  - Ensures chart initializes only after DOM element is actually mounted
  - Solves timing issues with Next.js dynamic imports (`ssr: false`)

- **Chart Zoom/Scroll Position Resets**: Fixed chart resetting user's zoom/scroll position on every WebSocket update
  - Use `update()` method for real-time candle updates instead of `setData()`
  - Only call `fitContent()` on initial load, not on subsequent updates
  - Preserve user's manual zoom/scroll when new data arrives
  - Track initial load state per coin/interval combination

- **Chart Scaling Improvements**: Better default scaling to match TradingView behavior
  - Increased `rightOffset` to 12 for more space on right side
  - Set `barSpacing` to 6 with `minBarSpacing` of 0.5 for proper zoom range
  - Enabled `fixLeftEdge: false` and `fixRightEdge: false` for better scrolling
  - Improved price scale margins (10% top, 25% bottom for volume)
  - Volume series uses bottom 20% of chart height

## [0.2.0] - 2025-12-09

### Added
- **Phase 2A: Trading Core Implementation**
  - **TradingView Candlestick Chart** using lightweight-charts v5
    - Full-width responsive chart (~45vh on mobile)
    - Multiple timeframes: 1m, 5m, 15m, 1H, 4H, 1D
    - Real-time candle updates via WebSocket
    - Volume histogram overlay
    - Drawing tools sidebar (cursor, trend line, horizontal line, rectangle, fibonacci, measure)
    - Click-to-set limit price functionality
    - Draggable TP/SL price lines
  - **Order Book Component** with bid/ask depth visualization
    - Real-time updates via WebSocket
    - Horizontal depth bars showing cumulative volume
    - Click price level to set limit order
    - Spread indicator
  - **Advanced Order Types**
    - Limit orders (Good-til-Cancelled)
    - Stop orders
    - Take Profit / Stop Loss integration
  - **Trade Persistence API**
    - `/api/trades` route with POST, GET, PATCH methods
    - Zod validation for all inputs
    - Order type and leverage tracking
  - **New Trading Components**
    - `TradingChart.tsx` - Candlestick chart wrapper
    - `ChartHeader.tsx` - Compact asset/price display
    - `IntervalPills.tsx` - Timeframe selector
    - `ChartToolbar.tsx` - Drawing tools sidebar
    - `OrderBook.tsx` - Bid/ask depth visualization
    - `OrderForm.tsx` - Full-featured inline order form
    - `OrderSheet.tsx` - Bottom sheet order form for mobile
    - `OpenOrders.tsx` - Open orders list with cancel
    - `TradeHistory.tsx` - Executed trades list
    - `TradeTabs.tsx` - Tabbed container for data sections
    - `StickyTradeBar.tsx` - Fixed Long/Short buttons

### Changed
- **Mobile-First Trade Page Layout** (DEXScreener-inspired)
  - Vertical stacking instead of side-by-side columns
  - Full-width chart at top of screen
  - Tabbed sections below chart (Book, Orders, History)
  - Sticky Long/Short buttons above navigation
  - Bottom sheet order form (slides up on tap)
  - Asset selector as modal overlay
- **Database Schema Update**
  - Added `orderType` field: market | limit | stop | tp | sl
  - Added `leverage` field for perp trades
- **RTK Query API Expansion**
  - Added `candleSnapshot` query with WebSocket streaming
  - Added `openOrders` query
  - Added `cancelOrder` mutation
  - Added `cancelAllOrders` mutation

### Removed
- Deleted obsolete `AssetSelectorModal.tsx` and `InteractiveChart.tsx`

### Technical Notes
- Using lightweight-charts v5 API: `chart.addSeries(CandlestickSeries, options)`
- Chart requires dynamic import with SSR disabled
- Drawing tools state managed locally (not persisted)

## [0.1.7] - 2025-12-09

### Changed
- **Portfolio & Fund Pages Redesign**: Enhanced both pages with professional layouts matching the trading page
  - **Portfolio Page**: Two-column layout with account overview & balances on left, positions on right
  - **Fund Page**: Two-column layout with balances & info on left, deposit flow on right
  - Page titles with descriptive subtitles
  - Enhanced PositionsView with larger text, better spacing, color-coded borders, warning badges for liquidation
  - Redesigned BalanceDisplay with chain indicators, gradient highlights, and hover effects
  - Improved DepositFlow with status animations, expandable alternative methods, better visual feedback
  - Empty state improvements with icons and helpful messages

## [0.1.6] - 2025-12-09

### Changed
- **Professional Layout Upgrade**: Redesigned the trading interface with improved spacing, visual hierarchy, and responsive design
  - Sticky asset selector at top with backdrop blur
  - Two-column layout on desktop (order form left, positions right)
  - Enhanced header with gradient logo, connection status indicator, and improved branding
  - Modernized navigation with icons, better spacing, and active state styling
  - Card components now have shadow-lg for depth
  - Improved overall visual polish with better use of oklch color palette

### Fixed
- **RTK Query error handling**: Added validation for `allMids` response to prevent empty object returns and improve error logging

## [0.1.5] - 2025-12-09

### Fixed
- **RTK Query type error**: Fixed `allMids` WebSocket subscription type mismatch by extracting `mids` object from SDK response. The SDK returns `{ mids: {...}, dex?: ... }` but RTK Query cache expects just `{ [coin: string]: string }`. Used type assertion to handle SDK's incorrect type inference for `result.mids`.

## [0.1.4] - 2025-12-09

### Added
- **Real-time Data**: Implemented WebSocket subscriptions for `allMids` (prices) and `l2Book` (order book) using `@nktkas/hyperliquid` `SubscriptionClient`.
- Integrated `SubscriptionClient` into RTK Query via `onCacheEntryAdded` for efficient state updates.

## [0.1.3] - 2025-12-09

### Not Fixed
- **Tailwind configuration**: Fixed styles not loading by replacing `postcss.config.mjs` with `postcss.config.js` and adding explicit `@source` directives to `globals.css` to ensure Tailwind 4 correctly detects content files in `components/` and `app/`.

## [0.1.2] - 2025-12-09

### Fixed
- **Tailwind v4 styling issue**: Converted all arbitrary CSS variable syntax to proper Tailwind v4 utility classes like `bg-surface`, `text-text-primary`, etc.
- In Tailwind v4, when you define `--color-surface` in `@theme`, it creates `bg-surface` utility class automatically
- All components now use native Tailwind v4 color utilities instead of CSS variable arbitrary values

### Changed
- Updated all UI components (Button, Card, Input, Header, Navigation)
- Updated all trading components (AssetSelector, MarketOrderForm, PositionsView)
- Updated all funding components (DepositFlow, BalanceDisplay)
- Updated all page layouts and routes

## [0.1.1] - 2025-12-09

### Changed
- Renamed app from "HL Trade" to "HypApp"
- Removed unused JetBrains Mono font import (was loaded but never applied)
- Switched to system monospace font stack for faster loading

### Fixed
- Font variable mismatch: `--font-mono` was defined but `--font-sans` was used

## [0.1.0] - 2025-12-09

### Added
- **Project Setup**
  - Next.js 15 with App Router
  - TypeScript 5 strict mode
  - Tailwind CSS 4.1 with oklch color theme
  - Drizzle ORM with Neon PostgreSQL schema
  - RTK Query for state management

- **Hyperliquid Integration** (`@nktkas/hyperliquid`)
  - InfoClient for reading market data, balances, positions
  - ExchangeClient wrapper with wallet adapter for signing
  - Builder fee configuration (approveBuilderFee + order builder param)
  - Utility functions for asset indices and position formatting

- **Trading Features**
  - Asset selector with search (perps and spot)
  - Market order form with buy/sell toggle
  - Leverage input for perpetuals
  - Real-time price display via RTK Query polling

- **Portfolio Features**
  - Perp positions view with unrealized PnL
  - Spot positions view with USD value
  - Close position functionality

- **Funding Features**
  - Balance display (Base USDC, HyperEVM USDHL, HL margin)
  - One-click deposit flow UI
  - Builder fee approval button
  - Placeholder hooks for 1inch Fusion and CCTP integration

- **UI Components**
  - Header with OnchainKit Wallet component
  - Navigation between Trade, Portfolio, Fund pages
  - Custom oklch dark theme (--color-long, --color-short, etc.)
  - JetBrains Mono typography
  - Trading-specific animations

- **Infrastructure**
  - Multi-chain wagmi config (Base + HyperEVM)
  - OnchainKit MiniKit integration
  - Drizzle trades schema

### Technical Notes
- OnchainKit global CSS is not imported to prevent it from overriding Tailwind v4 layout/styles; Coinbase components use their internal styling plus the app theme.
- Hyperliquid wallet adapter uses type assertion due to SDK types complexity
- MetaMask SDK warning is expected (React Native storage not available in web)
