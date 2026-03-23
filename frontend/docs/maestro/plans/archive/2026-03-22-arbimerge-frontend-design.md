---
design_depth: standard
task_complexity: medium
---

# Design Document: ArbiMerge Frontend Implementation

## 1. Problem Statement
The ArbiMerge MVP aims to democratize access to merger arbitrage data by providing retail investors with a real-time monitoring dashboard. Current solutions are either high-cost (Bloomberg) or slow (static financial sites). We need a high-performance, low-latency React frontend that visualizes spread calculations between current market prices and official cash-only merger offers.

**Key Goals:**
-   Visualize 5-10 active cash-only mergers with real-time price and spread updates.
-   Provide immediate visual feedback (color flashes) on price changes to simulate a high-end trading terminal.
-   Maintain connection resilience (automatic reconnection indicators).
-   Adhere to a "Sovereign Architect" design system (deep blacks, sharp edges, no lines). — *Rationale: The design system is critical to provide the "institutional" feel requested by the user. (Traces to PRD Visión del Producto)*

## 2. Requirements

### Functional Requirements
-   **Merger Dashboard**: Display a list of 5-10 active mergers.
-   **Real-time Updates**: Use Socket.io-client to receive live price updates.
-   **Spread Calculation**: Formula `((OfferPrice - CurrentPrice) / CurrentPrice) * 100` must be computed in real-time.
-   **Visual Feedback**: Price changes trigger a green/red flash animation.
-   **Resilience**: Show last known price + timestamp warning when the socket is disconnected.
-   **Initial Load**: Fetch merger list from the API on mount.

### Non-Functional Requirements
-   **Performance**: Low-latency rendering of price updates using Zustand.
-   **Design Consistency**: Strict adherence to `DESIGN.md` (no lines, 0px radius, specific color tokens).
-   **Accessibility**: Use WCAG-compliant colors for tertiary (success) and error states.

### Constraints
-   **Tech Stack**: React 19, Vite, Tailwind 4, Lucide-react, Zustand, Socket.io-client.
-   **Data Model**: Merger object with `targetTicker`, `targetName`, `buyerName`, `offerPrice`, `status`, `announcedDate`.

## 3. Approach

### Selected Approach: Feature-Sliced Architecture
We will implement a feature-based architecture for the arbitrage monitor. This encapsulates the complex business logic (spread calculations, WebSocket state) within the arbitrage feature while keeping the UI primitive and layout components reusable.

**Architecture Details:**
-   **State Management (Zustand)**: `useMergerStore` will manage the merger list, price updates, and connection status. — *Rationale: Zustand provides high performance for frequently updating data without the boilerplate of Redux.*
-   **Real-Time (Socket.io-client)**: `useMergerWebSocket` hook will initialize the socket and listen for `priceUpdate` events. — *Rationale: Socket.io handles automatic reconnection natively.*
-   **Component Structure**:
    -   `src/components/ui/`: `Badge.tsx`, `Typography.tsx`, `FlashableNumber.tsx`.
    -   `src/components/layout/`: `Header.tsx`, `MainLayout.tsx`.
    -   `src/features/arbitrage/`:
        -   `components/`: `MergerCard.tsx`, `MergerGrid.tsx`, `TickerTape.tsx`.
        -   `hooks/`: `useMergers.ts`, `useMergerWebSocket.ts`.
-   **Styling**: Tailwind 4 configuration using `@theme` in `index.css` for color tokens (obsidian slates, sharp corners).

### Alternatives Considered
-   **Flat Architecture**: Rejected because scalability for multi-feature apps is better with Feature-Sliced.
-   **Native WebSockets**: Considered but rejected in favor of `socket.io-client` for easier reconnection handling and event management.

### Decision Matrix

| Criterion | Weight | Feature-Sliced | Flat Architecture |
|-----------|--------|----------------|-------------------|
| Scalability | 40% | 5: Modular & isolated | 2: Becomes messy |
| Speed of Implementation | 20% | 3: Slightly more setup | 5: Direct & simple |
| Maintainability | 30% | 5: Clear ownership | 3: Good for small files |
| Separation of Concerns | 10% | 5: High | 2: Low |
| **Weighted Total** | | **4.6** | **2.9** |

## 4. Architecture (High-Level)
-   **Data Flow**: `API (Initial Load) -> Zustand Store -> UI`.
-   **Real-time Flow**: `Socket.io (Price Update) -> Zustand Store (Update Merger) -> UI (Reactive Update)`.
-   **Styling Flow**: `DESIGN.md (Rules) -> index.css (@theme) -> Tailwind Utilities`.

## 5. Agent Team
-   **design_system_engineer**: Set up Tailwind 4 tokens in `index.css` and create core UI primitives (`Badge`, `CardBase`, `Typography`).
-   **coder**: Implement the `useMergerStore` (Zustand) and `useMergerWebSocket` (Socket.io).
-   **coder**: Build the `MergerCard`, `MergerGrid`, and `Dashboard` components.
-   **technical_writer**: Document the component architecture and the design tokens used from `DESIGN.md`.

## 6. Risk Assessment
-   **Backend Down**: UI must keep the last known price/spread but show a `warning` chip/label with the last update time or "Reconnecting...". — *Rationale: This ensures the user is informed about data freshness without breaking the UI.*
-   **No Initial Data**: If no mergers are fetched, show a clear error to the user.
-   **Performance**: High-velocity updates could cause stuttering. We will ensure the `MergerCard` only re-renders when its specific merger data changes.

## 7. Success Criteria
-   Dashboard loads 5-10 mergers from the backend on mount.
-   WebSocket connects and updates prices in the store.
-   `MergerCard` flashes green/red on price changes.
-   The UI matches the "Sovereign Architect" design (Obsidian slates, Space Grotesk/Inter fonts, 0px radius).
-   **Resilience Test**: Simulate server downtime and verify the last known price remains and a warning is shown.
-   **Error Test**: Verify an error message is shown if the initial fetch fails.
