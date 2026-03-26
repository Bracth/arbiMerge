# PRD: Last Price Update Timestamps Feature

## Overview
Implement real-time last price update timestamps for both target and buyer companies in the merger card. This replaces the current 'spread last update' logic, which will be removed from both frontend and backend.

## Goals
- Add `lastTargetPriceUpdate` and `lastBuyerPriceUpdate` to the `Merger` model.
- Real-time updates via WebSockets for these timestamps.
- Display timestamps as relative time (e.g., "last update 5s ago") using a `Badge` component in the footer of the `MergerCard`.
- Update interval of 5 seconds for the relative time display.
- Remove 'spread last update' text and logic.

## Technical Requirements

### 1. Backend Changes (Package: `backend`)

#### Data Model (`schema.prisma`)
- Add fields:
  - `lastTargetPriceUpdate`: `DateTime?`
  - `lastBuyerPriceUpdate`: `DateTime?`
- Migration to add these fields.

#### Price Update Logic (`PriceEmitter.ts`)
- Update the `PriceEmitter` to track individual timestamps for target and buyer tickers.
- Implement a throttled database update (e.g., every 5-10 minutes) for these fields to avoid excessive database writes.
- Update `SocketServer.emitPriceUpdate` to include both `lastTargetPriceUpdate` and `lastBuyerPriceUpdate` in the payload.

#### Socket Payload Updates
- `priceUpdate` event:
  ```json
  {
    "targetTicker": "AAPL",
    "targetPrice": 150.00,
    "lastTargetPriceUpdate": 1711382400000,
    "buyerTicker": "MSFT",
    "buyerPrice": 300.00,
    "lastBuyerPriceUpdate": 1711382405000,
    "spread": 2.5,
    "trend": "UP",
    "effectiveOfferPrice": 310.00
  }
  ```
- `initialPrices` event: Similar update to include both timestamps for all active mergers.

### 2. Frontend Changes (Package: `frontend`)

#### Shared Types (`@arbimerge/shared` or `packages/frontend/src/features/arbitrage/types.ts`)
- Update `Merger` interface:
  - Remove `lastUpdate`.
  - Add `lastTargetPriceUpdate`: `number` (timestamp).
  - Add `lastBuyerPriceUpdate`: `number` (timestamp).
- Update `PriceUpdate` interface.

#### Store Logic (`store.ts`)
- Update `updateMergerPrice` and `updateMultiplePrices` to handle the new fields.
- Remove logic related to the single `lastUpdate` field.

#### UI Components (`MergerCard.tsx`)
- Remove the "LAST UPDATED" text in the footer.
- Add a new footer row containing two `Badge` components:
  - **Target Update Badge**: Shows relative time for `lastTargetPriceUpdate`.
  - **Buyer Update Badge**: Shows relative time for `lastBuyerPriceUpdate` (only for non-CASH deals).
- Badge color: Use `gray` or `secondary` subtle variants.

#### Relative Time Logic
- Implement a custom hook `useRelativeTime(timestamp, intervalMs = 5000)`:
  - Calculates the difference between `Date.now()` and the `timestamp`.
  - Formats as: `5s`, `10s`, `1m`, `2h`, `3d` etc.
  - Returns the formatted string and ensures the component re-renders every 5 seconds.

## Design Details
- **Badge Placement**: Footer Row of the `MergerCard`.
- **DB Persistence**: Throttled (every 5-10 minutes) or on server restart to minimize load.
- **Relative Time Logic**: Standard relative formatting (seconds, minutes, hours, days).

## Verification & Testing
- **Manual Verification**: Verify that price changes trigger badge updates in the frontend.
- **WebSocket Check**: Inspect WebSocket frames to ensure both timestamps are sent.
- **Database Check**: Verify that `lastTargetPriceUpdate` and `lastBuyerPriceUpdate` are updated in the database after the throttle period.
- **Performance**: Monitor CPU and Memory usage on the backend due to price updates and throttled DB writes.
