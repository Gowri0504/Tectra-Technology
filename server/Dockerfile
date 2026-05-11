# ============================================
# PRODUCTION BACKEND DOCKERFILE (OFFLINE BUILD)
# ============================================

FROM node:20 AS runner
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nodeuser -g nodejs

ENV NODE_ENV=production

# Copy built assets from host
COPY dist ./dist
COPY node_modules ./node_modules
COPY prisma ./prisma
COPY package*.json ./

RUN chown -R nodeuser:nodejs /app
USER nodeuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (res) => res.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/src/index.js"]
