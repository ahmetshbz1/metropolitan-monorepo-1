# Multi-stage build for production-ready Bun application
# Stage 1: Dependencies
FROM oven/bun:1.2.22-alpine AS dependencies

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies (including dev dependencies for building)
RUN bun install --frozen-lockfile

# Stage 2: Build
FROM oven/bun:1.2.22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy package files and source code
COPY package.json bun.lockb tsconfig.json ./
COPY src ./src
COPY drizzle ./drizzle
COPY index.ts ./

# Build the application
RUN bun run build

# Stage 3: Production
FROM oven/bun:1.2.22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install only production dependencies
RUN bun install --production --frozen-lockfile && \
    bun pm cache clear

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/drizzle ./drizzle

# Create necessary directories
RUN mkdir -p /app/public && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun --eval "fetch('http://localhost:3000/health').then(() => process.exit(0)).catch(() => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["bun", "run", "start:prod"]