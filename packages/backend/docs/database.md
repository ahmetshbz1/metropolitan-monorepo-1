# Veritabanı Mimarisi

## 🗄️ Genel Bakış

Metropolitan Backend, **PostgreSQL** veritabanı ve **Redis** cache sistemi kullanarak hybrid bir veri depolama yaklaşımı benimser. Sistem **Drizzle ORM** ile type-safe database operations sağlar ve **20+ performance index** ile optimize edilmiştir.

## 📊 Database Schema

### Ana Tablolar

#### 1. Users Tablosu 👤
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    user_type TEXT NOT NULL DEFAULT 'individual' CHECK (user_type IN ('individual', 'corporate')),
    profile_photo_url TEXT,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    UNIQUE(phone_number, user_type)
);
```

#### 2. Companies Tablosu 🏢
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nip TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

#### 3. Products Tablosu 📦
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code TEXT UNIQUE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand TEXT,
    size TEXT,
    image_url TEXT,
    price DECIMAL(10,2),
    currency TEXT NOT NULL DEFAULT 'PLN',
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

#### 4. Orders Tablosu 📋
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shipping_address_id UUID NOT NULL REFERENCES addresses(id),
    billing_address_id UUID NOT NULL REFERENCES addresses(id),
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PLN',
    
    -- Stripe Payment Fields
    stripe_payment_intent_id TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    payment_method_type TEXT,
    stripe_client_secret TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Shipping Fields
    tracking_number TEXT,
    shipping_company TEXT DEFAULT 'DHL Express',
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    
    -- Additional Fields
    notes TEXT,
    invoice_pdf_path TEXT,
    invoice_pdf_generated_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

#### 5. Cart Items Tablosu 🛒
```sql
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    UNIQUE(user_id, product_id)
);
```

#### 6. Addresses Tablosu 🏠
```sql
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_title TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL,
    is_default_delivery BOOLEAN DEFAULT false NOT NULL,
    is_default_billing BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

#### 7. Favorites Tablosu ❤️
```sql
CREATE TABLE favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    PRIMARY KEY (user_id, product_id)
);
```

#### 8. Categories Tablosu 📂
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

#### 9. Category Translations Tablosu 🌐
```sql
CREATE TABLE category_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    name TEXT NOT NULL
);
```

#### 10. Product Translations Tablosu 🌐
```sql
CREATE TABLE product_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT,
    description TEXT
);
```

#### 11. Order Items Tablosu 📋
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

#### 12. Tracking Events Tablosu 📍
```sql
CREATE TABLE tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    status_text TEXT NOT NULL,
    location TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

#### 13. Guest Sessions Tablosu 👥
```sql
CREATE TABLE guest_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id TEXT UNIQUE NOT NULL,
    device_info TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

#### 14. Guest Cart Items Tablosu 🛒
```sql
CREATE TABLE guest_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    UNIQUE(guest_id, product_id)
);
```

#### 15. Guest Favorites Tablosu ❤️
```sql
CREATE TABLE guest_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    UNIQUE(guest_id, product_id)
);
```

### Performance Indexes

#### Kritik Performans İndeksleri
```sql
-- User authentication and phone lookup indexes
CREATE INDEX idx_users_phone_usertype ON users(phone_number, user_type);
CREATE INDEX idx_users_email ON users(email);

-- Product search indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_stock ON products(stock);

-- Order performance indexes
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_tracking_number ON orders(tracking_number);

-- Cart optimization indexes
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Address lookup indexes
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_default_delivery ON addresses(user_id, is_default_delivery);
CREATE INDEX idx_addresses_default_billing ON addresses(user_id, is_default_billing);

-- Favorites performance (already has PK index)
-- CREATE INDEX idx_favorites_user_product ON favorites(user_id, product_id);

-- Order items analysis
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Translation optimization
CREATE INDEX idx_product_translations_lang ON product_translations(language_code, product_id);
CREATE INDEX idx_category_translations_lang ON category_translations(language_code, category_id);

-- Guest session indexes
CREATE INDEX idx_guest_sessions_guest_id ON guest_sessions(guest_id);
CREATE INDEX idx_guest_sessions_expires_at ON guest_sessions(expires_at);

-- Guest cart optimization
CREATE INDEX idx_guest_cart_items_guest_id ON guest_cart_items(guest_id);
CREATE INDEX idx_guest_cart_items_product_id ON guest_cart_items(product_id);

-- Guest favorites
CREATE INDEX idx_guest_favorites_guest_id ON guest_favorites(guest_id);
CREATE INDEX idx_guest_favorites_product_id ON guest_favorites(product_id);

-- Tracking events
CREATE INDEX idx_tracking_events_order_id ON tracking_events(order_id);
CREATE INDEX idx_tracking_events_timestamp ON tracking_events(timestamp DESC);

-- Company lookup
CREATE INDEX idx_companies_nip ON companies(nip);
```

