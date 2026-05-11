# ============================================
# PRODUCTION FRONTEND DOCKERFILE (OFFLINE BUILD)
# ============================================

FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs -g nodejs

# Copy built assets from host
COPY public ./public
COPY .next/standalone ./
COPY .next/static ./.next/static

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
