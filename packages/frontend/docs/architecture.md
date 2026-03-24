# Architecture & Design System

<!-- Source: src/lib/store.ts, src/features/arbitrage/hooks/useMergerWebSocket.ts, src/index.css -->

## 1. Feature-Sliced Structure
The application is organized into features to ensure scalability and maintainability.

### `src/features/arbitrage`
This is the core feature of the application.
- `components/`: Feature-specific components like `Dashboard`, `MergerCard`, `TickerTape`.
- `hooks/`: Feature-specific hooks like `useMergerWebSocket`.
- `types.ts`: Type definitions for the arbitrage domain.
- `index.ts`: Public API for the feature.

## 2. State Management (Zustand)
We use Zustand for global state management. The store is located in `src/lib/store.ts`.

### `useMergerStore`
- **State**:
  - `mergers`: Array of active merger arbitrage opportunities.
  - `connectionStatus`: Real-time connection state (`connected`, `reconnecting`, `error`, `idle`).
  - `lastUpdate`: Timestamp of the last price update.
  - `error`: Global error state.
- **Actions**:
  - `setMergers`: Initialize the merger list.
  - `updateMergerPrice`: Update a specific merger's price and recalculate the spread.
  - `setConnectionStatus`: Update the WebSocket connection status.

## 3. Real-time Data Flow (Socket.io)
Real-time price updates are handled via Socket.io.

### Initial Data Fetching
The `Dashboard` component fetches the initial list of mergers from the backend API (`/api/mergers`) on mount. If the fetch fails, it falls back to a set of dummy data to ensure the UI remains functional.

### `useMergerWebSocket`
This hook manages the WebSocket connection:
1.  Connects to the backend on mount.
2.  Updates `connectionStatus` in the Zustand store.
3.  Listens for `priceUpdate` events.
4.  Dispatches `updateMergerPrice` to the store when a new price arrives.

## 4. Design System (Tailwind 4)
The design system is implemented using Tailwind 4's `@theme` block in `src/index.css`.

### Design Tokens
- **Colors**:
  - `surface`: `#0b1326` (Base background)
  - `primary`: `#adc6ff` (Accents)
  - `tertiary`: `#4edea3` (Success/Positive)
  - `error`: `#ffb4ab` (Danger/Negative)
- **Typography**:
  - `font-headline`: Space Grotesk
  - `font-body`: Inter
- **Radius**:
  - `0px` for all elements (except `rounded-full`).

### Key Principles
- **No Borders**: Use background shifts (e.g., `surface-container-high` on `surface`) instead of 1px borders.
- **Glassmorphism**: Use `glass-panel` for floating elements.
- **Tabular Numbers**: Use `tabular-nums` class for all financial data to ensure alignment.
- **Flash Animations**: `flash-green` and `flash-red` for price changes.
