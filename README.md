# Metropolitan E-commerce Platform

Modern e-commerce platform built with React Native, Expo, and Elysia.js.

## 🏗️ Repository Layout

Single repository with independent Bun projects under `packages/`:
- `packages/backend`: Elysia.js + Bun API (Domain-Driven Design)
- `packages/web-app`: Next.js storefront
- `packages/mobile-app`: React Native + Expo mobile application
- `packages/shared`: TypeScript types, constants, utilities (`@metropolitan/shared`)
- `packages/admin-panel` (planned): management dashboard shell

## ⚡ Quick Start

### 1. Install Dependencies
```bash
# Install all dependencies
bun run install:all

# Or individually
cd packages/backend && bun install
cd packages/web-app && bun install
cd packages/mobile-app && bun install
cd packages/shared && bun install
```

### 2. Environment Setup
```bash
# Backend environment
cd packages/backend
cp .env.example .env
# Edit .env with your configuration

# Mobile app environment
cd packages/mobile-app
cp .env.example .env
# Edit .env with your backend API URL
```

### 3. Database Setup
```bash
cd packages/backend
bun run db:generate
bun run db:migrate
bun run db:seed
```

### 4. Start Development
```bash
# Start all services
bun run dev:all

# Or individually
bun run dev:backend
bun run dev:mobile
```

## 📱 Mobile App Development

```bash
cd packages/mobile-app

# Start Expo development server
bun run start

# Platform specific
bun run android
bun run ios
bun run web
```

## 🔧 Backend API Development

```bash
cd packages/backend

# Hot reload development server
bun --hot index.ts

# Database operations
bun run db:generate
bun run db:migrate
bun run db:seed

# Testing
bun run test
```

## 🎯 Tech Stack

### Backend
- **Runtime**: Bun (modern JavaScript runtime)
- **Framework**: Elysia.js (TypeScript-first)
- **Database**: PostgreSQL + Drizzle ORM
- **Cache**: Redis
- **Auth**: JWT + token blacklisting
- **Payments**: Stripe integration
- **SMS**: Twilio (OTP)

### Mobile App
- **Framework**: Expo SDK 53 + React Native 0.79
- **Router**: Expo Router v5 (file-based routing)
- **State**: React Context API + custom hooks
- **Styling**: NativeWind 4.1 (Tailwind CSS for React Native)
- **API**: Axios + JWT token interceptors
- **Storage**: Expo SecureStore
- **Payments**: Stripe React Native
- **i18n**: react-i18next (TR, EN, PL)

### Shared Package
- **Types**: Order, Product, User, Cart, Address, Payment
- **Constants**: API_ENDPOINTS, ORDER_STATUS, ERROR_MESSAGES
- **Utils**: formatPrice, validatePhone, formatDate

## Kullanım

### Shared Package Kullanımı

```typescript
// Backend'de
import { User, Product, formatPrice } from '@metropolitan/shared';

// Mobile app'de
import { API_ENDPOINTS, ERROR_MESSAGES } from '@metropolitan/shared';
```

## Workspace Avantajları

1. **Tek Codebase**: Tüm projeler tek yerde
2. **Ortak Tipler**: API değişikliklerinde otomatik sync
3. **Shared Utilities**: Kod tekrarını önler
4. **Unified Development**: Tek komutla tüm servisleri çalıştır
5. **Consistent Deployment**: Docker compose ile kolay deploy

## Gelecek Planları

- [ ] Admin paneli ekleme
- [ ] Website ekleme
- [ ] Shared UI component library
- [ ] E2E test setup
- [ ] CI/CD pipeline 
