# Product Requirements Document (PRD): arbiMerge Monorepo Dockerization

**Date**: 2026-03-24
**Status**: Draft
**Owner**: Product Manager / DevOps Lead

## 1. Executive Summary
The goal of this project is to containerize the arbiMerge monorepo to ensure consistent, secure, and efficient deployments across all environments. By implementing production-optimized multi-stage Docker builds, we will reduce infrastructure costs, improve security, and simplify the deployment workflow for both the backend and frontend services.

## 2. Problem Statement
Currently, the arbiMerge application lacks standardized production Dockerfiles. This leads to:
- **Environment Inconsistency**: Differences between local development and production environments can cause "it works on my machine" bugs.
- **Manual Build Steps**: The complex dependency between the `shared` package and the `backend`/`frontend` services requires manual coordination.
- **Suboptimal Image Sizes**: Without multi-stage builds, images would be unnecessarily large, containing source code and development tools.

## 3. Goals & Objectives
- **Standardization**: Create a single, reliable build process for all monorepo packages.
- **Performance**: Minimize image size (< 200MB) and build times.
- **Security**: Use minimal Alpine-based images and ensure secure management of secrets.
- **Compatibility**: Ensure full support for Prisma and Vite within the containerized environment.

## 4. User Stories
| ID | User Role | Requirement | Goal/Benefit |
|----|-----------|-------------|--------------|
| US-01 | Developer | I want to build images from the root. | To ensure all workspace dependencies are handled automatically. |
| US-02 | DevOps | I want lean production images. | To reduce storage costs and speed up deployments. |
| US-03 | Security | I want to use minimal base images. | To reduce the attack surface of our production environment. |

## 5. Functional Requirements
### 5.1 Backend Containerization
- **Runtime**: Node.js 20-alpine.
- **Dependencies**: Install `openssl` for Prisma.
- **Process**: Copy compiled `dist` and production `node_modules` only.
- **Secrets**: Handle database URL via runtime environment variables.

### 5.2 Frontend Containerization
- **Build**: Vite-based build embedded in a Docker stage.
- **Runtime**: Nginx:stable-alpine.
- **Routing**: Custom Nginx configuration to support Single Page Application (SPA) routing.
- **Config**: Embed `VITE_` variables during the build phase.

### 5.3 Shared Library Handling
- **Build Step**: Compile `@arbimerge/shared` before building services.
- **Distribution**: Reuse the `dist` output in both service containers.

## 6. Non-Functional Requirements
- **Maintainability**: Centralized build logic in the root.
- **Efficiency**: Leverage Docker layer caching for NPM installs.
- **Observability**: Images should support standard logging to stdout/stderr.

## 7. Technical Constraints
- **Workspaces**: Must respect NPM Workspaces configuration.
- **Prisma Engine**: Must generate the client for the `linux-musl` platform (Alpine).

## 8. Success Metrics
- Successful deployment to a container orchestration platform (e.g., "dockploy").
- Image sizes for both backend and frontend under 200MB.
- Automated build pipeline passes in under 5 minutes.
