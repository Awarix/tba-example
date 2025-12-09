# Hyperliquid Mini App for Base App / Farcaster

## Overview

A Mini App that serves as a frontend for **Hyperliquid DEX**, enabling users within Base App and Farcaster to trade spot and perpetual markets using their native wallet — without exporting private keys or leaving the app.

## Goals

1. **Seamless Trading Experience** — Users trade directly from Base App/Farcaster using their connected wallet
2. **Full Market Access** — Support all available spot and perpetual pairs on Hyperliquid
3. **Revenue Generation** — Charge maximum builder fee on all trades
4. **Social Integration** — Leverage Farcaster's social graph for sharing trades, PnL, and leaderboards

## Core Features

### Trading
- [ ] Spot trading for all available pairs
- [ ] Perpetual futures trading for all available pairs
- [ ] Real-time price feeds and order book
- [ ] Market, limit, and stop orders
- [ ] Position management (open/close/modify)
- [ ] Leverage selection for perps
- [ ] PnL tracking and history

### Wallet Integration
- [ ] Native wallet connection via MiniKit (no private key export)
- [ ] Sign transactions within Base App/Farcaster
- [ ] Balance display (wallet + Hyperliquid margin)
- [ ] Deposit/withdraw to Hyperliquid

### Social Features
- [ ] Share trades and PnL to Farcaster
- [ ] Leaderboard of top traders
- [ ] Follow traders and view their positions (if public)
- [ ] Trading competitions

