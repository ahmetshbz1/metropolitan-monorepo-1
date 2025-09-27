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

# Copy .env file for configuration
COPY .env ./.env

# Switch to backend directory
WORKDIR /app/packages/backend

# Copy .env to backend directory too (for drizzle config)
COPY .env ./.env

# Generate Drizzle client (optional)
RUN bun run db:generate || true

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run TypeScript directly with Bun (no build needed)
CMD ["bun", "--hot", "index.ts"]