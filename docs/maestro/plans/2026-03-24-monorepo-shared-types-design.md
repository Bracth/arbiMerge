---
design_depth: standard
task_complexity: medium
---

# Design Document: Monorepo with Shared Type System

## 1. Problem Statement
The `arbiMerge-agente-1` project currently uses string literals like `"UP"`, `"DOWN"`, and `"STABLE"` across both the backend and frontend for trend indicators. This lack of a unified type system leads to potential runtime errors, poor developer experience (no autocomplete), and manual duplication of domain-specific enums like `MergerStatus` and `AcquisitionType`. Without a shared source of truth, keeping the frontend and backend in sync across the WebSocket boundary becomes increasingly difficult as the project grows.

## 2. Requirements

### 2.1 Functional Requirements
- **REQ-1**: Establish a shared package (`@arbimerge/shared`) for common TypeScript types, enums, and interfaces.
- **REQ-2**: Sync all trend-related strings ("UP", "DOWN", "STABLE") into a single source of truth.
- **REQ-3**: Sync all domain-specific enums (MergerStatus, AcquisitionType) between backend and frontend.
- **REQ-4**: Move WebSocket payload interfaces to the shared package to ensure contract safety.

### 2.2 Non-Functional Requirements
- **Maintainability**: New shared types should be easy to add.
- **Consistency**: Shared types must be used everywhere instead of string literals.
- **Reliability**: Restructuring must not break existing build, test, or start scripts.

## 3. Approach

We've selected **Approach 1: Full Monorepo with Shared Package** to create a unified type system. This approach involves restructuring the project as an NPM workspace-based monorepo, where both the frontend and backend can depend on a shared package.

### 3.1 Key Decisions
- **Monorepo with NPM Workspaces** — *Industry standard for sharing TypeScript code between separate packages. It ensures seamless type sharing without complex path mapping. (considered: Path Mapping — rejected because it's harder to manage across different build tools like Vite and Node.)*
- **Dedicated `@arbimerge/shared` Package** — *Provides a clear boundary for types, enums, and utility constants. It allows for future expansion into shared logic like validators and calculation helpers. (considered: Shared Directory — rejected because it lacks the explicit dependency management of a package.)*
- **Manual Sync of Prisma Enums** — *For now, we will manually keep the `packages/shared` enums in sync with the backend Prisma schema. This avoids adding extra complexity to the build chain for a medium-scale refactor.*

### 3.2 Decision Matrix

| Criterion | Weight | Approach 1: Monorepo | Approach 2: Path Mapping |
|-----------|--------|-----------------------|--------------------------|
| **Scalability** | 30% | 5: Best for adding new shared logic in the future. | 3: Functional but harder to manage as shared code grows. |
| **Tooling Compatibility** | 30% | 5: Standard NPM workspaces work with all modern tools. | 2: Can cause issues with Vite/Node module resolution. |
| **Initial Effort** | 20% | 2: Requires restructuring files and updating `package.json`. | 5: Very little setup required. |
| **Code Organization** | 20% | 5: Clean, explicit boundaries for shared code. | 3: Shared files are "outside" the project structure. |
| **Weighted Total** | | **4.4** | **3.2** |

## 4. Architecture

### 4.1 Repository Structure
We will restructure the repository to follow a standard monorepo pattern using NPM workspaces.

- `root/`
  - `package.json` (defines `workspaces: ["packages/*"]`)
  - `packages/`
    - `backend/` (Moved from `root/backend`)
    - `frontend/` (Moved from `root/frontend`)
    - `shared/` (New shared types package)

### 4.2 Data Flow
1.  **Shared Package**: Defines common enums (`TrendType`, `MergerStatus`, `AcquisitionType`) and interfaces (`PriceUpdate`, `MergerPayload`).
2.  **Backend**: Imports `@arbimerge/shared` and uses the enums in services (e.g., `SpreadCalculatorService`) and for WebSocket payloads.
3.  **Frontend**: Imports `@arbimerge/shared` and uses the same enums in stores (e.g., `MergerStore`) and for processing WebSocket messages.

### 4.3 Key Interfaces
- `TrendType`: `"UP" | "DOWN" | "STABLE"` (Union or Enum)
- `MergerStatus`: `"ANNOUNCED" | "PENDING" | "COMPLETED" | "CANCELLED"`
- `AcquisitionType`: `"CASH" | "STOCK" | "MIXED"`

## 5. Agent Team
- **Refactor** — *Responsible for the monorepo restructuring, moving directories, and setting up the root `package.json` with NPM workspaces. They will also create the initial `@arbimerge/shared` package.*
- **Coder (Backend)** — *Focused on updating the backend services and WebSocket logic to use the new shared types. They will ensure the Prisma schema remains in sync with the shared enums.*
- **Coder (Frontend)** — *Responsible for updating the frontend stores, hooks, and components to consume the shared types, replacing all hardcoded string literals.*
- **Tester** — *Final validation agent to ensure that the backend and frontend still communicate correctly over the WebSocket boundary and that the UI accurately reflects the trend indicators.*

## 6. Risk Assessment
- **Broken Build Scripts** — *Restructuring directories may break existing scripts (e.g., `npm start`, `npm build`). Mitigation: We'll verify all root-level and package-level scripts after moving files. (Traces To: REQ-1)*
- **Prisma Schema Drift** — *Manually syncing Prisma enums could lead to inconsistencies if not carefully managed. Mitigation: We'll perform a final validation pass specifically to check that the shared TypeScript types match the Prisma schema. (Traces To: REQ-2)*
- **WebSocket Payload Mismatch** — *Changing interfaces over the WebSocket boundary can cause communication failures if not updated on both sides. Mitigation: We'll update the shared package first and then apply the changes to both the backend and frontend in sequence. (Traces To: REQ-3)*
- **IDE/Module Resolution Issues** — *Transitioning to workspaces can sometimes cause IDE confusion during the move. Mitigation: We'll clear `node_modules` and re-install from the root to ensure all symlinks are correctly established. (Traces To: REQ-4)*

## 7. Success Criteria
- [ ] Repository follows a clean monorepo structure with NPM workspaces.
- [ ] No hardcoded `"UP"`, `"DOWN"`, or `"STABLE"` string literals are used in services or stores.
- [ ] Backend and frontend both import types from `@arbimerge/shared`.
- [ ] Prisma schema and `@arbimerge/shared` enums are perfectly synchronized.
- [ ] Application build and start scripts function correctly.
- [ ] Real-time price updates show correct trend indicators in the UI.