## 🔄 Redis Cache Architecture

### Cache Patterns

#### 1. Stock Management Cache 📊
```typescript
// Stock reservation pattern
const stockKey = `stock:${productId}`;
const lockKey = `stock:lock:${productId}`;
const reservationKey = `stock:reservation:${orderId}`;

// Atomic stock operations
await redis.multi()
    .set(lockKey, orderId, 'EX', 30)
    .decrby(stockKey, quantity)
    .set(reservationKey, quantity, 'EX', 900)
    .exec();
```

#### 2. Session Management 🔐
```typescript
// JWT token blacklisting
const blacklistKey = `blacklist:${tokenId}`;
await redis.set(blacklistKey, '1', 'EX', tokenExpiry);

// User session data
const sessionKey = `session:${userId}`;
await redis.hset(sessionKey, {
    lastActivity: Date.now(),
    permissions: JSON.stringify(permissions),
    deviceInfo: JSON.stringify(device)
});
```

#### 3. Cart Cache 🛒
```typescript
// Guest cart persistence
const guestCartKey = `guest:cart:${sessionId}`;
await redis.hset(guestCartKey, {
    items: JSON.stringify(cartItems),
    total: totalAmount,
    updatedAt: Date.now()
});

// User cart synchronization
const userCartKey = `user:cart:${userId}`;
await redis.hset(userCartKey, cartData);
```

### Cache Invalidation Strategy

#### Smart Cache Invalidation
```typescript
// Product cache invalidation
const invalidateProductCache = async (productId: string) => {
    const patterns = [
        `product:${productId}:*`,
        `products:category:*`,
        `products:search:*`,
        `cart:*:${productId}`
    ];
    
    for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }
};
```

## 🚀 Database Performance Optimizations

### Query Optimization

#### 1. Product Search Optimization
```sql
-- Full-text search with trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Optimized product search query
SELECT p.*, pt.name as translated_name
FROM products p
LEFT JOIN product_translations pt ON p.id = pt.product_id 
WHERE pt.language = $1 
  AND p.is_active = true
  AND (pt.name ILIKE $2 OR p.description ILIKE $2)
ORDER BY similarity(pt.name, $2) DESC, p.created_at DESC
LIMIT $3 OFFSET $4;
```

#### 2. Order Analytics Query
```sql
-- Efficient order analytics
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM orders 
WHERE created_at >= $1 
  AND status = 'completed'
GROUP BY month
ORDER BY month DESC;
```

### Connection Management

#### Database Connection Pool
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

const sql = postgres(connectionString, {
    max: 20,              // Maximum connections
    idle_timeout: 20,     // Close idle connections after 20s
    connect_timeout: 10,  // Connection timeout
    prepare: false,       // Disable prepared statements for better performance
});

export const db = drizzle(sql);
```

## 🔒 Data Security

### Encryption Strategy

#### 1. Password Security
```typescript
import bcrypt from 'bcrypt';

// Password hashing
const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

// Password verification
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};
```

#### 2. Sensitive Data Encryption
```typescript
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY;

const encryptSensitiveData = (data: string): string => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, secretKey);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
};
```

### Data Validation

#### Schema Validation
```typescript
import { z } from 'zod';

