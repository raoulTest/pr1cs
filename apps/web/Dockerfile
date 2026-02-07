# ============================================
# Stage 1: Build
# ============================================
FROM oven/bun:1.3 AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock ./
COPY turbo.json ./

# Copy workspace packages
COPY packages/env ./packages/env
COPY packages/config ./packages/config
COPY packages/backend ./packages/backend

# Copy web app
COPY apps/web ./apps/web

# Install dependencies
RUN bun install --frozen-lockfile

# Set build-time environment variables
ARG VITE_CONVEX_URL
ARG VITE_CONVEX_SITE_URL

ENV VITE_CONVEX_URL=${VITE_CONVEX_URL}
ENV VITE_CONVEX_SITE_URL=${VITE_CONVEX_SITE_URL}

# Build the web app
WORKDIR /app/apps/web
RUN bun run build

# ============================================
# Stage 2: Production Runner
# ============================================
FROM oven/bun:1.3-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built output from builder (client and server)
COPY --from=builder /app/apps/web/dist ./dist
COPY --from=builder /app/apps/web/package.json ./

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Run the server
CMD ["bun", "run", "dist/server/server.js"]
