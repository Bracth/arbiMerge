# Stage 1: Base
FROM node:20-alpine AS base
WORKDIR /app

# Stage 2: Build
FROM base AS builder
# Install build dependencies (required for Prisma and potentially native modules)
RUN apk add --no-cache openssl

# Copy root package files
COPY package.json package-lock.json ./

# Copy package.json files for all workspaces to allow npm install to cache
COPY packages/backend/package.json packages/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/frontend/package.json packages/frontend/package.json

# Install all dependencies at the root
RUN npm ci

# Copy source code
COPY packages/shared packages/shared
COPY packages/backend packages/backend

# Run npm run build -w packages/shared
RUN npm run build -w packages/shared

# Run npm run prisma:generate -w packages/backend
RUN DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm run prisma:generate -w packages/backend

# Run npm run build -w packages/backend
RUN npm run build -w packages/backend

# Stage 3: Production Dependencies
FROM base AS deps-prod
# Copy root package files
COPY package.json package-lock.json ./

# Copy package.json files for all workspaces
COPY packages/backend/package.json packages/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/frontend/package.json packages/frontend/package.json

# Install only production dependencies
RUN npm ci --omit=dev

# Stage 4: Production Stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install openssl (required for Prisma)
RUN apk add --no-cache openssl

# Set environment to production
ENV NODE_ENV=production

# Copy production node_modules and workspace structures from deps-prod
COPY --from=deps-prod --chown=node:node /app/node_modules ./node_modules
COPY --from=deps-prod --chown=node:node /app/packages ./packages

# Copy compiled dist folders from shared and backend
COPY --from=builder --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=node:node /app/packages/backend/dist ./packages/backend/dist

# Copy Prisma schema and generated client (essential for Prisma)
COPY --from=builder --chown=node:node /app/packages/backend/db/schema.prisma ./packages/backend/db/schema.prisma
COPY --from=builder --chown=node:node /app/packages/backend/node_modules/.prisma ./packages/backend/node_modules/.prisma

# Switch to non-root user
USER node

# Set the start command
CMD ["node", "packages/backend/dist/index.js"]
