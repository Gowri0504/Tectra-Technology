# ============================================
# PRODUCTION BACKEND DOCKERFILE
# Multi-stage build for optimal image size
# ============================================

# ============================================
# STAGE 1: Dependencies & Build
# ============================================
FROM node:20-alpine AS deps

# Install build dependencies
RUN apk add --no-cache \
    openssl \
    libc6-compat \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev for prisma)
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# ============================================
# STAGE 2: Production Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=deps /root/.npm /root/.npm
COPY --from=deps /root/.cache /root/.cache

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ============================================
# STAGE 3: Production Runtime
# ============================================
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache openssl

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Set ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# ============================================
# STARTUP COMMAND
# Runs migrations before starting server
# ============================================
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
