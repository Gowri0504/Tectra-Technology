# Build stage
FROM node:20-alpine AS build

# Install minimal dependencies for SWC compatibility on Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Harden npm configuration for stability
RUN npm config set strict-ssl false && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

COPY package*.json ./

# Install dependencies with retry logic
RUN npm install --no-audit --no-fund || (sleep 5 && npm install --no-audit --no-fund)

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.* ./

EXPOSE 3000

CMD ["npm", "start"]
