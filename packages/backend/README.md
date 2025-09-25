# Metropolitan Backend

E-commerce backend API built with Elysia.js and Bun.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

### 3. Database Setup
```bash
# Generate database schema
bun run db:generate

# Run migrations
bun run db:migrate

# Seed test data (optional)
bun run db:seed
```

### 4. Start Development Server
```bash
# Hot reload development server
bun --hot index.ts

# Or use npm script
bun run dev
```

## 🔧 Environment Variables

Required environment variables (see `.env.example` for full list):

- `JWT_SECRET` - JWT signing secret (min 32 characters)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `STRIPE_SECRET_KEY` - Stripe API key for payments
- `TWILIO_ACCOUNT_SID` - Twilio account for SMS/OTP

## 📊 Database Operations

```bash
# Generate new migration
bun run db:generate

# Apply migrations
bun run db:migrate

# Reset database
bun run db:reset

# Seed test data
bun run db:seed
```

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run specific test
bun test src/tests/race-condition.test.ts
```

## 🏗️ Production

```bash
# Build for production
bun run build

# Start production server
bun run start:prod
```

## 📚 Tech Stack

- **Runtime**: Bun (modern JavaScript runtime)
- **Framework**: Elysia.js (TypeScript-first)
- **Database**: PostgreSQL + Drizzle ORM
- **Cache**: Redis
- **Auth**: JWT + token blacklisting
- **Payments**: Stripe integration
- **SMS**: Twilio (OTP)
- **Monitoring**: Sentry

This project was created using `bun init` in bun v1.2.16. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
