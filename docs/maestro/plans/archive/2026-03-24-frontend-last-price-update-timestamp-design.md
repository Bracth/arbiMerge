---
design_depth: standard
task_complexity: medium
---

# Design Document: Frontend Last Price Update Timestamp

## Problem Statement
The `arbiMerge` frontend currently displays real-time price updates for merger targets and acquirers via WebSockets. However, users cannot easily tell when the last price update occurred, which is critical for assessing the freshness of the arbitrage spread calculation. We need to implement a 'Last Price Update' timestamp on the frontend that accurately reflects the time of the trade, relying on data propagated from the backend via the initial REST API response and subsequent WebSocket updates.

## Requirements

**Functional Requirements:**
- Display the 'Last Price Update' timestamp on the frontend (e.g., in `MergerCard`).
- Provide the timestamp in the initial REST API response (`/api/mergers`).
- Provide the timestamp in real-time WebSocket updates (`PriceUpdate` payload).
- The timestamp should reflect the time of the trade or quote from the exchange (e.g., from `FinnhubService`) when available, otherwise fallback to the time the price was received by the backend.

**Non-Functional Requirements:**
- The timestamp should be passed as a raw number (milliseconds since epoch) to allow the frontend to format it according to user locale.
- The state management in `useMergerStore` must efficiently update the `lastUpdate` field on the respective `Merger` object without triggering unnecessary re-renders of the entire list.

**Constraints:**
- Must align with existing data flow: `FinnhubService` -> `PriceEmitter` -> `SocketServer` -> Frontend Store -> UI Components.

## Approach

### Recommended Approach: Full Data Flow with `lastUpdate` on `Merger`

**Summary:** We will extend the `Merger` interface in `packages/frontend/src/features/arbitrage/types.ts` to include a `lastUpdate?: number` property. The backend `PriceEmitter` will expose the last known timestamps, which `server.ts` will inject into the initial `/api/mergers` REST response. The `SocketServer`'s `PriceUpdate` payload will continue to pass the timestamp, and the `useMergerStore` will update the `lastUpdate` field of the `Merger` directly alongside the price.

**Decision Matrix:**

| Criterion | Weight | Full Data Flow (Recommended) | Frontend-Only Timing | Use Store State Selector |
|-----------|--------|------------------------------|----------------------|--------------------------|
| Accurate Trade Time | 40% | 5: Leverages Finnhub data for true trade time | 2: Time received locally, not trade time | 5: Also accurate, but complex extraction |
| Simplicity of UI Consumption | 40% | 5: Field lives on the `Merger` object passed to UI | 5: Similar, just updated locally | 3: Requires a separate selector hook per item |
| Component Re-render Efficiency | 20% | 4: Standard Zustand partial updates | 4: Similar | 3: Additional subscriptions needed |
| **Weighted Total** | | **4.8** | 3.4 | 4.1 |

**Key Decisions:**
- `lastUpdate` as a property on `Merger` — *This simplifies component props and matches the shape of data from both REST and WebSocket sources.*
- Raw millisecond timestamps — *Allows the frontend to use robust 'time ago' hooks or simple `toLocaleTimeString` without backend coupling.*

**Alternatives Considered:**
- Calculating the 'time ago' string on the backend — *Rejected because it requires constant re-polling or complex WebSocket broadcasting just to update the text, whereas the client can format a static timestamp reactively.*
- Using a separate `useTimestamp(ticker)` hook connected to `useMergerStore.priceTimestamps` — *Rejected because it complicates the component hierarchy; it is cleaner to update the `Merger` object in the store directly when a price arrives.*

## Risk Assessment

**Risks:**
1. **Data Mismatch:** If the `/api/mergers` REST endpoint and the WebSocket `PriceUpdate` payload do not use the exact same timestamp format (milliseconds since epoch), the UI may display inconsistent dates.
2. **Store Re-renders:** Modifying the `mergers` array inside `useMergerStore` for every price update could trigger excessive re-renders if the UI component (`MergerGrid` or `Dashboard`) is subscribing to the entire array rather than individual items.
3. **Clock Drift:** If relying strictly on `Date.now()` from the backend when Finnhub timestamps are unavailable, there could be slight drift compared to the client's clock, causing a 'Time Ago' formatter to briefly show negative values.

**Mitigations:**
1. Explicitly type the `lastUpdate` as `number` in `types.ts` and ensure both backend sources cast it correctly.
2. Leverage Zustand's shallow comparison or ensure components are optimized to only re-render when their specific `Merger` object changes.
3. Implement a resilient timestamp formatter on the frontend that floors negative 'Time Ago' values to 'Just now'.
