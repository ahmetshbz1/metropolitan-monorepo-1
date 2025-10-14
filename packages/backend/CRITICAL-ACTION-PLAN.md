# KRİTİK AKSİYON PLANI - PRODUCTION DEPLOYMENT

**Hedef:** 1-2 hafta içinde production-ready olmak

---

## 🚨 HEMEN YAPILMASI GEREKENLER (Bu Hafta)

### 1️⃣ DATABASE INDEX'LERİ EKLE (1 GÜN) - P0

**Dosya Oluştur:** `drizzle/migrations/0002_critical_indexes.sql`

```sql
-- Webhook processing için KRİTİK
CREATE INDEX CONCURRENTLY idx_orders_stripe_payment_intent_id
  ON orders(stripe_payment_intent_id);

-- Foreign key index'leri (performance için KRİTİK)
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
CREATE INDEX CONCURRENTLY idx_products_category_id ON products(category_id);
CREATE INDEX CONCURRENTLY idx_order_items_order_id ON order_items(order_id);
CREATE INDEX CONCURRENTLY idx_order_items_product_id ON order_items(product_id);

-- Product listing için composite index
CREATE INDEX CONCURRENTLY idx_product_translations_lang_product
  ON product_translations(language_code, product_id)
  INCLUDE (name, full_name, description);

-- Order listing için
CREATE INDEX CONCURRENTLY idx_orders_status_created
  ON orders(status, created_at DESC);

-- Stock filtering için partial index
CREATE INDEX CONCURRENTLY idx_products_stock_available
  ON products(category_id, stock)
  WHERE stock > 0;
```

**Test Komutu:**
```bash
# Staging'de test et
bun run db:migrate

# Index kullanımını verify et
EXPLAIN ANALYZE SELECT * FROM orders WHERE stripe_payment_intent_id = 'pi_xxx';
```

---

### 2️⃣ WEBHOOK İDEMPOTENCY REDİS'E TAŞI (1 GÜN) - P0

**Dosya:** `src/domains/payment/application/webhook/idempotency.service.ts`

**Değişiklik:**
```typescript
export class IdempotencyService {
  // ❌ SİL
  // private static processedEvents = new Set<string>();

  // ✅ EKLE
  static async has(eventId: string): Promise<boolean> {
    return await redis.exists(`webhook:idempotency:${eventId}`) === 1;
  }

  static async add(eventId: string): Promise<void> {
    // 24 saat TTL - eski webhook'ları otomatik temizle
    await redis.setex(`webhook:idempotency:${eventId}`, 86400, "true");
  }

  static async clear(eventId: string): Promise<void> {
    await redis.del(`webhook:idempotency:${eventId}`);
  }
}
```

**Test Senaryosu:**
```typescript
// Test: Duplicate webhook rejection
const event = { id: 'test-event-123', type: 'payment_intent.succeeded' };

// İlk call başarılı olmalı
await webhookRouter.route(event); // Success

// İkinci call reject edilmeli (idempotency)
await webhookRouter.route(event); // Should be rejected
```

---

### 3️⃣ JWT GÜVENLİK İYİLEŞTİRMELERİ (2 GÜN) - P0

#### Step 1: Session Tracking Table Ekle

**Migration:** `drizzle/schema/user-sessions.ts`
```typescript
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  deviceId: text("device_id").notNull(),
  deviceName: text("device_name"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Index'ler
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at) WHERE revoked_at IS NULL;
```

#### Step 2: JWT Payload Type Safety

**Dosya:** `src/shared/types/jwt.types.ts` (YENİ)
```typescript
export interface JWTPayload {
  sub: string; // user ID
  exp: number; // expiry timestamp
  type: 'access' | 'refresh' | 'admin-access';
  userType?: 'individual' | 'corporate';
  sessionId: string; // session tracking için
  deviceId: string; // device tracking için
}

export interface RefreshTokenPayload {
  sub: string;
  exp: number;
  type: 'refresh';
  sessionId: string;
}
```

#### Step 3: Auth Guard Güncelleme

**Dosya:** `src/shared/application/guards/auth.guard.ts`
```typescript
import type { JWTPayload } from '../../types/jwt.types';

// ❌ SİL
// const decoded = (await jwt.verify(token)) as any;

// ✅ EKLE
const decoded = await jwt.verify(token) as JWTPayload | false;

if (!decoded) {
  return { profile: null };
}

// Session validity check
const sessionValid = await db.query.userSessions.findFirst({
  where: and(
    eq(userSessions.id, decoded.sessionId),
    isNull(userSessions.revokedAt),
    gt(userSessions.expiresAt, new Date())
  ),
});

if (!sessionValid) {
  return { profile: null };
}
```

#### Step 4: Token Revoke Endpoint Ekle

**Dosya:** `src/domains/identity/presentation/routes/auth.routes.ts`
```typescript
.post('/revoke-session', async ({ body, profile }) => {
  await db.update(userSessions)
    .set({ revokedAt: new Date() })
    .where(eq(userSessions.id, body.sessionId));

  return { success: true };
})

.post('/revoke-all-sessions', async ({ profile }) => {
  await db.update(userSessions)
    .set({ revokedAt: new Date() })
    .where(eq(userSessions.userId, profile.sub));

  return { success: true };
})
```

