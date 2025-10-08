# Stage 1: Build
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Shared package dosyalarını kopyala
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared ./packages/shared

# Shared package bağımlılıklarını yükle
WORKDIR /app/packages/shared
RUN bun install

# Admin panel bağımlılıklarını yükle
WORKDIR /app/packages/admin-panel
COPY packages/admin-panel/package.json packages/admin-panel/bun.lock ./
RUN bun install --frozen-lockfile

# Admin panel dosyalarını kopyala
COPY packages/admin-panel .

# Build arguments
ARG VITE_API_URL=https://api.metropolitanfg.pl
ARG VITE_ADMIN_API_KEY=e2d8977b38e73d804cf2c2b7e98bd9da43adc00be8a34e4ed9eb13552c91
ARG VITE_NODE_ENV=production

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ADMIN_API_KEY=$VITE_ADMIN_API_KEY
ENV VITE_NODE_ENV=$VITE_NODE_ENV

# Vite production build
RUN bun run build

# Stage 2: Production
FROM nginx:alpine

# Nginx konfigürasyonunu kopyala
COPY packages/admin-panel/nginx.conf /etc/nginx/conf.d/default.conf

# Build çıktısını nginx'e kopyala
COPY --from=builder /app/packages/admin-panel/dist /usr/share/nginx/html

# Port 80'i expose et (nginx default)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Nginx başlat
CMD ["nginx", "-g", "daemon off;"]
