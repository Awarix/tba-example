# Changelog

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
- OnchainKit CSS loaded via CDN to avoid Tailwind 4 PostCSS conflicts
- Hyperliquid wallet adapter uses type assertion due to SDK types complexity
- MetaMask SDK warning is expected (React Native storage not available in web)

