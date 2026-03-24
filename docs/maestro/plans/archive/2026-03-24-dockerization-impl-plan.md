# Implementation Plan: arbiMerge Monorepo Dockerization

**Date**: 2026-03-24
**Status**: Draft
**Task Complexity**: medium

## 1. Plan Overview
This plan outlines the steps to containerize the arbiMerge monorepo using a multi-stage Docker build strategy. We will create production-optimized Dockerfiles for the backend and frontend, update the root orchestration configuration, and ensure all shared dependencies are correctly handled.

- **Total Phases**: 4
- **Agents Involved**: `devops_engineer`, `coder`, `code_reviewer`
- **Estimated Effort**: Moderate

## 2. Dependency Graph
```
Phase 1: Foundation (root .dockerignore, nginx.conf)
    |
    +---------------------------------------+
    |                                       |
Phase 2a: Backend Dockerfile           Phase 2b: Frontend Dockerfile
    |                                       |
    +---------------------------------------+
    |
Phase 3: Orchestration (docker-compose.yml, package.json)
    |
Phase 4: Validation & Security Audit
```

## 3. Execution Strategy Table
| Stage | Phases | Execution Mode | Agent(s) |
|-------|--------|----------------|----------|
| 1 | 1 | Sequential | `devops_engineer` |
| 2 | 2a, 2b | Parallel | `devops_engineer` |
| 3 | 3 | Sequential | `coder` |
| 4 | 4 | Sequential | `code_reviewer` |

## 4. Phase Details

### Phase 1: Foundation & Build Context
**Objective**: Prepare the root build context and shared configuration files.

- **Agent**: `devops_engineer`
- **Rationale**: Expertise in optimizing Docker build contexts and Nginx configuration.

- **Files to Create**:
  - `.dockerignore`: Exclude `node_modules`, `dist`, `.git`, and other unnecessary files from the build context.
  - `packages/frontend/nginx.conf`: Custom Nginx configuration to support React Router's SPA routing (redirecting 404s to `index.html`).

- **Validation Criteria**:
  - Verify `.dockerignore` exists and includes `node_modules` and `dist`.
  - Verify `nginx.conf` includes the `try_files` directive for SPA support.

---

### Phase 2a: Backend Dockerfile
**Objective**: Create a production-ready, multi-stage Dockerfile for the backend.

- **Agent**: `devops_engineer`
- **Rationale**: Experience with multi-stage Node.js builds and Prisma Alpine compatibility.

- **Files to Create**:
  - `packages/backend/Dockerfile`: 
    - Base stage: Node 20-alpine, install `openssl`.
    - Build stage: Copy root `package.json`, install all deps, build `shared`, build `backend`.
    - Prod stage: Copy only `dist` folders and production `node_modules`.

- **Validation Criteria**:
  - `docker build -t arbimerge-backend -f packages/backend/Dockerfile .` completes successfully.
  - Final image includes `openssl` and the generated Prisma client.

- **Dependencies**:
  - `blocked_by`: [1]

---

### Phase 2b: Frontend Dockerfile
**Objective**: Create a production-ready, multi-stage Dockerfile for the frontend.

- **Agent**: `devops_engineer`
- **Rationale**: Experience with Vite builds and Nginx static serving.

- **Files to Create**:
  - `packages/frontend/Dockerfile`:
    - Base stage: Node 20-alpine.
    - Build stage: Copy root `package.json`, install all deps, build `shared`, build `frontend` (Vite).
    - Prod stage: Nginx-alpine, copy static assets from build stage and `nginx.conf` from Phase 1.

- **Validation Criteria**:
  - `docker build -t arbimerge-frontend -f packages/frontend/Dockerfile .` completes successfully.
  - Final image serves static files on port 80.

- **Dependencies**:
  - `blocked_by`: [1]

---

### Phase 3: Orchestration & Root Scripts
**Objective**: Update the existing orchestration and add convenience scripts.

- **Agent**: `coder`
- **Rationale**: Familiarity with the root project structure and existing `docker-compose.yml`.

- **Files to Modify**:
  - `docker-compose.yml`: Update `backend` and `frontend` services to use the new Dockerfiles and ensure correct environment variable mapping.
  - `package.json`: Add convenience scripts like `docker:build` and `docker:up` at the root.

- **Validation Criteria**:
  - `docker compose build` succeeds for all services.
  - `npm run docker:up` (or equivalent) starts the entire stack successfully.

- **Dependencies**:
  - `blocked_by`: [2a, 2b]

---

### Phase 4: Validation & Security Audit
**Objective**: Perform a final quality gate and security audit.

- **Agent**: `code_reviewer`
- **Rationale**: Ensure the implementation adheres to security best practices and the design document.

- **Implementation Details**:
  - Review Dockerfiles for credential leaks (e.g., hardcoded tokens).
  - Verify image sizes are within the target range (< 200MB).
  - Ensure all `VITE_` variables are correctly embedded in the frontend.

- **Validation Criteria**:
  - Final report confirms no critical or major security findings.
  - Verification of connectivity between frontend, backend, and database within the container network.

- **Dependencies**:
  - `blocked_by`: [3]

## 5. File Inventory
| Phase | Action | Path | Purpose |
|-------|--------|------|---------|
| 1 | Create | `.dockerignore` | Optimize build context. |
| 1 | Create | `packages/frontend/nginx.conf` | Support SPA routing in Nginx. |
| 2a | Create | `packages/backend/Dockerfile` | Production backend image. |
| 2b | Create | `packages/frontend/Dockerfile` | Production frontend image. |
| 3 | Modify | `docker-compose.yml` | Update orchestration config. |
| 3 | Modify | `package.json` | Add convenience scripts. |

## 6. Execution Profile
- Total phases: 4
- Parallelizable phases: 2 (in 1 batch: 2a, 2b)
- Sequential-only phases: 2
- Estimated parallel wall time: 25-30 mins
- Estimated sequential wall time: 40-50 mins

Note: Native parallel execution currently runs agents in autonomous mode. All tool calls are auto-approved without user confirmation.

## 7. Cost Estimation Summary
| Phase | Agent | Model | Est. Input | Est. Output | Est. Cost |
|-------|-------|-------|-----------|------------|----------|
| 1 | devops_engineer | Pro | 2,500 | 500 | $0.05 |
| 2a | devops_engineer | Pro | 3,000 | 800 | $0.07 |
| 2b | devops_engineer | Pro | 3,000 | 800 | $0.07 |
| 3 | coder | Pro | 3,500 | 600 | $0.06 |
| 4 | code_reviewer | Pro | 4,000 | 500 | $0.06 |
| **Total** | | | **16,000** | **3,200** | **$0.31** |
