# Production build - Simple version that works
FROM oven/bun:1-alpine

RUN apk add --no-cache python3 make g++ postgresql-client curl zip

WORKDIR /app

# Copy root package files (monorepo structure)
COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

# Install all dependencies and add uuid
RUN bun install && bun add uuid

# Copy all source code
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Install shared package dependencies
WORKDIR /app/packages/shared
RUN bun install

# Switch to backend directory and install dependencies
WORKDIR /app/packages/backend
RUN bun install

# Do not bake .env into the image; rely on runtime env from docker-compose
# and /opt/metropolitan/.env copied by deploy script.

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run TypeScript directly with Bun (no build needed)
CMD ["bun", "--hot", "index.ts"]
