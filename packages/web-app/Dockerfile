# ---- Dependencies Stage ----
FROM node:22-alpine AS deps
WORKDIR /app

# Bun kurulumu
RUN npm install -g bun

# Shared package'ı kopyala
COPY packages/shared /app/packages/shared

# Shared dependencies
WORKDIR /app/packages/shared
RUN bun install

# Web-app dependencies
WORKDIR /app/packages/web-app
COPY packages/web-app/package.json packages/web-app/bun.lock* ./
RUN bun install --frozen-lockfile

# ---- Builder Stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Bun kurulumu
RUN npm install -g bun

# Shared package'ı kopyala ve build et
COPY --from=deps /app/packages/shared /app/packages/shared
WORKDIR /app/packages/shared
RUN bun run build

# Web-app için çalışma dizini
WORKDIR /app/packages/web-app

# Dependencies'i kopyala
COPY --from=deps /app/packages/web-app/node_modules ./node_modules

# Shared package'ı node_modules'e link et
RUN rm -rf ./node_modules/@metropolitan/shared && \
    mkdir -p ./node_modules/@metropolitan && \
    ln -s /app/packages/shared ./node_modules/@metropolitan/shared

# Web-app dosyalarını kopyala
COPY packages/web-app/package.json packages/web-app/bun.lock* ./
COPY packages/web-app .

# Build arguments
ARG NEXT_PUBLIC_API_URL=https://api.metropolitanfg.pl

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js build
RUN bun run build

# ---- Production Stage ----
FROM node:22-alpine AS runner
WORKDIR /app

# Production dependencies
RUN npm install -g bun && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js dosyalarını kopyala
COPY --from=builder /app/packages/web-app/next.config.ts ./
COPY --from=builder /app/packages/web-app/package.json ./
COPY --from=builder /app/packages/web-app/public ./public

# Build çıktılarını kopyala
COPY --from=builder --chown=nextjs:nodejs /app/packages/web-app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/web-app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["node", "server.js"]
