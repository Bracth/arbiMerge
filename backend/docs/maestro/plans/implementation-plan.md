# Implementation Plan: arbiMerge Backend

**Task Complexity**: Complex

## 1. Background & Motivation
The backend is currently a scaffold with an empty `server.ts` and `index.ts`. We need to implement a fully functional backend that integrates with Yahoo Finance and provides real-time data to the frontend via WebSockets.

## 2. Scope & Impact
This implementation covers:
- Infrastructure setup (TS, dependencies).
- Database layer (Prisma).
- Service layer (Merger, Yahoo Finance, Spread).
- Socket layer (Socket.io).
- API layer (Express).

## 3. Proposed Solution
Build the backend in 5 phases:
- **Phase 1: Environment & Tooling** (Install dependencies, configure TS).
- **Phase 2: Database & Seed** (Prisma client, run seed script).
- **Phase 3: Service Layer** (Yahoo Finance integration, business logic).
- **Phase 4: Sockets & Real-Time** (Socket.io setup, background price emitter).
- **Phase 5: API & Integration** (Express endpoints, server startup).

## 4. Phased Implementation Plan

### Phase 1: Environment & Tooling
- **Agent**: `coder`
- **Goal**: Set up the Node.js / TypeScript environment and install all required dependencies.
- **Steps**:
    1. Update `package.json` with scripts (`dev`, `start`, `build`, `prisma:generate`, `db:seed`).
    2. Install dependencies: `express`, `socket.io`, `yahoo-finance2`, `dotenv`, `@prisma/client`, `cors`.
    3. Install dev dependencies: `typescript`, `tsx`, `@types/express`, `@types/node`, `@types/cors`, `prisma`.
    4. Create/Update `tsconfig.json`.
    5. Create `.env.example` file.
- **Verification**: Run `npm run build` or `tsc --noEmit`.

### Phase 2: Database & Seed
- **Agent**: `data_engineer`
- **Goal**: Configure the Prisma client and populate the database with initial merger data.
- **Steps**:
    1. Implement `backend/db/client.ts` as a singleton for `PrismaClient`.
    2. Move `backend/db/seed.ts` if necessary (it's already in `backend/db/seed.ts`).
    3. Run `npx prisma generate`.
    4. Provide instructions to run `npx prisma migrate dev` (requires a running DB).
- **Verification**: Check if `PrismaClient` is correctly generated and can be imported.

### Phase 3: Service Layer
- **Agent**: `coder`
- **Goal**: Implement the core logic for fetching merger data and market prices.
- **Steps**:
    1. Implement `backend/services/MergerService.ts` for database operations.
    2. Implement `backend/services/YahooFinanceService.ts` using `yahoo-finance2`.
    3. Implement `backend/services/SpreadCalculatorService.ts` for calculations.
- **Verification**: Unit test services with mock data.

### Phase 4: Sockets & Real-Time
- **Agent**: `coder`
- **Goal**: Implement real-time price updates via WebSockets.
- **Steps**:
    1. Implement `backend/sockets/SocketServer.ts` using `socket.io`.
    2. Implement `backend/sockets/PriceEmitter.ts` to fetch and broadcast updates every 5 seconds.
- **Verification**: Manually test WebSocket connection using a client (like Postman or a simple script).

### Phase 5: API & Integration
- **Agent**: `coder`
- **Goal**: Combine all layers and start the server.
- **Steps**:
    1. Implement `backend/server.ts` to set up Express and Socket.io.
    2. Implement `backend/index.ts` to initialize services and start the server.
    3. Add a `GET /api/mergers` endpoint to `server.ts`.
- **Verification**: Run `npm run dev` and verify that both REST and WebSockets are working.

## 5. Verification & Testing
- **Integration Test**: Verify `GET /api/mergers` returns the list of mergers from the DB.
- **WebSocket Test**: Verify the `priceUpdate` event is emitted every 5 seconds with valid price data.
- **End-to-End**: Ensure the frontend (if running) successfully connects and updates.

## 6. Migration & Rollback Strategies
- Use Prisma migrations for database versioning.
- In case of critical failure, roll back code using Git and database using `prisma migrate resolve`.
