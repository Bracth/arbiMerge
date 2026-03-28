# Stage 1: Base
FROM node:20-alpine AS base
WORKDIR /app

# Stage 2: Build
FROM base AS builder
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/frontend/package.json packages/frontend/package.json
RUN npm ci
COPY packages/shared packages/shared
COPY packages/backend packages/backend
RUN npm run build -w packages/shared
# Generamos Prisma para poder compilar el TypeScript del backend
RUN DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm run prisma:generate -w packages/backend
RUN npm run build -w packages/backend

# Stage 3: Production Dependencies
FROM base AS deps-prod
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/frontend/package.json packages/frontend/package.json
RUN npm ci --omit=dev
# ¡TRUCO AQUÍ! Copiamos el schema y generamos Prisma en las dependencias de PROD también
COPY packages/backend/db ./packages/backend/db
COPY packages/backend/prisma.config.ts ./packages/backend/prisma.config.ts
RUN DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm run prisma:generate -w packages/backend

# Stage 4: Production Stage
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production

# Copiamos TODOS los node_modules (que ya incluyen Prisma generado correctamente por el Stage 3)
COPY --from=deps-prod --chown=node:node /app/node_modules ./node_modules
COPY --from=deps-prod --chown=node:node /app/packages ./packages

# Copiamos los distritos compilados
COPY --from=builder --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=node:node /app/packages/backend/dist ./packages/backend/dist

# Exponemos el puerto para Dokploy
EXPOSE 3000

USER node
CMD ["node", "packages/backend/dist/index.js"]