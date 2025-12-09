# Changelog

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
