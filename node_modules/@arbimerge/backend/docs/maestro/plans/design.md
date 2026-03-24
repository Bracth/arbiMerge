# Design Document: arbiMerge Backend Implementation

**Task Complexity**: Complex
**Design Depth**: Deep

## 1. Problem Statement & Scope
Implement the backend for the arbiMerge project, a merger arbitrage monitoring tool. The backend must:
- Store and provide a pre-curated list of mergers (Target Ticker, Buyer Name, Offer Price).
- Fetch real-time market data for these tickers using the Yahoo Finance API (`yahoo-finance2`).
- Calculate the spread between the current price and the offer price.
- Push real-time price updates to the frontend via WebSockets (`socket.io`).
- Be containerizable using Docker.

## 2. Proposed Architecture (Layered)
The backend will follow a classic layered architecture as per ADR006:
- **Database Layer**: Prisma ORM with PostgreSQL.
- **Service Layer**:
    - `MergerService`: Handles database operations for mergers.
    - `YahooFinanceService`: Fetches current price for a ticker using `yahoo-finance2`.
    - `SpreadCalculatorService`: Business logic for spread calculation.
- **Socket Layer**:
    - `SocketServer`: Manages Socket.io connections.
    - `PriceEmitterService`: Background task that fetches prices every 5 seconds and emits updates.
- **API Layer**:
    - Express server with REST endpoints (e.g., `GET /api/mergers`).
    - Entry point combining Express and Socket.io.

## 3. Data Flow
1. **Initial Load**: Frontend requests `GET /api/mergers`. Backend queries PostgreSQL via Prisma and returns the list.
2. **Real-Time Updates**:
    - Backend runs a background interval (every 5 seconds).
    - It fetches the list of active mergers from the DB.
    - For each ticker, it calls the Yahoo Finance API.
    - If successful, it calculates the spread.
    - It emits a `priceUpdate` event via Socket.io with `{ ticker: string, price: number }`.
    - If the API fails, it keeps the last known price to ensure UI stability.

## 4. Technical Decisions
- **Runtime**: Node.js with TypeScript.
- **Database**: PostgreSQL with Prisma ORM.
- **Market Data**: `yahoo-finance2` library.
- **WebSockets**: `socket.io`.
- **Concurrency**: Use `Promise.all` for fetching multiple ticker prices in parallel while respecting rate limits.

## 5. Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `PORT`: Server port (default: 3000).
- `NODE_ENV`: development/production.

## 6. Security & Reliability
- **Rate Limiting**: Yahoo Finance has rate limits; the 5-second interval is balanced for a small set of tickers.
- **Error Handling**: Graceful handling of API failures by retaining the last known price.
- **Database Reliability**: Prisma's `binaryTargets` configured for Docker compatibility.

## 7. Migration & Rollback
- Prisma migrations will manage schema changes.
- Rollbacks can be performed by reverting the schema and running `prisma migrate resolve`.
