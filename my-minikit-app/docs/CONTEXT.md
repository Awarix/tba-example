# Current Context

## Status: MVP Foundation Complete ✅

The core architecture and UI components for HypApp are implemented and building successfully.
Real-time data (WebSockets) has been added for prices and order book.
**All pages redesigned with professional, modern layouts and excellent UX.**

## Completed

### Infrastructure
- **Tailwind 4.1** with oklch color theme configured
- **Drizzle ORM** + Neon schema for trades table
- **RTK Query** store with Hyperliquid API endpoints
- **Multi-chain support** (Base + HyperEVM)
- **PostCSS Configuration** fixed for Next.js compatibility

### Hyperliquid Integration
- `@nktkas/hyperliquid` SDK integration
- `InfoClient` for read operations (mids, meta, clearinghouse state)
- `ExchangeClient` wrapper with wallet adapter for signing
- `SubscriptionClient` for real-time WebSocket updates with proper type handling
- Builder fee configuration in orders
- Utility functions for parsing positions/orders
- **Fixed RTK Query WebSocket type mismatch** (extracts `mids` object from SDK response)

### Components
- **Trading UI**: Asset selector with sticky header, market order form with leverage, responsive two-column layout
- **Portfolio**: Enhanced PositionsView with color-coded borders, liquidation warnings, detailed metrics in rounded boxes
- **Funding**: Redesigned BalanceDisplay with chain indicators and gradient highlighting, improved DepositFlow with status animations
- **Navigation**: Modern tab-based nav with icons, active state styling, and backdrop blur
- **Header**: Professional header with gradient logo, connection status indicator, and user profile display

### Styling
- Full oklch dark theme with trading-specific colors
- System monospace font stack
- Custom animations (pulse-glow, fade-in, slide-up)
- **Responsive layouts**: All pages use mobile-first with desktop two-column grids
- **Professional polish**: Shadow-lg on cards, backdrop-blur effects, gradient accents, hover states
- **Empty states**: Friendly empty states with icons and helpful messages
- Explicit `@source` configuration for Tailwind content detection

## In Progress

None - MVP foundation complete, ready for testing.

## Known Issues

1. **MetaMask SDK Warning**: Build shows warning about `@react-native-async-storage/async-storage` - this is harmless.
2. **Funding Hooks**: `useFundHL` has placeholder implementations for 1inch Fusion and CCTP.
3. **Hyperliquid SDK Type Inference**: The `@nktkas/hyperliquid` SDK incorrectly types `allMids().mids` as `string` instead of `{ [coin: string]: string }`. We use type assertion `as unknown as AllMids` to work around this in `hyperliquidApi.ts`.

## Key Implementation Details

### Real-time Data (WebSockets)
RTK Query's `onCacheEntryAdded` lifecycle method is used to stream updates from `SubscriptionClient` directly into the cache. This ensures instant price updates without manual polling.

```typescript
onCacheEntryAdded: async (_args, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) => {
  await cacheDataLoaded;
  const ws = getSubscriptionClient();
  // Extract mids object from SDK response { mids: {...}, dex?: ... }
  await ws.allMids((data) => updateCachedData(() => data.mids));
  await cacheEntryRemoved;
}
```

**Important**: The SDK returns `{ mids: { [coin: string]: string }, dex?: string }`, but we extract just `data.mids` to simplify the cache structure and match what components expect.

### Wallet Adapter Pattern
The Hyperliquid SDK requires `signTypedData` for EIP-712 signatures. We wrap wagmi's `WalletClient` in an adapter:

```typescript
const walletAdapter = {
  signTypedData: async (args) => wallet.signTypedData(args as any),
  address: wallet.account.address,
};
```

### Builder Fee Flow
1. User must call `approveBuilderFee` once per account
2. All orders include `builder` param with address and fee BPS
3. Fees collected in builder's HL account

### Tailwind Configuration
Due to Next.js + Tailwind 4 structure, we explicitly define content sources in `globals.css` and use a standard `postcss.config.js`:

```css
@source "../components";
@source ".";
```

### Environment Variables Required
```env
DATABASE_URL=           # Neon PostgreSQL
NEXT_PUBLIC_ONCHAINKIT_API_KEY=
NEXT_PUBLIC_HYPERLIQUID_TESTNET=true|false
HYPERLIQUID_BUILDER_ADDRESS=
HYPERLIQUID_BUILDER_FEE_BPS=
```

## Next Steps (Post-MVP)

1. Implement actual 1inch Fusion / CCTP swap logic
2. User session with Neynar SIWE
3. Order history persistence to Drizzle
4. Advanced order types (limit, stop)
