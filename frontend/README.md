# ArbiMerge Frontend

Institutional Arbitrage Monitor.

## Tech Stack
- **React 19**: Latest React features.
- **Vite 8**: Fast development and build.
- **Tailwind 4**: Utility-first CSS with `@theme` block.
- **Zustand 5**: Lightweight state management.
- **Socket.io-client 4**: Real-time price updates.
- **TypeScript 5.9**: Type safety.

## Getting Started

### Prerequisites
- Node.js (v20+)
- npm or yarn

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root:
   ```env
   VITE_BACKEND_URL=http://localhost:3000
   ```

### Running the App
```bash
npm run dev
```

## Architecture
The project follows a **Feature-Sliced** structure:
- `src/features`: Domain-specific logic and components.
- `src/components`: Shared UI components.
- `src/lib`: Shared utilities and store.
- `src/assets`: Static assets.

## Design System
The design follows the **Sovereign Architect** principle:
- **Obsidian Slates**: Dark, low-fatigue palette.
- **Sharp Corners**: `0px` border-radius for precision.
- **No Lines**: Boundaries defined by background shifts, not borders.
- **Typography**: Space Grotesk for headlines, Inter for data.

For more details, see [Architecture & Design System](./docs/architecture.md).
