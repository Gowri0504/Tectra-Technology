# ============================================
# PRODUCTION BACKEND DOCKERFILE
# Multi-stage build for optimal image size
# ============================================

# STAGE 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl libc6-compat python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci

# STAGE 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY prisma ./prisma/
RUN npx prisma generate
RUN npm run build

# STAGE 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeuser

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

RUN chown -R nodeuser:nodejs /app
USER nodeuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
