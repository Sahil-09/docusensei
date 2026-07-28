# ==========================================
# STAGE 1: Build the Application
# ==========================================
ARG NODE_VERSION=24.1.0-alpine

FROM node:${NODE_VERSION} AS builder
WORKDIR /app

# Enable PNPM
ENV PNPM_HOME='/pnpm'
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy workspace settings and dependency lockfiles
COPY package.json pnpm-lock.yaml* nx.json tsconfig.base.json pnpm-workspace.yaml* ./

# Install all workspace dependencies (with increased fetch timeout)
# Placed BEFORE COPY apps/ to cache npm installations and speed up builds
RUN pnpm install --frozen-lockfile --ignore-scripts --fetch-timeout 1200000

# Cache buster for copying application code
ARG BUST_CACHE=1
RUN echo "Busting cache: ${BUST_CACHE}"

# Copy all application directories (required for Prisma client context)
COPY apps/ ./apps/

# Debug: list files copied to /app/apps/backend
RUN ls -la /app/apps/backend

# Generate Prisma Client (located under apps/backend/generated/prisma)
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Compile NestJS bundle via Nx
RUN npx nx build backend

# Create a separate folder to install production-only dependencies at root level
# We explicitly add @prisma/client and @nestjs/config because they are missed or classed as devDependencies in the root package.json
WORKDIR /app/prod-install
RUN cp /app/dist/apps/backend/package.json ./package.json && \
    (pnpm install --prod --no-frozen-lockfile --ignore-scripts --fetch-timeout 1200000 && pnpm add @prisma/client prisma @nestjs/config --save-prod --fetch-timeout 1200000) || \
    (npm install --omit=dev && npm install @prisma/client prisma @nestjs/config)


# ==========================================
# STAGE 2: Runner (Production)
# ==========================================
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy production node_modules to /app/node_modules (so both main.js and generated prisma client can resolve them)
COPY --from=builder /app/prod-install/node_modules ./node_modules
COPY --from=builder /app/prod-install/package.json ./package.json

# Copy built bundle, generated Prisma client, and migrations
COPY --from=builder /app/dist/apps/backend ./dist/apps/backend
COPY --from=builder /app/apps/backend/generated/ ./apps/backend/generated/
COPY --from=builder /app/apps/backend/prisma/ /app/apps/backend/prisma/
COPY --from=builder /app/apps/backend/prisma.config.mjs /app/apps/backend/prisma.config.mjs

# Copy the custom entrypoint script
COPY apps/backend/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 4444

ENTRYPOINT ["./entrypoint.sh"]
