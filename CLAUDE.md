# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🏗️ Repository Layout

Single repository with standalone Bun/Node projects per package:

- `packages/backend`: Elysia.js + Bun API (Domain-Driven Design)
- `packages/web-app`: Next.js storefront
- `packages/mobile-app`: React Native + Expo mobile application
- `packages/shared`: TypeScript types, constants, utilities (`@metropolitan/shared`)
- `packages/admin-panel` (planned): management dashboard shell

## 🚀 Production Deployment

### Server Information

- **Server IP**: 91.99.232.146
- **Domain**: api.metropolitanfg.pl
- **SSH Alias**: metropolitan-deploy
- **Deploy Path**: /opt/metropolitan-backend
- **Deploy Script**: /opt/deploy.sh

### SSH Configuration

Add to `~/.ssh/config`:

```bash
Host metropolitan-deploy
    HostName 91.99.232.146
    User root
    Port 22
```

### Quick Deploy Commands

```bash
# SSH to production server
ssh metropolitan-deploy

# Deploy latest prod branch
ssh metropolitan-deploy "/opt/deploy.sh"

# View production logs
ssh metropolitan-deploy "docker-compose -f /opt/metropolitan-backend/docker-compose.prod.yml logs -f backend"

# Restart services
ssh metropolitan-deploy "docker-compose -f /opt/metropolitan-backend/docker-compose.prod.yml restart"
```

## ⚡ Development Commands

### Repository Operations

```bash
# Install all dependencies
bun run install:all

# Clean all node_modules
bun run clean

# Start all services concurrently
bun run dev:all
```

### Backend Development

```bash
cd packages/backend

# Hot reload development server
bun --hot index.ts

# Database operations
bun run db:generate    # Generate Drizzle schema
bun run db:migrate     # Run migrations
bun run db:seed        # Seed test data

# Production
bun run build
bun run start:prod

# Testing
bun run test
```

### Mobile App Development

```bash
cd packages/mobile-app

# Expo development server
bun run start

# Platform builds
bun run android
bun run ios
bun run web

# Quality control
bun run lint
bun run analyze
```

## 🎯 Tech Stack Specifics

### Backend (DDD Architecture)

- **Runtime**: Bun (modern JavaScript runtime)
- **Framework**: Elysia.js (TypeScript-first)
- **Database**: PostgreSQL + Drizzle ORM
- **Cache**: Redis (stock management, JWT blacklisting)
- **Auth**: JWT + token blacklisting
- **Payments**: Stripe integration + webhooks
- **Invoicing**: Fakturownia API (Polish invoice system)
- **SMS**: Twilio (OTP)
- **Monitoring**: Sentry

### Mobile App (React Native + Expo)

- **Framework**: Expo SDK 53 + React Native 0.79
- **Router**: Expo Router v5 (file-based routing)
- **State**: React Context API + custom hooks (NOT Zustand - just installed but unused)
- **Styling**: NativeWind 4.1 (Tailwind CSS for React Native)
- **API**: Axios + JWT token interceptors
- **Storage**: Expo SecureStore
- **Payments**: Stripe React Native
- **i18n**: react-i18next (TR, EN, PL)

### Shared Package

- **Import Pattern**: `@metropolitan/shared` alias
- **Types**: Order, Product, User, Cart, Address, Payment
- **Constants**: API_ENDPOINTS, ORDER_STATUS, ERROR_MESSAGES (Turkish)
- **Utils**: formatPrice (TRY), validatePhone (TR), formatDate (TR locale)

## 🗂️ Domain Organization (Backend)

```
src/domains/
├── catalog/        # Product catalog management
├── content/        # Content management (FAQ, terms)
├── identity/       # Auth (OTP, JWT, phone login)
├── order/          # Orders + invoices + tracking
├── payment/        # Stripe + webhook handling
├── shopping/       # Cart + favorites + stock reservation
└── user/           # Profile + address + company (NIP)
```

## 📱 Mobile App Structure

```
app/
├── (auth)/         # Phone login, OTP, profile setup
├── (tabs)/         # Main app navigation
├── checkout/       # Payment flow
├── product/[id]    # Product details
└── order/[id]      # Order tracking

components/
├── base/           # BaseInput, BaseButton
├── auth/           # Login components
├── cart/           # Cart management
├── checkout/       # Payment components
└── profile/        # User profile

context/
├── AuthContext    # User authentication
├── CartContext    # Shopping cart
├── ProductContext # Product data
└── AddressContext # Address management
```

## 🔒 Business Logic Specifics

### Authentication Flow

- Phone number + OTP (Twilio)
- JWT tokens + Redis blacklisting
- Individual vs Corporate user types
- Guest user support

### Order Management

- Complex calculation with shipping
- Stock reservation (Redis)
- Stripe payment processing
- Fakturownia invoice generation
- Multi-step checkout process

### Polish Market Focus

- NIP (tax number) validation + caching
- Fakturownia integration for invoices
- Polish addresses and phone formats
- Multi-currency support (PLN, EUR)

## 📊 Database Schema (PostgreSQL + Drizzle)

**Key Tables**:

- `users` - Individual/corporate user data
- `companies` - Corporate customer info (NIP validation)
- `addresses` - Shipping/billing addresses
- `orders` - Main order records
- `order_items` - Order line items
- `cart_items` - Shopping cart state
- `products` - Product catalog
- `tracking_events` - Shipping updates

