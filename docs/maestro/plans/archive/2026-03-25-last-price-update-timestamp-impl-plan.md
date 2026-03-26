# Implementation Plan: Last Price Update Timestamps Feature

## Plan Overview
This plan implements the 'Last Price Update Timestamps' feature, including backend database changes, WebSocket payload updates, and frontend UI enhancements.

- **Total Phases**: 5
- **Agents Involved**: `data_engineer`, `coder`, `ux_designer`, `tester`
- **Estimated Effort**: ~2-3 developer days

## Dependency Graph
```
Phase 1: DB Foundation (schema.prisma)
    |
Phase 2: Backend Logic & Socket Update (PriceEmitter, SocketServer)
    |
Phase 3: Shared Types & Store Update (types.ts, store.ts)
    |
Phase 4: Frontend UI (MergerCard, useRelativeTime)
    |
Phase 5: Validation & Cleanup
```

## Execution Strategy Table

| Phase | Objective | Agent | Execution Mode |
|-------|-----------|-------|----------------|
| 1 | Update Prisma schema & migration | `data_engineer` | Sequential |
| 2 | Backend logic & WebSocket emission | `coder` | Sequential |
| 3 | Shared types & Store integration | `coder` | Sequential |
| 4 | Frontend UI & Relative time hook | `ux_designer` | Sequential |
| 5 | Validation & Cleanup | `tester` | Sequential |

## Phase Details

### Phase 1: DB Foundation
- **Objective**: Add the last update fields to the Merger model.
- **Agent**: `data_engineer`
- **Files to Modify**:
  - `packages/backend/db/schema.prisma`: Add `lastTargetPriceUpdate` and `lastBuyerPriceUpdate` (DateTime, optional).
- **Implementation Details**:
  - Run `npx prisma migrate dev --name add_last_price_update_timestamps` in the backend.
- **Validation Criteria**:
  - Prisma client generated successfully.
  - Database schema contains the new columns.

### Phase 2: Backend Logic & Socket Update
- **Objective**: Track individual timestamps and update WebSocket payload.
- **Agent**: `coder`
- **Files to Modify**:
  - `packages/backend/sockets/PriceEmitter.ts`:
    - Track timestamps for both target and buyer.
    - Implement throttled DB update (e.g., every 10 minutes) for these fields using `MergerService`.
    - Update `handlePriceUpdate` to capture the correct timestamp based on the ticker.
  - `packages/backend/sockets/SocketServer.ts`: Update `emitPriceUpdate` to accept and send both timestamps.
- **Implementation Details**:
  - Ensure the `PriceEmitter` singleton manages the last DB update time.
  - Use `MergerService.updatePriceTimestamps` (new method or reuse existing).
- **Validation Criteria**:
  - Server starts without errors.
  - Console logs show timestamps being tracked.

### Phase 3: Shared Types & Store Update
- **Objective**: Synchronize frontend data structures with the backend.
- **Agent**: `coder`
- **Files to Modify**:
  - `packages/frontend/src/features/arbitrage/types.ts`: Update `Merger` and `PriceUpdate` interfaces (remove `lastUpdate`, add `lastTargetPriceUpdate`, `lastBuyerPriceUpdate`).
  - `packages/frontend/src/lib/store.ts`: Update `updateMergerPrice` and `updateMultiplePrices` to use the new fields.
- **Implementation Details**:
  - Remove references to `lastUpdate` in the store logic.
- **Validation Criteria**:
  - Frontend builds successfully.

### Phase 4: Frontend UI & Relative Time Hook
- **Objective**: Display the new timestamps with relative formatting.
- **Agent**: `ux_designer`
- **Files to Create**:
  - `packages/frontend/src/hooks/useRelativeTime.ts`: Hook that returns formatted relative time and re-renders every 5s.
- **Files to Modify**:
  - `packages/frontend/src/features/arbitrage/components/MergerCard.tsx`:
    - Remove old "LAST UPDATED" text.
    - Add two `Badge` components in the footer row for target and buyer price updates.
- **Implementation Details**:
  - Format logic: `5s`, `10s`... `1m`, `2h`, etc.
  - Handle `CASH` acquisitions (hide buyer update badge).
- **Validation Criteria**:
  - MergerCard shows the correct badges.
  - Timestamps update every 5 seconds.

### Phase 5: Validation & Cleanup
- **Objective**: Ensure everything works and remove dead code.
- **Agent**: `tester`
- **Files to Modify**:
  - Any remaining files with dead `lastUpdate` logic.
- **Implementation Details**:
  - Full end-to-end check of the feature.
- **Validation Criteria**:
  - WebSocket updates reflect in real-time on the UI.
  - Manual reload shows initial timestamps from DB.

## File Inventory

| Phase | Action | Path | Purpose |
|-------|--------|------|---------|
| 1 | Modify | `packages/backend/db/schema.prisma` | Add timestamp fields to model |
| 2 | Modify | `packages/backend/sockets/PriceEmitter.ts` | Track timestamps & throttled DB update |
| 2 | Modify | `packages/backend/sockets/SocketServer.ts` | Update WebSocket payload |
| 3 | Modify | `packages/frontend/src/features/arbitrage/types.ts` | Update interfaces |
| 3 | Modify | `packages/frontend/src/lib/store.ts` | Update store logic |
| 4 | Create | `packages/frontend/src/hooks/useRelativeTime.ts` | Custom hook for relative time |
| 4 | Modify | `packages/frontend/src/features/arbitrage/components/MergerCard.tsx` | UI update |

## Token Budget & Cost Estimation

| Phase | Agent | Model | Est. Input | Est. Output | Est. Cost |
|-------|-------|-------|-----------|------------|----------|
| 1 | `data_engineer` | Pro | 2,000 | 500 | $0.04 |
| 2 | `coder` | Pro | 3,000 | 1,000 | $0.07 |
| 3 | `coder` | Pro | 2,500 | 800 | $0.06 |
| 4 | `ux_designer` | Pro | 3,000 | 1,200 | $0.08 |
| 5 | `tester` | Pro | 2,000 | 500 | $0.04 |
| **Total** | | | **12,500** | **4,000** | **$0.29** |

## Risk Classification
- **Phase 2 (MEDIUM)**: Throttled DB logic must be robust to prevent memory leaks or redundant writes.
- **Phase 4 (LOW)**: UI changes are straightforward but require careful formatting for time.
