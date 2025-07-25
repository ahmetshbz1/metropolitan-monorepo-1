# CLAUDE.md

// "CLAUDE.md"
// metropolitan workspace - project specific configuration
// Created by Ahmet on 22.01.2025.

This file provides guidance to Claude Code when working with the Metropolitan e-commerce monorepo.

## 🏗️ Monorepo Architecture

**Bun workspaces** monorepo with e-commerce domain focus:
- **packages/backend**: Elysia.js + Bun API (Domain-Driven Design)
- **packages/mobile-app**: React Native + Expo mobile application
- **packages/shared**: TypeScript types, constants, utilities (@metropolitan/shared)

## ⚡ Development Commands

### Workspace Operations
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
bun run dev

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
- **Invoicing**: Fakturownia API (Polonya fatura sistemi)
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
├── catalog/        # Ürün kataloğu yönetimi
├── content/        # İçerik yönetimi (SSS, terms)
├── identity/       # Auth (OTP, JWT, phone login)
├── order/          # Sipariş + fatura + tracking
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

## 🚨 Critical Development Notes

### ⛔ STRICT COMMAND RESTRICTIONS
**YASAK KOMUTLAR - ASLA ÇALIŞTIRMA:**
- `bun run dev`
- `bun run start` 
- `expo start`
- `npm start`
- `yarn start`
- Herhangi bir sunucu başlatan komut

**GIT YASAĞI:**
- `git add`
- `git commit`
- `git push`
- Herhangi bir git komutu

**KURAL:** Ahmet "commit at" diye açıkça talep etmedikçe hiçbir git komutu çalıştırılmayacak. Bu kesinlikle yasaktır.

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
import { Order, Product, API_ENDPOINTS } from '@metropolitan/shared'

// Use consistent types across backend and mobile
const order: Order = await orderService.create(orderData)
```

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