## 🧪 Testing Strategy

### Backend Tests

```bash
cd packages/backend
bun run test                           # Run all tests
bun test src/tests/race-condition.test.ts  # Run specific test
```

**Test Coverage**:

- Race conditions (stock management)
- Webhook idempotency (Stripe events)
- Stock reservation/rollback (Redis)
- Integration flows (order creation)
- System validation (performance metrics)

**Performance Targets**:

- API response < 200ms
- Database queries < 100ms
- Redis operations < 10ms
- Stock operations > 95% success rate
- Webhook idempotency > 95%

## 🔧 Environment Setup

### Backend Environment Variables

```bash
# Required for all environments
JWT_SECRET=              # Min 32 characters
NODE_ENV=                # development | production | test
DATABASE_URL=            # PostgreSQL connection
DB_HOST=                 # PostgreSQL host
DB_PORT=                 # PostgreSQL port
POSTGRES_USER=           # Database user
POSTGRES_PASSWORD=       # Database password
POSTGRES_DB=             # Database name
REDIS_URL=               # Redis connection

# Production requirements
STRIPE_SECRET_KEY=       # Stripe API key
STRIPE_WEBHOOK_SECRET=   # Stripe webhook signing secret
TWILIO_ACCOUNT_SID=      # Twilio account ID
TWILIO_AUTH_TOKEN=       # Twilio auth token
TWILIO_VERIFY_SERVICE_SID= # Twilio Verify service
FAKTUROWNIA_API_TOKEN=   # Polish invoice API
FAKTUROWNIA_ACCOUNT=     # Fakturownia account
SENTRY_DSN=              # Error monitoring
```

### Mobile App Environment

```bash
# packages/mobile-app/.env
EXPO_PUBLIC_API_BASE_URL=  # Backend API URL (e.g., http://172.20.10.2:3000)
```

## 📡 API Integration

### Mobile to Backend Connection

- Development: Use local IP (e.g., `http://172.20.10.2:3000`)
- Axios interceptors handle JWT token attachment
- API client: `packages/mobile-app/core/api.ts`
- Secure token storage: Expo SecureStore

### Key API Patterns

- Auth: Phone + OTP verification
- Cart: Automatic guest-to-user migration
- Orders: Multi-step with Stripe payment
- Invoices: Fakturownia integration

## 🎨 UI/UX Standards

### Mobile Design

- Turkish UI text (default language)
- Modern, minimalist design
- Mobile-first responsive
- NativeWind component styling
- Consistent spacing with Tailwind classes

### Error Handling

- Turkish error messages (shared/constants)
- User-friendly error states
- Comprehensive logging to Sentry

## 🔄 Development Workflow

### Git Workflow

- Feature branches from main
- Turkish commit messages (Conventional Commits)
- Automatic testing on PRs

### Deployment

- Backend: Bun production builds
- Mobile: Expo builds for iOS/Android
- Environment-specific configurations

### Shared Types Usage

```typescript
// Import from shared package
import { Order, Product, API_ENDPOINTS } from "@metropolitan/shared";

// Use consistent types across backend and mobile
const order: Order = await orderService.create(orderData);
```

## 🚨 Critical Development Notes

### State Management

- **Mobile**: React Context API (NOT Zustand despite package.json)
- **Backend**: Domain services + repositories pattern
- **Shared**: Immutable data patterns

### External Dependencies

- **Stripe**: Payment processing + customer management
- **Fakturownia**: Polish invoice generation
- **Twilio**: SMS/OTP services
- **Redis**: Caching + session management

### Performance Considerations

- **Mobile**: NativeWind for styling, Expo optimizations
- **Backend**: Redis caching, database indexing, connection pooling
- **API**: JWT token auto-refresh, request/response compression

### Security Measures

- Environment variable validation
- JWT token blacklisting
- Stripe webhook signature validation
- Input sanitization and validation

System Directives

Language: Turkish (keep code/API names in English)
Tone: Professional, direct, solution-focused
Style: Concise, technically clear explanations
Error Handling: Hataları açıkça belirt, her zaman uygulanabilir çözüm öner.

Yasaklar

Kesinlikle mock veri kullanma.

Kesinlikle any tipi kullanma; her zaman güçlü ve doğru tipleri kullan.

Asla server veya app başlatma / build etme komutları çalıştırma.
(örn: bun run dev, yarn dev, npm start, yarn start, vb.)

Ben izin vermeden commit veya push yapma.

Workflow

Main branch üzerinde çalış.

Kodunu test et.

Prod’a merge et.

Kodlama Kuralları

Her dosya maksimum 400 satır, ideal olarak 300 satır kod içermeli.

Temiz kod prensiplerine uy:

Fonksiyonlar tek bir işi yapsın.

İsimlendirmeler açık, tutarlı ve anlamlı olsun.

Gereksiz yorum ekleme; yorumlar profesyonel ve Türkçe olmalı.

Güçlü tip kontrolü kullan (TypeScript, Go, Rust fark etmez).

Kod okunabilir, modüler ve sürdürülebilir olmalı.

Araç Kullanımı

Mevcut MCP tool’larını etkili şekilde kullan.

Duruma göre hangi aracı ne zaman kullanacağını dinamik olarak sen belirle.

Teknoloji veya framework kurulumlarında her zaman güncel web verilerini kullan.

Güncel sistem tarihine göre işlem yap.
