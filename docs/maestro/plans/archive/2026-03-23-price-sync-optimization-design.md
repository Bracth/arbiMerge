---
design_depth: standard
task_complexity: medium
---

# Initial Price Sync Optimization (Batched WS & AbortController)

## 1. Problem Statement
The current implementation of sending initial prices upon WebSocket connection sends individual `priceUpdate` events for every active ticker. This is inefficient, causing multiple network frames and multiple state updates on the frontend, which can lead to rendering bottlenecks. Additionally, the backend REST fetch to Finnhub lacks an `AbortController`, meaning network hangups during initialization cannot be cancelled or timed out cleanly.

## 2. Requirements

**Functional Requirements:**
1. The backend `SocketServer` must emit a single `initialPrices` event containing an array of all cached price objects immediately upon a new client connection, replacing the individual `priceUpdate` emissions.
2. The frontend `useMergerWebSocket` hook must listen for the `initialPrices` event and pass the array to the Zustand store.
3. The frontend `store.ts` must implement a new action, `updateMultiplePrices`, to update the state of all provided tickers in a single React batch mutation.
4. The `FinnhubService.fetchInitialPrice` method must be updated to accept an `AbortSignal` to allow the initialization process to cancel the fetch if it takes too long.

**Non-Functional Requirements:**
1. **Performance**: The frontend state update should trigger only one re-render cycle for the initial load.
2. **Robustness**: The backend must gracefully handle `AbortError` if the initialization fetch times out.

## 3. Approach

**Selected Approach: Batched WebSocket Event & AbortController Integration**
The backend `SocketServer` will be modified to gather all prices from `PriceEmitter.getAllLastPrices()` and send them as a single array via a new `initialPrices` event. The frontend will add a listener for this event in `useMergerWebSocket.ts` and process the array using a new `updateMultiplePrices` action in `store.ts`. Concurrently, `FinnhubService.ts` will be updated to accept an `AbortSignal` in its fetch call, and `PriceEmitter` will implement a timeout mechanism using `AbortController` during its `initializeCache` loop. — *Selected because it optimizes the critical rendering path on the frontend while keeping data delivery within the existing WebSocket architecture.*

**Decision Matrix**
| Criterion | Weight | Batched WS Event (Selected) | REST Endpoint + WS |
|-----------|--------|-----------------------------|--------------------|
| Performance | 40% | 5: Single WS event, 1 render | 3: Extra HTTP roundtrip |
| Complexity | 30% | 3: Requires contract change across stack | 4: Standard, but adds API layer |
| UX (Time to Interactive) | 30% | 4: Fast, immediate on connection | 3: Slower initial paint |
| **Weighted Total** | | **4.1** | **3.3** |

## 4. Agent Team
- **`coder`**: To implement the changes across both the backend (`FinnhubService`, `SocketServer`, `PriceEmitter`) and the frontend (`store.ts`, `useMergerWebSocket.ts`).
- **`code_reviewer`**: To ensure the `AbortController` is implemented safely and the frontend state mutation is optimized.

## 5. Risk Assessment
1. **Frontend State Overwrite:** If the `initialPrices` event arrives slightly after a real-time `priceUpdate` event for the same ticker, the initial (older) price might overwrite the newer real-time price in the store.
   *Mitigation:* The frontend `updateMultiplePrices` logic should check the timestamps. It should only update a ticker's price if the incoming timestamp is strictly greater than the currently stored timestamp or if no price currently exists.
2. **Uncaught Abort Errors:** If the `AbortController` triggers an abort, it will throw an `AbortError` which could crash the server.
   *Mitigation:* Ensure `fetchInitialPrice` wraps the `fetch` call in a `try...catch` and specifically handles the abort scenario, returning `null` gracefully.

## 6. Success Criteria
- The frontend receives all initial prices in a single `initialPrices` WebSocket event and renders them without multiple state mutations.
- The `FinnhubService` respects the provided `AbortSignal`, cancelling requests if they exceed the defined timeout during startup.
