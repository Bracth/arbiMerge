---
design_depth: standard
task_complexity: medium
---

# Backend Spread Calculation Design

## 1. Problem Statement
Currently, spread and trend calculations for merger arbitrage deals are duplicated across the frontend and an orphaned backend service. The frontend's `store.ts` redundantly calculates these metrics on initial load and every WebSocket price update, leading to inconsistency in rounding and formula application. As we prepare to handle more complex acquisition types (e.g., mixtures of cash and stock acquisitions), this decentralized approach becomes unmaintainable and prone to data drift.

This design centralizes all market metrics in a backend service, backed by an enriched database schema that stores specific acquisition terms, ensuring the backend is the definitive source of truth for both REST and real-time WebSocket communication.

## 2. Requirements

### Functional Requirements
- **Enriched Merger Schema**: Add fields for `cashAmount`, `exchangeRatio`, `parentTicker`, and `acquisitionType` (enum: CASH, STOCK, MIX) to the Prisma `Merger` model. — *[Rationale: Needed to support future complex calculation types like stock and cash acquisitions.]*
- **Centralized Calculation Service**: Revitalize and expand `SpreadCalculatorService.ts` to perform multi-type calculations (e.g., spread = ((offerPrice - currentPrice) / currentPrice) * 100). — *[Rationale: User requested a backend source of truth for all complex logic.]*
- **Enriched Data Payloads**: Update REST `/api/mergers` and WebSocket `priceUpdate` messages to include pre-calculated `spread` and `trend`. — *[Rationale: Allows frontend to be a pure state container without any redundant logic.]*
- **Frontend Simplification**: Remove all calculation logic from `store.ts` and `useMergerWebSocket`. — *[Rationale: Avoids duplication and formula drift.]*

### Non-Functional Requirements
- **Consistency**: Use a single formula implementation for all data consumption points. — *[Rationale: Ensures uniform rounding and formula application.]*
- **Performance**: Perform calculations only on throttled price updates. — *[Rationale: Minimizes backend CPU usage during high-volume price ticks, as agreed in our discussion.]*
- **Scalability**: Design the service to easily incorporate additional acquisition terms (e.g., dividends, closing dates). — *[Rationale: Future-proofs the arbitrage logic.]*

### Constraints
- **Database Migration**: Requires an update to the current Prisma schema and database. — *[Rationale: Standard approach for schema-backed services.]*
- **Technology Alignment**: Must remain within the existing TypeScript/Prisma stack. — *[Rationale: Preserves existing project conventions.]*

## 3. Approach

### Selected Approach: Schema-Backed Service (Approach 1)
Centralize all market metrics in a backend service, expansion of the database schema (Prisma) to store acquisition terms, and enrichment of REST and WebSocket flows to return pre-calculated metrics.

### Alternatives Considered
- **Calculation Middleware (Approach 2)**: Using a transformation layer with external configuration instead of schema changes. *Rejected because it becomes harder to maintain as acquisition types grow in complexity and configuration management for terms can lead to drift.*
- **Frontend Shared Library**: Creating a shared package for calculation logic. *Rejected because it doesn't solve the core redundancy and doesn't provide a single backend source of truth for all complex business rules.*

### Decision Matrix (Standard Depth)

| Criterion | Weight | Approach 1 (Selected) | Approach 2 |
|-----------|--------|-----------------------|------------|
| **Consistency** | 30% | 5: Single source of truth for all data types. | 4: Centralized but depends on external config. |
| **Maintainability** | 25% | 5: Clean schema and service integration. | 3: Managing terms outside the DB adds overhead. |
| **Scalability** | 25% | 5: Designed for multi-type (stock/cash). | 3: Transformation logic gets complex without schema support. |
| **Speed** | 20% | 3: Requires migration and schema updates. | 5: No DB changes, faster initial setup. |
| **Total** | | **4.6** | **3.75** |

**Rationale**: Approach 1 is our chosen long-term solution as it provides the most robust and consistent foundation for the complex acquisition types (stock/cash mix) you specified, ensuring the backend is the definitive source of truth for all metrics.

## 4. Architecture

### Component Interaction & Data Flow
1.  **Enriched Merger Schema (Prisma)**:
    - `Merger`: `{ ..., acquisitionType: CASH|STOCK|MIX, cashAmount: Float?, exchangeRatio: Float?, buyerTicker: String? }`
    - *Note: `offerPrice` in the DB will represent the static cash offer for CASH-only deals, or be ignored/overridden by the calculated value for STOCK/MIX deals.*
