# Build stage
# Using node:22-slim (Debian-based) to satisfy rolldown version requirements
# and provide better compatibility for native bindings.
FROM node:22-slim AS builder

# Install build tools for native modules
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Remove lockfile to force re-resolution of platform-specific bindings
# (The current lockfile is missing linux-specific native bindings for rolldown)
RUN rm package-lock.json

# Copy workspace package files for dependency installation
COPY packages/shared/package.json packages/shared/package.json
COPY packages/frontend/package.json packages/frontend/package.json
COPY packages/backend/package.json packages/backend/package.json

# Install all dependencies
RUN npm install

# Copy source code and configurations
COPY packages/shared packages/shared
COPY packages/frontend packages/frontend

# Build shared package (dependency for frontend)
RUN npm run build -w packages/shared

# Build frontend package
RUN npm run build -w packages/frontend

# Production stage
FROM nginx:stable-alpine

# Copy static assets from build stage
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
