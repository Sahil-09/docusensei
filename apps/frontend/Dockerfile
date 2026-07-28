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

# Install workspace dependencies (with increased fetch timeout)
# Placed BEFORE COPY apps/ to cache npm installations and speed up builds
RUN pnpm install --frozen-lockfile --ignore-scripts --fetch-timeout 1200000

# Copy monorepo application files
COPY apps/ ./apps/

# Next.js Build arguments baked into the build
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Run the frontend production build
RUN npx nx build frontend


# ==========================================
# STAGE 2: Runner (Production)
# ==========================================
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy Next.js standalone server and optimized assets from dist/apps/frontend/.next/

# Copy Next.js standalone server
COPY --from=builder /app/dist/apps/frontend/.next/standalone ./

# Copy static assets into the exact centralized path expected by the standalone runner
COPY --from=builder /app/dist/apps/frontend/.next/static ./dist/apps/frontend/.next/static

# Copy public assets into the paths expected by the standalone runner
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/public ./public

RUN ls -la /app/dist/apps/frontend/.next
EXPOSE 3000

CMD ["node", "apps/frontend/server.js"]