### User Experience
- [ ] Quick Auth for verified user identity
- [ ] Mobile-first responsive design
- [ ] Real-time updates via WebSocket
- [ ] Trade history and analytics

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 15.x (App Router) |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x (oklch/P3 colors) |
| State Management | RTK Query | Latest |
| Hosting | Vercel | - |
| Database | Neon (PostgreSQL) | - |
| ORM | Drizzle | Latest |
| Mini App SDK | @coinbase/onchainkit (MiniKit) | Latest |
| Social API | Neynar | Latest |
| DEX SDK | [@nktkas/hyperliquid](https://github.com/nktkas/hyperliquid) | Latest |

### Hyperliquid SDK

Using the fully-typed TypeScript SDK by nktkas instead of raw API calls:

```typescript
import { ExchangeClient, HttpTransport, InfoClient } from "@nktkas/hyperliquid";

// Read data
const info = new InfoClient({ transport: new HttpTransport() });
const mids = await info.allMids();

// Place order (requires wallet signature)
const exchange = new ExchangeClient({
  transport: new HttpTransport(),
  wallet: walletClient, // from viem/wagmi
});
```

**Features:**
- 🖋️ 100% TypeScript with full inference for 80+ methods
- 🧪 Types validated against real API responses
- 📦 Tree-shakeable, minimal dependencies
- 🌐 Works with viem wallet providers (MiniKit compatible)

[SDK Documentation](https://nktkas.gitbook.io/hyperliquid)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Base App / Farcaster                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Mini App (iframe)                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │  │
│  │  │   Trading   │  │  Portfolio  │  │  Leaderboard │   │  │
│  │  │     UI      │  │    View     │  │    Social    │   │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘   │  │
│  │         │                │                │           │  │
│  │  ┌──────┴────────────────┴────────────────┴───────┐   │  │
│  │  │              MiniKit SDK Layer                  │   │  │
│  │  │   (Wallet, Auth, Share, Context, OpenUrl)       │   │  │
│  │  └──────────────────────┬─────────────────────────┘   │  │
│  └─────────────────────────┼─────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ @nktkas/      │  │ Neon + Drizzle  │  │   Neynar API    │
│ hyperliquid   │  │   - Sessions    │  │   - Profiles    │
│  - InfoClient │  │   - Trades      │  │   - Social      │
│  - Exchange   │  │   - Leaderboard │  │   - Casts       │
│  - WebSocket  │  │                 │  │                 │
└───────────────┘  └─────────────────┘  └─────────────────┘
```

### Wallet Flow (No Private Key Export)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Base App /  │     │   Mini App   │     │  Hyperliquid │
│  Farcaster   │     │   Frontend   │     │     L1       │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │  1. User clicks    │                    │
       │     "Place Order"  │                    │
       │ ◄──────────────────│                    │
       │                    │                    │
       │  2. MiniKit signs  │                    │
       │     with native    │                    │
       │     wallet         │                    │
       │ ──────────────────►│                    │
       │                    │                    │
       │                    │  3. Submit signed  │
       │                    │     order via SDK  │
       │                    │ ──────────────────►│
       │                    │                    │
       │                    │  4. Order executed │
       │                    │ ◄──────────────────│
       │                    │                    │
       │  5. Show result    │                    │
       │ ◄──────────────────│                    │
```

**Key:** User's private key never leaves Base App/Farcaster. All signatures happen in the native wallet.

## Hyperliquid Integration

Using [@nktkas/hyperliquid](https://github.com/nktkas/hyperliquid) SDK for fully-typed API access.

### SDK Clients

```typescript
import { 
  InfoClient, 
  ExchangeClient, 
  SubscriptionClient,
  HttpTransport,
  WebSocketTransport 
} from "@nktkas/hyperliquid";

// Read-only data (no wallet needed)
const info = new InfoClient({ transport: new HttpTransport() });
const mids = await info.allMids();           // All mid prices
const book = await info.l2Book({ coin: "ETH" }); // Order book
const state = await info.clearinghouseState({ user: "0x..." });

// Trading (requires wallet)
const exchange = new ExchangeClient({
  transport: new HttpTransport(),
  wallet: walletClient, // viem WalletClient from MiniKit
});

// Real-time subscriptions
const ws = new SubscriptionClient({ transport: new WebSocketTransport() });
await ws.l2Book({ coin: "ETH" }, (book) => {
  console.log(book.levels);
});
```

### Builder Fee
- Maximum builder fee applied to all trades
- Builder address: `HYPERLIQUID_BUILDER_ADDRESS` env var
- Fee: `HYPERLIQUID_BUILDER_FEE_BPS` (basis points)

### Order Example

```typescript
const result = await exchange.order({
  orders: [{
    a: 4,           // Asset index (ETH)
    b: true,        // Buy side (true = long)
    p: "3000",      // Limit price
    s: "0.1",       // Size in base asset
    r: false,       // Reduce only
    t: { limit: { tif: "Gtc" } }, // Good til cancelled
  }],
  grouping: "na",
  builder: {
    address: process.env.HYPERLIQUID_BUILDER_ADDRESS,
    fee: parseInt(process.env.HYPERLIQUID_BUILDER_FEE_BPS),
  },
});
```

## Database Schema (Drizzle + Neon)

> **Important:** FID is NOT locked to a single wallet address. Users may have different wallets in Farcaster vs Base App. Each session tracks the active wallet independently.

```typescript
// db/schema.ts
import { pgTable, text, integer, timestamp, decimal, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// User profile (linked to Farcaster FID)
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  fid: integer("fid").notNull().unique(),
  
  // Farcaster profile data (synced from context)
  username: text("username"),
  displayName: text("display_name"),
  pfpUrl: text("pfp_url"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  settings: text("settings").default("{}"),
});

// Session tracks wallet per login (FID can have multiple wallets)
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  walletAddress: text("wallet_address").notNull(),
  clientType: text("client_type").notNull(), // "base_app" | "farcaster" | "warpcast"
  clientFid: integer("client_fid"), // Host client FID (309857 = Base App)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => [
  index("sessions_wallet_idx").on(table.walletAddress),
  index("sessions_user_idx").on(table.userId),
]);

// Trade history (for analytics/leaderboard)
export const trades = pgTable("trades", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Trade details
  pair: text("pair").notNull(), // "BTC", "ETH", etc.
  side: text("side").notNull(), // "buy" | "sell"
  orderType: text("order_type").notNull(), // "market" | "limit" | "stop"
  size: decimal("size", { precision: 30, scale: 18 }).notNull(),
  price: decimal("price", { precision: 30, scale: 18 }).notNull(),
  leverage: integer("leverage"), // For perps
  
  // Execution
  status: text("status").notNull(), // "pending" | "filled" | "cancelled"
  filledAt: timestamp("filled_at"),
  pnl: decimal("pnl", { precision: 30, scale: 18 }),
  fees: decimal("fees", { precision: 30, scale: 18 }),
  
  // Hyperliquid reference
  hlOrderId: text("hl_order_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("trades_user_idx").on(table.userId),
  index("trades_pair_idx").on(table.pair),
  index("trades_created_idx").on(table.createdAt),
]);

// Leaderboard cache (materialized view pattern)
export const leaderboard = pgTable("leaderboard", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  fid: integer("fid").notNull(),
  period: text("period").notNull(), // "daily" | "weekly" | "monthly" | "all_time"
  
  pnl: decimal("pnl", { precision: 30, scale: 18 }).notNull(),
  tradeCount: integer("trade_count").notNull(),
  volume: decimal("volume", { precision: 30, scale: 18 }).notNull(),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }),
  
  rank: integer("rank"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("leaderboard_fid_period_unique").on(table.fid, table.period),
  index("leaderboard_period_rank_idx").on(table.period, table.rank),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  trades: many(trades),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  user: one(users, { fields: [trades.userId], references: [users.id] }),
}));
```

```typescript
// db/index.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Key Design Decisions

1. **FID ≠ Wallet**: One Farcaster user can connect different wallets from different clients (Base App vs Warpcast). Sessions track which wallet is active.

2. **Session-based**: Each login creates a session with the connected wallet address. This supports:
   - Same user, different wallets across clients
   - Wallet switching within same client
   - Analytics per wallet vs per user

3. **Leaderboard by FID**: Rankings are by Farcaster identity (social), not wallet address.

## Environment Variables

```bash
# App
NEXT_PUBLIC_URL=https://your-app.vercel.app
NEXT_PUBLIC_ONCHAINKIT_API_KEY=

# Farcaster/MiniKit
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=

# Hyperliquid (@nktkas/hyperliquid SDK)
NEXT_PUBLIC_HYPERLIQUID_MAINNET=true           # false for testnet
HYPERLIQUID_BUILDER_ADDRESS=0x...              # Your builder wallet
HYPERLIQUID_BUILDER_FEE_BPS=10                 # Max fee in basis points

# Database (Drizzle + Neon)
DATABASE_URL=postgres://...@neon.tech/...

# Neynar
NEYNAR_API_KEY=
```

## Code Standards

### TypeScript
- **Strict mode enabled**
- **No `any` types** — use proper typing or `unknown` with type guards
- All API responses typed with interfaces/types
- Zod for runtime validation of external data

### Tailwind CSS v4 (oklch/P3 Colors)

All colors use oklch color space for wider gamut and perceptual uniformity:

```css
/* tailwind.config.css or app/globals.css */
@theme {
  /* Base palette - oklch(lightness chroma hue) */
  --color-background: oklch(0.13 0.02 260);
  --color-surface: oklch(0.18 0.02 260);
  --color-surface-elevated: oklch(0.22 0.02 260);
  
  /* Brand colors */
  --color-primary: oklch(0.65 0.24 145);      /* Green - profit/buy */
  --color-secondary: oklch(0.65 0.20 25);     /* Red - loss/sell */
  --color-accent: oklch(0.70 0.18 280);       /* Purple - accent */
  
  /* Text */
  --color-text-primary: oklch(0.95 0.01 260);
  --color-text-secondary: oklch(0.70 0.02 260);
  --color-text-muted: oklch(0.50 0.02 260);
  
  /* Semantic */
  --color-success: oklch(0.72 0.22 145);
  --color-warning: oklch(0.80 0.18 85);
  --color-error: oklch(0.65 0.24 25);
  --color-info: oklch(0.70 0.15 230);
  
  /* Trading specific */
  --color-long: oklch(0.72 0.22 145);         /* Green for longs */
  --color-short: oklch(0.65 0.24 25);         /* Red for shorts */
  --color-neutral: oklch(0.60 0.02 260);      /* Gray for neutral */
  
  /* Chart colors */
  --color-chart-1: oklch(0.70 0.20 145);
  --color-chart-2: oklch(0.70 0.20 25);
  --color-chart-3: oklch(0.70 0.18 280);
  --color-chart-4: oklch(0.75 0.15 60);
  --color-chart-5: oklch(0.70 0.15 200);
}
```

**Why oklch?**
- Perceptually uniform (same lightness values look equally bright)
- Wider P3 color gamut for modern displays
- Easier to create accessible color combinations
- Native CSS support (no build step needed)

### File Structure
```
my-minikit-app/
├── app/
│   ├── (routes)/
│   │   ├── trade/
│   │   ├── portfolio/
│   │   └── leaderboard/
│   ├── api/
│   │   ├── auth/
│   │   ├── hyperliquid/
│   │   └── webhook/
│   ├── globals.css          # Tailwind + oklch theme vars
│   └── layout.tsx
├── components/
│   ├── trading/
│   ├── portfolio/
│   ├── social/
│   └── ui/
├── db/
│   ├── schema.ts            # Drizzle schema
│   ├── index.ts             # Drizzle client
│   └── migrations/
├── lib/
│   ├── hyperliquid/
│   │   ├── client.ts        # @nktkas/hyperliquid wrapper
│   │   └── utils.ts
│   └── neynar/
├── store/
│   ├── api/
│   │   ├── hyperliquidApi.ts
│   │   └── neynarApi.ts
│   └── store.ts
├── types/
│   ├── trading.ts
│   └── user.ts
├── drizzle.config.ts
└── docs/
    └── PROJECT.md
```

### Naming Conventions
- Components: PascalCase (`TradingPanel.tsx`)
- Utilities: camelCase (`formatPrice.ts`)
- Types: PascalCase with descriptive names (`HyperliquidOrderResponse`)
- API routes: kebab-case (`/api/hyperliquid/place-order`)

## Development Phases

### Phase 1: Foundation
- [ ] Project setup with strict TypeScript config
- [ ] MiniKit integration (auth, wallet, context)
- [ ] Hyperliquid API client with full typing
- [ ] Basic trading UI (market orders)

### Phase 2: Core Trading
- [ ] All order types (market, limit, stop)
- [ ] Real-time price feeds via WebSocket
- [ ] Order book visualization
- [ ] Position management

### Phase 3: Portfolio & History
- [ ] Portfolio overview
- [ ] Trade history
- [ ] PnL calculations
- [ ] Neon database integration

### Phase 4: Social Features
- [ ] Neynar integration
- [ ] Share trades to Farcaster
- [ ] Leaderboard
- [ ] Follow traders

### Phase 5: Polish
- [ ] Performance optimization
- [ ] Error handling & edge cases
- [ ] Analytics
- [ ] Documentation

## Resources

- [MiniKit Documentation](https://docs.base.org/mini-apps)
- [@nktkas/hyperliquid SDK](https://github.com/nktkas/hyperliquid) — TypeScript SDK
- [Hyperliquid SDK Docs](https://nktkas.gitbook.io/hyperliquid) — SDK GitBook
- [Hyperliquid Official Docs](https://hyperliquid.gitbook.io/hyperliquid-docs/)
- [Neynar API Docs](https://docs.neynar.com/)
- [OnchainKit](https://docs.base.org/onchainkit)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Neon PostgreSQL](https://neon.tech/docs)
- [Tailwind v4 + oklch](https://tailwindcss.com/docs/customizing-colors)

## Success Metrics

- Daily active traders
- Total trading volume
- Builder fee revenue
- User retention rate
- Social shares per trade

