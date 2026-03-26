# PRD: MergerCard Display Improvement - Detailed Specification

## 1. Executive Summary
The `MergerCard` is the central component of the ArbiMerge dashboard. Currently, it lacks critical information for `STOCK` and `MIXED` operations and presents real-time update timestamps in a non-intuitive way. This improvement aims to provide a clearer, more comprehensive view of the arbitrage opportunity by adding the acquirer's stock price and clarifying the offer's composition (cash vs. stock).

## 2. Goals
- **Enhance Visual Clarity**: Relocate timestamps to be contextually relevant to the data they describe.
- **Improve Information Density**: Add the acquirer's current stock price and cash component explanation.
- **Standardize UI/UX**: Use a consistent "Last update [relative_time]" format across the application.

## 3. Functional Requirements

### 3.1 Backend: Real-time Data Flow
The backend must transmit the current price of the acquirer (buyer) whenever a price update occurs for a merger.

- **`SocketServer.emitPriceUpdate`**:
    - Update the payload to include a new `buyerPrice` field (numeric).
    - Ensure all connected clients receive this value in the `priceUpdate` event.
- **`PriceEmitter.ts`**:
    - **`getAllLastPrices`**: Retrieve and include the latest `buyerPrice` from the local cache for each active merger.
    - **`handlePriceUpdate`**: When a price tick arrives for either the target or the buyer ticker, calculate the updated spread and offer value, and emit both the `targetPrice` and the `buyerPrice` in the same event.

### 3.2 Frontend: State Management
The frontend must store and update the `buyerPrice` for each merger in the global state.

- **`types.ts`**:
    - **`Merger` Interface**: Add `buyerPrice: number | null` to store the latest raw stock price of the acquirer.
    - **`PriceUpdate` Interface**: Add `buyerPrice?: number` to match the new socket payload.
- **`store.ts`**:
    - **`updateMergerPrice`**: Update the logic to extract `buyerPrice` from the incoming `PriceUpdate` and commit it to the relevant merger object in the Zustand store.

### 3.3 Frontend: UI/UX (MergerCard Component)
The `MergerCard` UI will be refactored to show information more clearly based on the `acquisitionType`.

#### 3.3.1 Timestamp Relocation
- Remove the "TARGET: [time]" and "BUYER: [time]" badges from the bottom of the card.
- **Target Timestamp**: Add a small, muted "Last update [time]" text directly below the **Current Price** (Target).
- **Buyer Timestamp**: Add a small, muted "Last update [time]" text directly below the **Acquirer Price** (if visible).

#### 3.3.2 Conditional Pricing Display
- **"CURRENT PRICE" (Target)**: Always displayed.
- **"ACQUIRER PRICE" (Raw Stock)**: 
    - Displayed **ONLY** if `acquisitionType` is `STOCK` or `MIXED` AND `buyerTicker` is present.
    - Positioned in the right column, above or alongside the "OFFER VALUE".
- **"OFFER VALUE" (Final Price)**:
    - Always displayed as the target price the acquirer is effectively paying.
- **"Cash Component" Explanation**:
    - Displayed **ONLY** if `acquisitionType` is `MIXED`.
    - Shown as a small, italicized text below the "OFFER VALUE" (e.g., *"+ $10.00 cash + stock"*).

## 4. Technical Design Considerations
- **Staleness Logic**: The existing `useRelativeTime` hook and staleness checks in the store must be preserved to ensure the UI correctly reflects real-time data.
- **Visual Feedback**: The flash-green/red animations for price updates should be applied to both the Target and Buyer prices when they update.
- **Responsive Layout**: Ensure the added information doesn't overflow or break the card layout on smaller screens.

## 5. Success Criteria
- Users can clearly see the raw stock price of both companies in `STOCK`/`MIXED` deals.
- The composition of `MIXED` deals is transparently explained (cash vs. stock).
- All real-time updates are accompanied by intuitive, context-aware timestamps.
- No regression in the spread calculation or real-time performance.
