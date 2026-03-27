# Design Document: MergerCard Display Improvement

## 1. Problem Statement
The `MergerCard` currently lacks critical information for `STOCK` and `MIXED` deals, specifically the acquirer's stock price and a clear breakdown of the cash vs. stock components in the offer. Furthermore, the real-time update timestamps are presented in a non-intuitive way at the bottom of the card, disconnected from the pricing data they describe.

## 2. Requirements

### Functional Requirements
- **Backend**: Update the `priceUpdate` socket event to include an explicit `targetPrice` and `buyerPrice`.
- **Backend**: Ensure `PriceEmitter.ts` sends both prices whenever a relevant tick occurs.
- **Frontend**: Update the `Merger` and `PriceUpdate` interfaces to include `buyerPrice`.
- **Frontend**: Update the Zustand store to handle the new `priceUpdate` structure.
- **Frontend UI**: Refactor `MergerCard.tsx` to conditionally display the acquirer price (for `STOCK`/`MIXED` deals) and a "Cash Component" explanation (for `MIXED` deals).
- **Frontend UI**: Relocate timestamps to be contextually relevant, placed below the corresponding price.
- **Frontend UI**: Use a small, reusable component for contextual labels and relocated timestamps.

### Non-Functional Requirements
- **Performance**: Maintain real-time update performance without significant latency.
- **Maintainability**: Use explicit naming for socket event fields to improve clarity.
- **Consistency**: Use existing UI patterns (e.g., flash animations, typography) for new elements.

### Constraints
- **Compatibility**: Ensure the new socket payload is handled correctly by the updated frontend to prevent regressions.
- **Layout**: The `MergerCard` must maintain its responsive layout and avoid visual clutter when displaying additional information.

## 3. Approach

### Selected Approach: Targeted Component Refactor
We will implement a direct data flow for `buyerPrice` from the backend to the frontend, with a focused refactor of the `MergerCard` UI. This pragmatic approach fits the existing architecture and directly addresses all requirements.

#### Decision Matrix

| Criterion | Weight | Targeted Refactor | Abstracted Pricing Service |
|-----------|--------|-------------------|----------------------------|
| Ease of Implementation | 30% | 5: Direct and pragmatic | 2: Significantly more complex |
| Maintainability | 25% | 4: Clear and explicit naming | 5: Highly flexible but more abstract |
| Alignment with PRD | 25% | 5: Directly addresses all requirements | 4: Adds overhead for future use cases |
| Performance | 20% | 5: Minimal overhead | 4: Slightly more state management |
| **Weighted Total** | | **4.75** | **3.65** |

#### Rationale Annotations
- **Explicit naming** — *We'll rename 'price' to 'targetPrice' in the socket event to avoid ambiguity as we add 'buyerPrice'.*
- **Reusable component** — *We'll create small reusable labels for timestamps and deal details to ensure visual consistency.*
- **Targeted refactor** — *This approach allows us to deliver the requested improvements quickly and safely, without the risks associated with a major abstraction.*

### Alternatives Considered
- **Abstracted Pricing Service** — Considered for its flexibility in handling complex multi-ticker deals. However, it was rejected as over-engineered for the current two-ticker merger structures and would introduce unnecessary implementation complexity.

## 4. Architecture

### Data Flow
1. **Finnhub tick** → `FinnhubService`.
2. `FinnhubService` emits local `priceUpdate` → `PriceEmitter.handlePriceUpdate`.
3. `PriceEmitter` recalculates spread and emits socket `priceUpdate` with `{ targetPrice, buyerPrice, ... }` → `SocketServer.emitPriceUpdate`.
4. **Frontend** receives `priceUpdate` → `useMergerWebSocket` hook.
5. `useMergerWebSocket` calls `store.updateMergerPrice`.
6. `MergerCard` re-renders with the updated `merger` object from the store.

### Key Interfaces
```typescript
// packages/frontend/src/features/arbitrage/types.ts
export interface Merger {
  // ... existing fields
  buyerPrice: number | null;
}

export interface PriceUpdate {
  // ... existing fields
  targetPrice: number;
  buyerPrice: number | null;
}
```

## 5. Agent Team
- **api_designer**: To define the updated socket event payload.
- **coder**: To implement the backend changes and the initial frontend state updates.
- **ux_designer**: To refactor the `MergerCard` UI and create the reusable labels.
- **tester**: To verify the real-time data flow and UI behavior.

## 6. Risk Assessment
- **Socket Payload Mismatch**: If the backend starts sending the new payload before the frontend is updated, it could lead to incorrect price displays. *Mitigation: Coordinate the deployment or ensure the frontend handles both formats during the transition.*
- **UI Layout Overflow**: Adding more fields to the `MergerCard` could cause layout issues on small screens. *Mitigation: Use responsive Tailwind classes and test on multiple screen sizes.*
- **Data Stale/Sync Issues**: Ensure `buyerPrice` updates don't conflict with `targetPrice` updates in the store. *Mitigation: Use the existing timestamp-based staleness logic for both prices.*

## 7. Success Criteria
- **Functional**: The `MergerCard` displays the acquirer price for `STOCK`/`MIXED` deals and the cash explanation for `MIXED` deals.
- **UI**: Timestamps are correctly relocated and use the new reusable label component.
- **Performance**: Real-time updates continue to flash and update without noticeable latency.
- **Reliability**: No regressions in spread calculation or overall application stability.
