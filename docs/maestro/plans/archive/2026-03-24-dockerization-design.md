# Design Document: arbiMerge Monorepo Dockerization

**Date**: 2026-03-24
**Status**: Approved
**Design Depth**: standard
**Task Complexity**: medium

## 1. Problem Statement
**Goal**: To provide a production-ready containerization strategy for the arbiMerge monorepo, enabling seamless deployment using Docker and Docker Compose.

**Context**:
- **Monorepo Structure**: Uses NPM Workspaces to manage `backend`, `frontend`, and `shared` packages.
- **Dependencies**: The `backend` and `frontend` both depend on the `@arbimerge/shared` package, which must be compiled before they can be built.
- **Backend Stack**: Node.js, Express, Prisma (PostgreSQL).
- **Frontend Stack**: React, Vite, TypeScript.
- **Deployment Strategy**: We aim for lean, production-optimized images using a multi-stage Docker build starting from the repository root.

**Key Requirements**:
- **Production Optimization**: Use `node:20-alpine` for the backend and `nginx:stable-alpine` for the frontend to minimize image size and attack surface.
- **Shared Dependency**: Correctly build and copy the `shared` package's `dist` folder into the final service images.
- **Environment Variables**: Use `ARG` for frontend build-time variables (like `VITE_API_URL`) and `ENV` for backend runtime secrets.
- **Prisma Support**: Ensure the backend image includes the necessary libraries (`openssl`) to run the Prisma client in an Alpine environment.

## 2. Requirements
### Functional Requirements
- **Dockerize Backend**: Create a production-ready Dockerfile that runs the Express server and supports Prisma.
- **Dockerize Frontend**: Create a production-ready Dockerfile that builds the Vite app and serves it via Nginx.
- **Build Shared Dependency**: Automatically compile the `@arbimerge/shared` package during the build process and provide it to the other packages.
- **Orchestrate via Docker Compose**: Update the existing `docker-compose.yml` to use the new Dockerfiles for the `backend` and `frontend` services.
- **Database Connection**: Ensure the `backend` container can connect to the PostgreSQL database using environment variables.

### Non-Functional Requirements
- **Image Size**: Final production images should be as small as possible (aiming for < 200MB).
- **Build Speed**: Use Docker layer caching and multi-stage builds to optimize build times for subsequent runs.
- **Security**: Minimize the attack surface by using `node:20-alpine` and `nginx:stable-alpine` and excluding dev dependencies from the final images.
- **Reliability**: Ensure the backend container remains stable even if the database is temporarily unavailable (e.g., using a health check or retry logic).

### Constraints
- **Monorepo**: Must handle the NPM workspaces and the `shared` dependency correctly.
- **Prisma**: Must install `openssl` in the backend image to ensure compatibility with Prisma's native engine in Alpine.
- **Vite Environment**: Must embed `VITE_` prefixed environment variables during the frontend build.

## 3. Approach
**Selected Approach: Approach 1 - Multi-stage Monorepo Build**

**Summary**: We'll use a single multi-stage build starting from the root of the monorepo to handle all package dependencies. This approach ensures that `@arbimerge/shared` is built once and its output is reused by both the backend and frontend.

**Architecture**:
1. **Base Stage**: Installs common dependencies for all packages in the workspace.
2. **Build Stage (Shared)**: Compiles `@arbimerge/shared` to its `dist` folder.
3. **Build Stage (Backend)**: Generates the Prisma client and compiles `@arbimerge/backend` using the shared package's `dist`.
4. **Build Stage (Frontend)**: Builds the Vite frontend using the shared package's `dist` and embeds `VITE_` prefixed environment variables.
5. **Prod Stage (Backend)**: Creates a lean `node:20-alpine` image with only the production dependencies and the compiled `backend` and `shared` `dist` folders.
6. **Prod Stage (Frontend)**: Creates a lean `nginx:stable-alpine` image serving the frontend's static assets.

**Rationale**:
- **Monorepo Awareness**: Naturally handles the `@arbimerge/shared` dependency without complex path mappings. — *Chosen to ensure robust workspace support.*
- **Production Efficiency**: Produces very small images by excluding all source code and dev dependencies from the final stages. — *Minimizes cloud costs and attack surface.*
- **Maintainability**: Centralizes the build logic for all services in a single, well-defined process. — *Simplifies CI/CD management.*

**Alternatives Considered**:
- **Approach 2: Package-specific Dockerfiles**: Rejected because of redundant logic and brittle file path mappings for the `shared` dependency.
- **Approach 3: Pre-built Shared Image**: Rejected due to the added complexity of managing a private registry and tagging shared images.

## 4. Architecture
**Component Diagram**:
```
[ Root Build Context ]
         |
         v
[ Stage 1: Base ] -> Install workspace dependencies (npm install)
         |
         v
[ Stage 2: Build Shared ] -> (npm run build -w packages/shared)
         |
         +---------------------------------------+
         |                                       |
         v                                       v
[ Stage 3: Build Backend ]              [ Stage 4: Build Frontend ]
- (prisma generate)                      - (npm run build -w packages/frontend)
- (npm run build -w packages/backend)    - (Uses Vite to embed VITE_ environment vars)
         |                                       |
         v                                       v
[ Stage 5: Prod Backend ]               [ Stage 6: Prod Frontend ]
- (node:20-alpine)                       - (nginx:stable-alpine)
- (Installs openssl for Prisma)          - (Copies static files from Stage 4)
- (Copies dist from Stage 2 & 3)         - (Serves on port 80)
- (Serves on port 3000)
```

## 5. Risk Assessment
### Technical Risks & Mitigation Strategies
- **Large Build Context**:
  - **Risk**: Copying the entire repository into the build context can slow down the build process.
  - **Mitigation**: Use a well-defined `.dockerignore` file in the root to exclude files like `node_modules`, `dist`, and `.git` from the initial copy.
- **Build Time Overhead**:
  - **Risk**: Building multiple packages sequentially in a single Dockerfile can be slow.
  - **Mitigation**: Leverage Docker's layer caching by copying `package.json` and `package-lock.json` and running `npm install` before copying the source code.
- **Prisma Alpine Compatibility**:
  - **Risk**: Prisma's native query engine may fail in the Alpine Linux environment if the required libraries are missing.
  - **Mitigation**: Explicitly install `openssl` in the backend's production image and verify that the Prisma client is correctly generated.
- **Secrets Leakage**:
  - **Risk**: Accidentally embedding secrets (like database URLs) into the Docker image at build-time.
  - **Mitigation**: Use `ENV` for backend runtime secrets and `ARG` only for non-sensitive frontend configuration (like `VITE_API_URL`).
- **Nginx Configuration**:
  - **Risk**: Default Nginx settings might not correctly handle React Router's client-side routing.
  - **Mitigation**: Provide a custom `nginx.conf` that redirects all 404s to `index.html` to ensure React Router works correctly.

## 6. Agent Team
- **devops_engineer**: Lead for creating the Dockerfiles and Nginx configuration.
- **coder**: Responsible for updating the root `package.json` and `docker-compose.yml`.
- **code_reviewer**: Performs the final quality gate and security audit.

## 7. Success Criteria
- **Successful Build**: The Docker images for the `backend` and `frontend` are built successfully without errors.
- **Successful Launch**: Both services start up correctly and communicate with each other and the database.
- **Optimized Size**: The final production images are significantly smaller than the development environment (e.g., < 200MB each).
- **Correct Configuration**: The frontend correctly connects to the backend using the embedded `VITE_API_URL`.