2.  **SpreadCalculatorService**:
    - `calculateEffectiveOfferPrice(merger, buyerPrice?)`: Computes the actual offer price based on terms.
    - `calculateSpread(effectiveOfferPrice, targetPrice)`: Computes the spread.
    - `getTrend(previousSpread, currentSpread)`: Standardizes the trend calculation.
3.  **Real-Time Processing (PriceEmitter)**:
    - Receives prices from `FinnhubService`.
    - Uses `SpreadCalculatorService` to determine the "Effective Offer Price" (EOP) and then the `spread`.
    - Emits a `priceUpdate`: `{ targetTicker, targetPrice, effectiveOfferPrice, spread, trend, timestamp }`.
4.  **Initial Data (REST API)**:
    - `/api/mergers` returns enriched merger objects, including the pre-calculated `effectiveOfferPrice` and `spread`.
5.  **Frontend State (store.ts)**:
    - Acts as a pure state container, accepting the backend's `effectiveOfferPrice`, `spread`, and `trend` directly.

### Key Interfaces
- `Merger` (Database Model): Reuses `buyerTicker`, adds acquisition terms.
- `priceUpdate` (WebSocket Payload): Includes `effectiveOfferPrice` to show the dynamic deal value to the user.

## 5. Agent Team

### Roles & Assignments
- **Data Engineer**: Responsible for expanding the Prisma `Merger` model, implementing the `acquisitionType` enum, and running the database migration. — *[Rationale: Required to correctly handle the schema expansion for multi-type acquisitions.]*
- **Backend Developer (Coder)**: Revitalizes and expands `SpreadCalculatorService.ts` to include multi-type (cash, stock, mix) logic and integrates it into the `PriceEmitter` and REST API. — *[Rationale: Centralizes all complex business logic in the backend as requested.]*
- **Frontend Developer (Refactor)**: Simplifies the `store.ts` and `useMergerWebSocket` by removing redundant calculation logic and updating state setters to accept pre-calculated values. — *[Rationale: Reduces frontend technical debt and aligns it with the backend source of truth.]*
- **Tester**: Develops unit tests for `SpreadCalculatorService` (covering CASH, STOCK, and MIX types) and integration tests for the WebSocket price update flow. — *[Rationale: Essential for validating the consistency of formula applications and rounding.]*
- **Code Reviewer**: Conducts a final audit of the centralized calculation logic and ensures schema changes adhere to project conventions. — *[Rationale: Provides an independent quality gate before completion.]*

## 6. Risk Assessment

### Identified Risks
- **Database Migration Drift**: Potential for schema changes to break existing migrations or data in local environments. — *[Mitigation: Use `prisma migrate dev` with clear, documented steps for updating the database schema.]*
- **Latency Overload**: Backend processing per price update (fetching merger terms + calculating) could introduce latency at high tick rates. — *[Mitigation: Use the existing throttled price emitter and cache merger terms in memory during `PriceEmitter` initialization to avoid repeated database queries per tick.]* — *[Rationale: Direct result of our technical constraint discussion regarding performance.]*
- **Formula Inconsistency**: Mismatch between REST and WebSocket calculated values if logic is applied inconsistently. — *[Mitigation: All data paths MUST pass through the `SpreadCalculatorService` for every outgoing response.]* — *[Rationale: Standardizing calculations through a single service as the source of truth.]*
- **Schema Conflicts**: The `offerPrice` currently stores static cash offers, which could conflict with dynamic stock/mix offers. — *[Mitigation: Update the schema to use `cashAmount` and `exchangeRatio` and treat `offerPrice` as the pre-calculated, effective offer value.]* — *[Rationale: Ensures the DB supports both static and dynamic offer types without confusion.]*

## 7. Success Criteria

### Key Performance Indicators (KPIs)
- **Centralized Formula**: Zero instances of calculation logic remaining in the frontend `store.ts` or `useMergerWebSocket`. — *[Rationale: Direct result of our goal to move logic to the backend.]*
- **Accurate Multi-Type Calculations**: Successful unit tests for CASH, STOCK, and MIX acquisition types within the `SpreadCalculatorService`. — *[Rationale: Essential for validating the complex deal logic you specified.]*
- **Consistent Rounding**: REST API and WebSocket payloads show the exact same `spread` (rounded to 2 decimal places) for the same merger and price. — *[Rationale: Standardizing calculations through a single service as the source of truth.]*
- **Database Schema Integrity**: Prisma schema successfully reflects `acquisitionType`, `cashAmount`, and `exchangeRatio` with no broken migrations. — *[Rationale: Provides the necessary data backing for all acquisition types.]*
- **Real-Time Responsiveness**: WebSocket `priceUpdate` messages include pre-calculated `spread` and `trend` with no perceptible latency increase (verified via throttling). — *[Rationale: Balances performance and consistency as discussed.]*