---

### 4️⃣ ADMİN AUTHORİZATİON SYSTEM (2 GÜN) - P0

#### Step 1: Permission Tables

**Migration:** `drizzle/schema/admin-permissions.ts`
```typescript
export const adminRoles = pgTable("admin_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(), // 'super_admin', 'product_manager', 'order_manager'
  description: text("description"),
});

export const adminPermissions = pgTable("admin_permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(), // 'products:read', 'products:write'
  resource: text("resource").notNull(), // 'products', 'orders', 'users'
  action: text("action").notNull(), // 'read', 'write', 'delete'
});

export const adminRolePermissions = pgTable("admin_role_permissions", {
  roleId: uuid("role_id").references(() => adminRoles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id").references(() => adminPermissions.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

export const adminUserRoles = pgTable("admin_user_roles", {
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").references(() => adminRoles.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));
```

#### Step 2: Permission Guard

**Dosya:** `src/domains/admin/application/guards/permission.guard.ts` (YENİ)
```typescript
export enum AdminPermission {
  PRODUCTS_READ = 'products:read',
  PRODUCTS_WRITE = 'products:write',
  PRODUCTS_DELETE = 'products:delete',
  ORDERS_READ = 'orders:read',
  ORDERS_WRITE = 'orders:write',
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',
}

export const requirePermissions = (...permissions: AdminPermission[]) => {
  return async (context: AdminContext) => {
    if (!context.admin) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    const hasPermissions = await checkAdminPermissions(context.admin.id, permissions);

    if (!hasPermissions) {
      context.set.status = 403;
      return { error: 'Insufficient permissions' };
    }
  };
};

async function checkAdminPermissions(adminId: string, permissions: AdminPermission[]): Promise<boolean> {
  const userPermissions = await db
    .select({ name: adminPermissions.name })
    .from(adminPermissions)
    .innerJoin(adminRolePermissions, eq(adminPermissions.id, adminRolePermissions.permissionId))
    .innerJoin(adminUserRoles, eq(adminRolePermissions.roleId, adminUserRoles.roleId))
    .where(eq(adminUserRoles.userId, adminId));

  const permissionNames = userPermissions.map(p => p.name);

  return permissions.every(p => permissionNames.includes(p));
}
```

#### Step 3: Route'lara Permission Ekle

**Dosya:** `src/domains/admin/presentation/routes/products.routes.ts`
```typescript
import { requirePermissions, AdminPermission } from '../../application/guards/permission.guard';

export const adminProductRoutes = new Elysia({ prefix: "/admin" })
  .use(isAdminAuthenticated)
  .get(
    "/products",
    requirePermissions(AdminPermission.PRODUCTS_READ),
    async ({ query, set }) => {
      // ...
    }
  )
  .post(
    "/products",
    requirePermissions(AdminPermission.PRODUCTS_WRITE),
    async ({ body, admin, set }) => {
      // ...
    }
  )
  .delete(
    "/products/:id",
    requirePermissions(AdminPermission.PRODUCTS_DELETE),
    async ({ params, admin, set }) => {
      // ...
    }
  );
```

#### Step 4: Seed Data

**Dosya:** `drizzle/seed/admin-permissions.ts`
```typescript
// Super Admin rolü oluştur (tüm permission'lar)
const superAdminRole = await db.insert(adminRoles).values({
  name: 'super_admin',
  description: 'Full system access'
}).returning();

// Permissions oluştur
const permissions = await db.insert(adminPermissions).values([
  { name: 'products:read', resource: 'products', action: 'read' },
  { name: 'products:write', resource: 'products', action: 'write' },
  { name: 'products:delete', resource: 'products', action: 'delete' },
  { name: 'orders:read', resource: 'orders', action: 'read' },
  { name: 'orders:write', resource: 'orders', action: 'write' },
  // ... diğer permissions
]).returning();

// Super admin'e tüm permission'ları ver
// ...
```

---

### 5️⃣ TRANSACTİON SCOPE REFACTORİNG (2-3 GÜN) - P0

#### Step 1: BullMQ Queue Setup

**Install:**
```bash
bun add bullmq
```

**Dosya:** `src/shared/infrastructure/queue/queue.config.ts` (YENİ)
```typescript
import { Queue, Worker } from 'bullmq';
import { redis } from '../cache/redis';

export const stripePaymentQueue = new Queue('stripe-payments', {
  connection: redis,
});

// Worker ayrı process'te çalışmalı (background)
export const createStripePaymentWorker = () => {
  return new Worker('stripe-payments', async (job) => {
    const { orderId, amount, currency, metadata } = job.data;

    // Stripe payment intent oluştur
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
    });

    // Order'ı güncelle
    await db.update(orders)
      .set({
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
      })
      .where(eq(orders.id, orderId));

    return { paymentIntentId: paymentIntent.id };
  }, {
    connection: redis,
  });
};
```

#### Step 2: Order Creation Refactor

