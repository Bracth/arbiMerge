---
design_depth: standard
task_complexity: medium
---

# Initial Price Synchronization Design

## 1. Problem Statement
When the frontend client initially connects to the WebSocket server, it receives no immediate data. The UI remains in an empty or loading state until the next trade occurs on the market and is broadcasted via Finnhub. This creates a poor user experience, especially outside of market hours when trades are infrequent or non-existent. We need a mechanism to synchronize the "last known price" to the client immediately upon connection, ensuring the dashboard is populated instantly regardless of market activity.

## 2. Requirements

**Functional Requirements:**
1. The backend must fetch the last known price for all active tickers when the server initializes.
2. The `FinnhubService` must be extended to fetch these initial prices using the Finnhub REST API (`/quote` endpoint) since WebSocket trades may not occur outside market hours.
3. The WebSocket server must immediately emit the cached prices to a client upon connection.
4. The emission must use the existing `priceUpdate` event format so the frontend requires no changes.

**Non-Functional Requirements:**
1. **Performance**: Initial fetch should happen during server startup so the cache is warm for the first client connection.
2. **Resilience**: The system must provide prices to clients even if the server restarts while the market is closed.

**Constraints:**
1. Must use Finnhub as the sole data provider (avoiding Yahoo Finance).
2. Must avoid modifying the database schema to store high-frequency, real-time prices.

## 3. Approach

**Selected Approach: Eager Fetch with Auto-Emit (using Finnhub REST)**
During server initialization, the backend will retrieve all active ticker symbols. It will then call a new method on `FinnhubService` that fetches the last known price for each symbol using the Finnhub REST `/quote` endpoint. These prices will seed the `PriceEmitter`'s in-memory cache. When a client connects, `SocketServer` will immediately iterate over this cache and emit the existing `priceUpdate` event for each symbol directly to the new socket. — *Selected because it guarantees an instantly warm cache for the first user and requires zero frontend changes.*

**Alternatives Considered:**
1. *Lazy Fetch on First Connection:* Wait until a client connects to fetch REST quotes. — *Rejected because it delays the first user's experience and introduces complex concurrency locking.*
2. *Database Persistence:* Save real-time prices to the `Merger` table. — *Rejected because it unnecessarily increases DB write load for volatile data.*

**Decision Matrix**
| Criterion | Weight | Eager Fetch (Selected) | Lazy Fetch | DB Persistence |
|-----------|--------|------------------------|------------|----------------|
| User Experience | 40% | 5: Instant load for all users | 3: First user delayed | 5: Instant load |
| System Performance | 30% | 4: Light DB load, slow boot | 3: Light DB load, fast boot | 2: High DB write load |
| Complexity | 30% | 4: Straightforward startup hook | 2: Concurrency locks needed | 3: Schema/service changes |
| **Weighted Total** | | **4.4** | **2.7** | **3.5** |

## 4. Agent Team
- **`coder`**: To implement the REST API fetch in `FinnhubService` and the WebSocket emission logic in `SocketServer`.
- **`code_reviewer`**: To review the implementation for correct error handling and rate limit mitigation.

## 5. Risk Assessment
1. **Finnhub REST API Rate Limits:** Finnhub's free tier has a rate limit (typically 60 calls/minute). A burst of `/quote` requests on startup could result in 429 Too Many Requests errors. — *Mitigated by running the fetch asynchronously and adding small delays between requests if needed.*
2. **Server Startup Blocking:** Synchronous HTTP calls during server boot could delay readiness. — *Mitigated by allowing the server to listen immediately while fetching in the background.*
3. **Data Inconsistency:** REST `/quote` format might differ from WebSocket `trade` events. — *Mitigated by normalizing the REST quote response into the exact same `{ symbol, price, timestamp }` object structure.*

## 6. Success Criteria
- The frontend UI displays prices immediately after a page reload, even if the market is closed.
- The `FinnhubService` fetches initial prices successfully without hitting rate limits.
- No database schema changes are required.
