# Current Context

## Status: MVP Foundation Complete ✅

The core architecture and UI components for HypApp are implemented and building successfully.
Real-time data (WebSockets) has been added for prices and order book.

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
- `SubscriptionClient` for real-time WebSocket updates
- Builder fee configuration in orders
- Utility functions for parsing positions/orders

### Components
- Trading UI: Asset selector, market order form with leverage
- Portfolio: PositionsView with close functionality
- Funding: DepositFlow UI (placeholder for 1inch/CCTP)
- Navigation header with OnchainKit Wallet

### Styling
- Full oklch dark theme with trading-specific colors
- System monospace font stack
- Custom animations (pulse-glow, fade-in, slide-up)
- Mobile-first responsive design
- Explicit `@source` configuration for Tailwind content detection

## In Progress

None - MVP foundation complete, ready for testing.

## Known Issues

1. **MetaMask SDK Warning**: Build shows warning about `@react-native-async-storage/async-storage` - this is harmless.
2. **Funding Hooks**: `useFundHL` has placeholder implementations for 1inch Fusion and CCTP.

## Key Implementation Details

### Real-time Data (WebSockets)
RTK Query's `onCacheEntryAdded` lifecycle method is used to stream updates from `SubscriptionClient` directly into the cache. This ensures instant price updates without manual polling.

```typescript
onCacheEntryAdded: async (_args, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) => {
  await cacheDataLoaded;
  const ws = getSubscriptionClient();
  await ws.allMids((data) => updateCachedData(() => data));
  await cacheEntryRemoved;
}
```

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