**Dosya:** `src/domains/order/application/use-cases/order-creation.service.ts`

```typescript
// ❌ SİL - Eski implementation (transaction içinde Stripe)
static async createOrderWithStripe(...) {
  return await db.transaction(async (tx) => {
    await StockManagementService.validateAndReserveStock(tx, ...); // Redis call transaction içinde
    const stripeInfo = await PaymentProcessingService.processStripePayment(...); // Stripe API transaction içinde
    // ...
  });
}

// ✅ EKLE - Yeni implementation (minimal transaction)
static async createOrderWithStripe(...) {
  // 1. Redis stock reservation (outside transaction)
  const stockReservations = await StockManagementService.validateAndReserveStock(orderItemsData, userId);

  if (!stockReservations.valid) {
    return {
      success: false,
      error: 'Insufficient stock',
      insufficientItems: stockReservations.insufficientItems
    };
  }

  // 2. Quick DB transaction (only DB operations, ~50ms)
  const order = await db.transaction(async (tx) => {
    const orderPayload = PaymentProcessingService.createOrderPayload(...);
    const [order] = await tx.insert(orders).values(orderPayload).returning();

    await tx.insert(orderItems).values(
      orderItemsData.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
      }))
    );

    return order;
  });

  // 3. Stripe payment intent (background job - non-blocking)
  await stripePaymentQueue.add('create-payment-intent', {
    orderId: order.id,
    amount: totalAmount,
    currency: request.currency,
    metadata: {
      order_id: order.id,
      user_id: userId,
    },
  });

  // 4. Cart temizleme (background, webhook'tan sonra)
  // Zaten webhook'ta yapılıyor, değişiklik yok

  return {
    success: true,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      paymentStatus: 'pending', // Webhook ile güncellenecek
    },
    requiresPayment: true,
  };
}
```

#### Step 3: Webhook Handler Güncelleme

**Dosya:** `src/domains/payment/application/webhook/payment-intent-handlers.service.ts`

```typescript
// Webhook geldiğinde order'ı güncelle (zaten var, verify et)
static async handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
  const orderId = paymentIntent.metadata.order_id;

  // Order'ı güncelle (payment başarılı)
  await db.update(orders)
    .set({
      paymentStatus: 'paid',
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret,
    })
    .where(eq(orders.id, orderId));

  // Redis reservation'ı confirm et (zaten var)
  await RedisStockService.confirmReservation(paymentIntent.metadata.user_id, orderId);

  // Cart temizle (zaten var)
  await CartManagementService.clearCart(paymentIntent.metadata.user_id);
}
```

---

## 📝 TEST CHECKLİST

Her değişiklikten sonra:

```bash
# 1. Unit tests çalıştır
bun test

# 2. E2E tests çalıştır
bun test src/tests/critical-features.test.ts
bun test src/tests/payment-webhook-flow.test.ts

# 3. Manuel test scenarios
# - Duplicate webhook gönder (idempotency test)
# - Concurrent order creation (10+ parallel request)
# - JWT token invalidation test
# - Admin permission test (unauthorized access)
# - Transaction rollback test (Stripe fail scenario)
```

---

## 🎯 BAŞARI KRİTERLERİ

Bu aksiyonlar tamamlandığında:

✅ **Güvenlik**
- [ ] JWT güvenlik açıkları kapatıldı
- [ ] Admin authorization complete
- [ ] Session tracking & revoke mechanism aktif

✅ **Performans**
- [ ] Database query time <100ms (P95)
- [ ] Order creation time <300ms (transaction refactor sonrası)
- [ ] Webhook processing <500ms

✅ **Scalability**
- [ ] Multi-instance deployment ready (Redis idempotency)
- [ ] No race conditions (distributed locks + Redis)
- [ ] Connection pool exhaustion yok (transaction scope minimal)

✅ **Stability**
- [ ] No deadlocks (transaction scope minimal)
- [ ] Tüm testler passing (14/14 E2E)
- [ ] Idempotency guaranteed (Redis-based)

---

## 🚀 DEPLOYMENT PROCEDURE

### Staging Deployment
```bash
# 1. Database migrations
bun run db:migrate

# 2. Verify indexes
psql -d metropolitan -c "\d orders" # Check indexes

# 3. Deploy code
git push staging dev

# 4. Run tests
bun test

# 5. Manual QA (1 gün)
# - Order creation flow
# - Webhook processing
# - Admin operations
# - Load testing (100 concurrent users)
```

### Production Deployment
```bash
# 1. Backup database
pg_dump metropolitan > backup_$(date +%Y%m%d).sql

# 2. Create indexes (CONCURRENTLY - no downtime)
psql -d metropolitan -f drizzle/migrations/0002_critical_indexes.sql

# 3. Deploy code (zero-downtime)
# - Blue-green deployment veya rolling update

# 4. Monitor (1 saat)
# - Sentry error rate
# - Database query performance
# - Redis memory usage
# - API response times

# 5. Rollback plan ready
# - Previous version image ready
# - Database rollback script ready
```

---

**Sorumlu:** Development Team
**Deadline:** 1-2 hafta
**Priority:** P0 (Production Blocker)