const userSchema = z.object({
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
    firstName: z.string().min(2).max(100),
    lastName: z.string().min(2).max(100),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    dateOfBirth: z.date().optional(),
    userType: z.enum(['individual', 'corporate'])
});
```

## 📈 Monitoring & Analytics

### Database Monitoring

#### Performance Metrics
```sql
-- Slow query monitoring
SELECT 
    query,
    calls,
    total_time,
    rows,
    mean_time,
    stddev_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage analysis
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public';

-- Table size monitoring
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Redis Monitoring

#### Cache Performance
```typescript
// Cache hit ratio monitoring
const getCacheStats = async () => {
    const info = await redis.info('stats');
    const lines = info.split('\r\n');
    
    const stats = lines.reduce((acc, line) => {
        const [key, value] = line.split(':');
        if (key && value) {
            acc[key] = value;
        }
        return acc;
    }, {} as Record<string, string>);
    
    return {
        hitRatio: (parseInt(stats.keyspace_hits) / 
                  (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses))) * 100,
        totalCommands: parseInt(stats.total_commands_processed),
        connectedClients: parseInt(stats.connected_clients),
        usedMemory: stats.used_memory_human
    };
};
```

## 🔄 Backup & Recovery

### Database Backup Strategy

#### Automated Backups
```bash
#!/bin/bash
# Daily backup script

DB_NAME="metropolitan_db"
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
pg_dump -h localhost -U postgres -d $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://metropolitan-backups/db/
```

#### Point-in-Time Recovery
```bash
# Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://metropolitan-wal-archive/%f'

# Recovery command
pg_basebackup -h localhost -D /var/lib/postgresql/recovery -U postgres -v -P -W
```

### Redis Persistence

#### Redis Backup Configuration
```conf
# redis.conf
save 900 1      # Save if at least 1 key changed in 900 seconds
save 300 10     # Save if at least 10 keys changed in 300 seconds
save 60 10000   # Save if at least 10000 keys changed in 60 seconds

# AOF persistence
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
```

## 🎯 Migration Strategy

### Database Migrations

#### Drizzle Migration Example
```typescript
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

// Migration file: 0001_add_user_preferences.sql
export const up = async (db: any) => {
    await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN preferences JSONB DEFAULT '{}',
        ADD COLUMN notification_settings JSONB DEFAULT '{}',
        ADD COLUMN privacy_settings JSONB DEFAULT '{}';
    `);
    
    await db.execute(sql`
        CREATE INDEX idx_users_preferences ON users USING gin(preferences);
    `);
};

export const down = async (db: any) => {
    await db.execute(sql`
        DROP INDEX IF EXISTS idx_users_preferences;
        ALTER TABLE users 
        DROP COLUMN preferences,
        DROP COLUMN notification_settings,
        DROP COLUMN privacy_settings;
    `);
};
```

### Zero-Downtime Migrations

#### Migration Best Practices
```typescript
// Safe column addition
await db.execute(sql`
    ALTER TABLE products 
    ADD COLUMN new_field VARCHAR(255) DEFAULT 'default_value';
`);

// Backfill data in batches
const batchSize = 1000;
let offset = 0;

while (true) {
    const batch = await db.execute(sql`
        UPDATE products 
        SET new_field = 'calculated_value'
        WHERE new_field = 'default_value'
        LIMIT ${batchSize} OFFSET ${offset};
    `);
    
    if (batch.rowCount === 0) break;
    offset += batchSize;
    
    // Small delay to prevent overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
}
```

## 📊 Schema Evolution

### Version Control

#### Schema Versioning
```typescript
// Schema version tracking
CREATE TABLE schema_versions (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    applied_by VARCHAR(100),
    rollback_sql TEXT
);

// Track each migration
INSERT INTO schema_versions (version, description, applied_by)
VALUES ('2024.01.001', 'Add user preferences', 'migration_system');
```

### Future-Proofing

#### Extensible Schema Design
```sql
-- Generic key-value store for future attributes
CREATE TABLE entity_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(entity_type, entity_id, attribute_name)
);

CREATE INDEX idx_entity_attributes_lookup 
ON entity_attributes(entity_type, entity_id, attribute_name);
```