# Current Context

## Status: MVP Foundation Complete ✅

The core architecture and UI components for HypApp are implemented and building successfully.

## Completed

### Infrastructure
- **Tailwind 4.1** with oklch color theme configured
- **Drizzle ORM** + Neon schema for trades table
- **RTK Query** store with Hyperliquid API endpoints
- **Multi-chain support** (Base + HyperEVM)

### Hyperliquid Integration
- `@nktkas/hyperliquid` SDK integration
- `InfoClient` for read operations (mids, meta, clearinghouse state)
- `ExchangeClient` wrapper with wallet adapter for signing
- Builder fee configuration in orders
- Utility functions for parsing positions/orders

### Components
- Trading UI: Asset selector, market order form with leverage
- Portfolio: Positions view with close functionality
- Funding: Deposit flow UI (placeholder for 1inch/CCTP)
- Navigation header with OnchainKit Wallet

### Styling
- Full oklch dark theme with trading-specific colors
- JetBrains Mono font family
- Custom animations (pulse-glow, fade-in, slide-up)
- Mobile-first responsive design

## In Progress

None - MVP foundation complete, ready for testing.

## Known Issues

1. **MetaMask SDK Warning**: Build shows warning about `@react-native-async-storage/async-storage` - this is harmless, just MetaMask SDK looking for React Native storage
2. **OnchainKit CSS**: Loaded via CDN to bypass Tailwind 4 PostCSS compatibility issue
3. **Funding Hooks**: `useFundHL` has placeholder implementations for 1inch Fusion and CCTP - actual integration pending

## Key Implementation Details

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
2. Add WebSocket subscriptions for real-time updates
3. User session with Neynar SIWE
4. Order history persistence to Drizzle
5. Advanced order types (limit, stop)

