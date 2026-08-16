# TradeCore System Architecture

## 1. Current Project Audit

### 1.1 Existing Structure
- **Frontend Framework:** React + Next.js (App Router `src/app`).
- **Styling:** Tailwind CSS (`@tailwindcss/postcss`).
- **Database ORM:** Prisma (`@prisma/client` 5.18.0) using SQLite (`dev.db`).
- **Routes:** 
  - `src/app/(admin)` - Admin Dashboard, Market Analytics, Settings, etc.
  - `src/app/(public)` - Landing Page, Login, Register.
  - `src/app/(user)` - User Dashboard, Market, Trading, Watchlist.
  - `src/app/api` - Existing boilerplate API routes (`analytics`, `companies`, `orders`, `portfolio`, `wallet`).
- **Components:** `src/components` contains UI components (Header, Sidebar, Modals, Recharts wrappers).

### 1.2 What to Reuse vs What to Replace
- **Reuse:** 
  - Entire Next.js Frontend (`src/app/(admin)`, `src/app/(user)`, `src/components`).
  - Tailwind CSS setup.
  - Prisma Schema models for `User`, `Company`, `Order`, `Trade`, `Portfolio`, `Wallet` (with some modifications needed for extreme concurrency and constraints).
- **Modify/Add:** 
  - A standalone, persistent Node.js Exchange Engine is required. Next.js API routes are stateless and subject to serverless lifecycle limits/cold starts. The matching engine must be a continuously running singleton process holding the Order Book in memory.
  - WebSockets (via `ws` or `socket.io`) for real-time market data streaming.
  - SQLite WAL (Write-Ahead Logging) mode must be explicitly configured to prevent database locks during high-frequency trading.

## 2. Proposed Backend Directory Structure

```text
TradeCore/
├── src/
│   ├── app/                # Existing Next.js Frontend
│   ├── components/         # Existing UI Components
│   └── lib/                # Shared utilities
├── exchange-engine/        # NEW: Dedicated Exchange Server (Node.js)
│   ├── server.ts           # Entry point for the WebSocket & Matching Engine
│   ├── engine/             
│   │   ├── matching.ts     # Core matching logic (Price-Time Priority)
│   │   ├── orderBook.ts    # In-memory data structures (TreeMap/Queue)
│   │   └── validator.ts    # Wallet & Holdings validation
│   ├── state/
│   │   └── snapshot.ts     # SQLite recovery & checkpointing
│   ├── simulators/         
│   │   └── botManager.ts   # Continuous simulated order generation
│   └── types/              # Type definitions shared with frontend
└── prisma/                 # Existing Prisma configuration
```

## 3. Dependency Plan

**New Dependencies Required:**
- `ws` or `socket.io`: For real-time WebSocket communication between the Next.js client and the Exchange Engine.
- `bintrees` or a custom Red-Black Tree implementation: For O(log n) efficient Order Book price-level management (TreeMap).
- `pino` or `winston`: For high-performance, asynchronous logging in the exchange engine.
- `jest` & `supertest`: For unit/integration testing of the matching engine.

## 4. Database Architecture Plan

**Database Engine:** SQLite in **WAL (Write-Ahead Log) mode**.
- WAL mode allows concurrent reads and writes, crucial for an exchange where analytics read heavily while the engine writes heavily.
- Prisma allows enabling WAL mode natively via connection parameters or executing `PRAGMA journal_mode=WAL;` on startup.

**Data Consistency vs In-Memory State:**
- The Order Book is an **in-memory** structure.
- **On Order Placement:** Validate user funds -> Insert to SQLite (`status: PENDING`) -> Push to In-Memory Order Book.
- **On Trade Match:** Engine processes match -> Emits WS event -> Asynchronously batches SQLite updates (Trade creation, Order status update, Wallet balance deduct, Portfolio holding update).
- **Recovery:** On restart, load all `PENDING` and `PARTIALLY_FILLED` orders from SQLite and rebuild the in-memory Order Book.

## 5. Exchange-Engine Architecture Plan

**Core Principle:** ONE Authoritative Engine.
All orders (both User and Bot generated) enter the exact same ingestion pipeline.

**Pipeline Flow:**
1. **Ingress:** HTTP API or WebSocket receives order.
2. **Validation:** Check if `price * quantity` <= `Wallet.availableBalance` (Buy) or `quantity` <= `Portfolio.holdings` (Sell). Reserve the funds/holdings immediately to prevent double spending.
3. **Queue:** Order is pushed to a serialized command queue to prevent race conditions.
4. **Matching Engine (Single-threaded event loop processing):** 
   - Uses Price-Time Priority.
   - Limit Orders: added to OrderBook if no immediate match.
   - Market Orders: aggressively matched against OrderBook liquidity.
5. **Execution:** On match, create Trade record, update Wallets (settle reserved funds).
6. **Broadcaster:** Send real-time updates via WebSockets.

**Data Structures:**
- `OrderBook`: Map of `companyId` -> `OrderBookInstance`.
- `OrderBookInstance`: 
  - `bids`: Max-Heap or descending TreeMap of Price Levels.
  - `asks`: Min-Heap or ascending TreeMap of Price Levels.
  - `PriceLevel`: FIFO Queue of Orders.
  - `orderMap`: HashMap of `orderId` -> `OrderNode` for O(1) cancellations.

## 6. Realtime Architecture Plan

- The Exchange Engine runs a WebSocket server on a dedicated port (e.g., `8080`).
- **Channels:**
  - `ticker`: Broadcasts latest price, 24h change, volume for all symbols.
  - `orderbook:${symbol}`: Broadcasts L2 Order Book depth updates.
  - `trades:${symbol}`: Broadcasts public trade executions.
  - `user:${userId}`: Private channel for user's order updates and portfolio changes.
- Frontend uses a global WebSocket context provider to connect, subscribe to channels, and update React state globally.

## 7. Testing Strategy

- **Unit Testing:** Focus heavily on `matching.ts`.
  - Test Partial Matches, Full Matches, Multi-level Matches.
  - Test Market Orders sweeping the book.
  - Test Price-Time Priority (FIFO at same price).
- **Concurrency Testing:** Send thousands of concurrent orders to ensure wallet balances never drop below 0 (no race conditions).
- **Recovery Testing:** Kill the engine abruptly. Restart it and ensure the in-memory book exactly matches the database state.
- **Integration Testing:** Test the full flow from WS ingestion -> Match -> SQLite Persistence.

## 8. Frontend Consumption Plan

The following existing pages will require integration with the WebSocket and API backend:
- **`src/app/(user)/dashboard/page.tsx`**: Needs live Portfolio value, top movers, and recent user trades.
- **`src/app/(user)/markets/page.tsx`**: Needs live `ticker` WebSocket channel for all 100 companies.
- **`src/app/(user)/trade/[symbol]/page.tsx`**: Needs live `orderbook:${symbol}` channel, `trades:${symbol}` channel, and form submission linked to the unified order ingress.
- **`src/app/(user)/orders/page.tsx`**: Needs private WebSocket channel to update order statuses (PENDING -> FILLED) in real-time.
- **`src/app/(admin)/admin/market-analytics/page.tsx`**: Needs aggregated live metrics (VIX, Advancing/Declining).
- **`src/app/(admin)/admin/exchange/page.tsx`**: Needs raw access to the Exchange Engine's inner state (latency, TPS, active connections).
