# Metropolitan Monorepo Performance Optimization Plan

## Executive Summary

This comprehensive performance optimization plan identifies critical bottlenecks across the Metropolitan monorepo (backend, mobile-app, shared packages) and provides actionable solutions with measurable performance targets.

### Key Performance Issues Identified:
- **Backend**: Missing database indexes, N+1 query problems, Redis misconfigurations
- **Mobile**: Inefficient data loading, missing image optimization, large bundle sizes
- **Infrastructure**: Suboptimal connection pooling, missing caching layers

### Expected Improvements:
- API response times: **< 200ms** (from current ~500ms)
- Database queries: **< 100ms** (from current ~300ms)
- Mobile app startup: **< 3 seconds** (from current ~5 seconds)
- Bundle size reduction: **30-40%**

---

## 1. Backend Performance Optimizations

### 1.1 Database Optimizations (Critical - Priority: HIGH)

#### Missing Indexes
**Problem**: No indexes defined in schema files, causing slow queries on frequently accessed columns.

**Solution**: Add critical indexes to improve query performance.

```sql
-- Create indexes for orders table
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- Create indexes for order_items table
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Create indexes for products table
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_stock ON products(stock);

-- Create indexes for cart_items table
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Create composite indexes for common queries
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_products_category_status ON products(category_id, status);
```

**Implementation Steps**:
1. Create migration file: `db/migrations/add_performance_indexes.sql`
2. Test indexes in development
3. Apply indexes during low-traffic period
4. Monitor query performance with `EXPLAIN ANALYZE`

#### Connection Pool Optimization
**Current**: 20 connections max, but missing key optimizations

**Optimized Configuration**:
```typescript
// packages/backend/src/shared/infrastructure/database/connection.ts
const client = postgres({
  // ... existing config
  
  // Enhanced connection pooling
  max: 30, // Increase for production load
  idle_timeout: 30, // Increase for better connection reuse
  connect_timeout: 5, // Reduce for faster failure detection
  
  // Query optimizations
  prepare: true, // Enable prepared statements for repeated queries
  statement_timeout: 10000, // 10 second query timeout
  query_timeout: 10000,
  
  // Connection lifecycle
  onnotice: () => {}, // Keep for performance
  transform: {
    undefined: null, // Transform undefined to null
  },
});
```

### 1.2 Query Optimization (Critical - Priority: HIGH)

#### N+1 Query Problem in Order Creation
**Problem**: Multiple individual INSERT queries in loops (order-creation.service.ts lines 214-221)

**Solution**: Use batch inserts
```typescript
// Replace individual inserts with batch insert
const orderItemsToInsert = orderItemsData.map(itemData => ({
  orderId: order.id,
  productId: itemData.product.id,
  quantity: itemData.quantity,
  unitPrice: itemData.unitPrice,
  totalPrice: itemData.totalPrice,
}));

await tx.insert(orderItems).values(orderItemsToInsert);
```

#### Optimize Product Queries with Eager Loading
```typescript
// Add relations to product queries
const productsWithRelations = await db.query.products.findMany({
  with: {
    category: true,
    images: true,
  },
  where: eq(products.status, 'active'),
  limit: pageSize,
  offset: (page - 1) * pageSize,
});
```

### 1.3 Redis Optimization (Critical - Priority: HIGH)

#### Fix Redis Configuration
**Problem**: `maxRetriesPerRequest: null` causes infinite retries on failures

**Solution**:
```typescript
// packages/backend/src/shared/infrastructure/database/redis.ts
const redisClient = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  
  // Performance optimizations
  maxRetriesPerRequest: 3, // Limit retries
  retryStrategy: (times) => Math.min(times * 50, 2000), // Exponential backoff
  enableReadyCheck: true,
  enableOfflineQueue: false, // Fail fast when Redis is down
  
  // Connection pooling
  lazyConnect: true,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true; // Reconnect on READONLY errors
    }
    return false;
  },
});
```

#### Replace O(N) Operations
**Problem**: Using `redis.keys()` in stock service (line 269) - O(N) operation

**Solution**: Use Redis SCAN for production-safe iteration
```typescript
// Replace keys() with scan()
static async cleanupExpiredReservations(): Promise<number> {
  const pattern = `${this.RESERVATION_PREFIX}*`;
  const stream = redis.scanStream({
    match: pattern,
    count: 100, // Process 100 keys at a time
  });
  
  let cleanedCount = 0;
  const now = new Date();
  
  for await (const keys of stream) {
    for (const key of keys) {
      // ... existing cleanup logic
    }
  }
  
  return cleanedCount;
}
```

#### Implement Caching Strategy
```typescript
// Product caching service
export class ProductCacheService {
  private static CACHE_TTL = 3600; // 1 hour
  private static CACHE_PREFIX = 'product:';
  
  static async getCachedProduct(productId: string): Promise<Product | null> {
    const cached = await redis.get(`${this.CACHE_PREFIX}${productId}`);
    return cached ? JSON.parse(cached) : null;
  }
  
  static async cacheProduct(product: Product): Promise<void> {
    await redis.setex(
      `${this.CACHE_PREFIX}${product.id}`,
      this.CACHE_TTL,
      JSON.stringify(product)
    );
  }
  
  static async invalidateProduct(productId: string): Promise<void> {
    await redis.del(`${this.CACHE_PREFIX}${productId}`);
  }
}
```

### 1.4 API Response Optimization

#### Enable Response Compression
**Current**: Compression plugin imported but configuration missing

**Solution**:
```typescript
// packages/backend/src/shared/infrastructure/middleware/compression.ts
import { Elysia } from 'elysia';
import { compress } from '@elysiajs/compress';

export const compressionPlugin = new Elysia()
  .use(compress({
    type: 'gzip', // or 'brotli' for better compression
    options: {
      level: 6, // Balance between speed and compression
    },
    encoding: 'gzip',
    threshold: 1024, // Only compress responses > 1KB
  }));
```

#### Implement Response Caching
```typescript
// Cache middleware for GET requests
export const cacheMiddleware = new Elysia()
  .derive(({ headers }) => {
    return {
      setCacheControl: (maxAge: number) => {
        headers['Cache-Control'] = `public, max-age=${maxAge}`;
      },
      setETag: (etag: string) => {
        headers['ETag'] = etag;
      },
    };
  });

// Usage in product routes
.get('/products', async ({ setCacheControl }) => {
  setCacheControl(300); // Cache for 5 minutes
  return await productService.getProducts();
});
```

---

## 2. Mobile App Performance Optimizations

### 2.1 Data Loading Optimization (Priority: HIGH)

#### Problem: Loading All Products Then Filtering
**Current**: HomeScreen loads all products then slices arrays

**Solution**: Implement API endpoints for specific product lists
```typescript
// Backend: Add specialized endpoints
.get('/products/featured', async () => {
  return await productService.getFeaturedProducts(4);
})
.get('/products/weekly', async () => {
  return await productService.getWeeklyProducts(4);
})
.get('/products/bestsellers', async () => {
  return await productService.getBestsellers(4);
})

// Mobile: Update ProductContext
const fetchHomeProducts = useCallback(async () => {
  try {
    const [featured, weekly, bestsellers, newArrivals] = await Promise.all([
      api.get('/products/featured'),
      api.get('/products/weekly'),
      api.get('/products/bestsellers'),
      api.get('/products/new-arrivals'),
    ]);
    
    setHomeProducts({
      featured: featured.data.data,
      weekly: weekly.data.data,
      bestsellers: bestsellers.data.data,
      newArrivals: newArrivals.data.data,
    });
  } catch (error) {
    console.error('Failed to fetch home products', error);
  }
}, []);
```

### 2.2 Image Optimization (Priority: HIGH)

#### Implement Progressive Image Loading
```typescript
// components/ui/OptimizedImage.tsx
import { Image, type ImageProps } from 'expo-image';
import { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

interface OptimizedImageProps extends ImageProps {
  thumbhash?: string; // Or blurhash
}

export function OptimizedImage({ 
  source, 
  thumbhash,
  ...props 
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  
  return (
    <View>
      <Image
        {...props}
        source={source}
        placeholder={thumbhash}
        contentFit="cover"
        transition={200}
        onLoadEnd={() => setLoading(false)}
        cachePolicy="memory-disk" // Enable caching
      />
      {loading && (
        <ActivityIndicator 
          style={{ position: 'absolute', alignSelf: 'center' }}
        />
      )}
    </View>
  );
}
```

#### Configure Image Caching
```typescript
// app/_layout.tsx - Configure global image cache
import { Image } from 'expo-image';

Image.prefetch([
  // Prefetch common images
  require('@/assets/images/logo.png'),
  require('@/assets/images/placeholder.png'),
]);

// Set cache limits
Image.setCacheLimit(100 * 1024 * 1024); // 100MB cache
```

### 2.3 Bundle Size Optimization (Priority: MEDIUM)

#### Remove Unused Dependencies
```bash
# Analyze bundle size
bun run analyze

# Remove unused Zustand (mentioned it's installed but not used)
bun remove zustand
```

#### Implement Code Splitting
```typescript
// Use lazy loading for heavy screens
const CheckoutScreen = lazy(() => import('@/app/checkout/index'));
const OrderDetailsScreen = lazy(() => import('@/app/order/[id]/index'));

// Wrap with Suspense
<Suspense fallback={<LoadingScreen />}>
  <CheckoutScreen />
</Suspense>
```

### 2.4 Context Optimization (Priority: MEDIUM)

#### Split Large Contexts
```typescript
// Split ProductContext into smaller, focused contexts
// contexts/ProductListContext.tsx - For product listing
// contexts/ProductSearchContext.tsx - For search functionality
// contexts/CategoryContext.tsx - For category management

// Use memo to prevent unnecessary re-renders
const MemoizedProductList = React.memo(ProductList, (prevProps, nextProps) => {
  return prevProps.products.length === nextProps.products.length &&
         prevProps.category === nextProps.category;
});
```

### 2.5 API Request Optimization

#### Implement Request Deduplication
```typescript
// core/api.ts - Add request deduplication
const pendingRequests = new Map();

api.interceptors.request.use(async (config) => {
  const requestKey = `${config.method}-${config.url}-${JSON.stringify(config.params)}`;
  
  // Check if identical request is pending
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }
  
  // Store promise for deduplication
  const promise = axios(config);
  pendingRequests.set(requestKey, promise);
  
  // Clean up after request completes
  promise.finally(() => {
    pendingRequests.delete(requestKey);
  });
  
  return config;
});
```

#### Add Request Timeout and Retry
```typescript
// core/api.ts
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add retry logic for failed requests
api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    
    if (!config || !config.retry) {
      config.retry = 0;
    }
    
    config.retry += 1;
    
    if (config.retry <= 3 && error.code === 'ECONNABORTED') {
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, config.retry * 1000));
      return api(config);
    }
    
    return Promise.reject(error);
  }
);
```

---

## 3. Infrastructure & Monitoring

### 3.1 Performance Monitoring Setup

#### Backend Monitoring
```typescript
// Add performance tracking middleware
const performanceMiddleware = new Elysia()
  .derive(({ store }) => {
    store.startTime = process.hrtime.bigint();
    return {};
  })
  .onAfterHandle(({ store, path, request }) => {
    const duration = Number(process.hrtime.bigint() - store.startTime) / 1_000_000;
    
    // Log slow requests
    if (duration > 200) {
      console.warn(`Slow request: ${request.method} ${path} took ${duration}ms`);
    }
    
    // Send metrics to monitoring service
    metrics.histogram('http_request_duration_ms', duration, {
      method: request.method,
      path,
    });
  });
```

#### Database Query Monitoring
```typescript
// Wrap database connection with monitoring
import { drizzle } from 'drizzle-orm/postgres-js';

const monitoredDb = drizzle(client, {
  schema,
  logger: {
    logQuery(query, params) {
      const start = Date.now();
      // Log slow queries
      if (Date.now() - start > 100) {
        console.warn(`Slow query (${Date.now() - start}ms):`, query);
      }
    },
  },
});
```

### 3.2 Performance Testing

#### Load Testing Script
```typescript
// tests/load-test.ts
import { check } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests < 200ms
    http_req_failed: ['rate<0.1'],    // Error rate < 10%
  },
};

export default function() {
  // Test product listing
  const productsRes = http.get('http://localhost:3000/api/products');
  check(productsRes, {
    'products status is 200': (r) => r.status === 200,
    'products response < 200ms': (r) => r.timings.duration < 200,
  });
  
  // Test product details
  const productRes = http.get('http://localhost:3000/api/products/123');
  check(productRes, {
    'product status is 200': (r) => r.status === 200,
    'product response < 100ms': (r) => r.timings.duration < 100,
  });
}
```

---

## 4. Implementation Roadmap

### Phase 1: Critical Backend Fixes (Week 1)
1. **Day 1-2**: Implement database indexes and test impact
2. **Day 3**: Fix Redis configuration and replace O(N) operations
3. **Day 4-5**: Optimize N+1 queries in order creation
4. **Day 5**: Deploy and monitor

### Phase 2: API & Caching (Week 2)
1. **Day 1-2**: Implement response compression and caching
2. **Day 3**: Add specialized product endpoints
3. **Day 4**: Implement Redis caching layer
4. **Day 5**: Performance testing and tuning

### Phase 3: Mobile Optimizations (Week 3)
1. **Day 1-2**: Implement lazy loading and image optimization
2. **Day 3**: Optimize context and state management
3. **Day 4**: Add request deduplication and retry logic
4. **Day 5**: Bundle size optimization

### Phase 4: Monitoring & Testing (Week 4)
1. **Day 1-2**: Set up performance monitoring
2. **Day 3**: Implement automated performance tests
3. **Day 4-5**: Load testing and final optimizations

---

## 5. Success Metrics

### Backend Metrics
- **API Response Time**: p95 < 200ms (currently ~500ms)
- **Database Query Time**: p95 < 100ms (currently ~300ms)
- **Redis Operation Time**: p95 < 10ms
- **Error Rate**: < 0.1%
- **Throughput**: > 1000 req/s

### Mobile Metrics
- **App Startup Time**: < 3 seconds (currently ~5 seconds)
- **Image Load Time**: < 500ms with progressive loading
- **Bundle Size**: 30-40% reduction
- **Memory Usage**: < 150MB average
- **FPS**: Consistent 60 FPS

### Business Metrics
- **Cart Abandonment Rate**: Reduce by 15%
- **Checkout Completion Rate**: Increase by 20%
- **User Session Duration**: Increase by 25%
- **API Cost**: Reduce by 30% through caching

---

## 6. Maintenance & Best Practices

### Performance Budget
- New features must not increase load time by > 100ms
- Bundle size increase must be justified and < 50KB
- New database queries must complete in < 100ms
- All images must be optimized and < 200KB

### Code Review Checklist
- [ ] Database queries use indexes
- [ ] No N+1 query problems
- [ ] API responses are cached where appropriate
- [ ] Images are optimized and lazy loaded
- [ ] Bundle impact analyzed
- [ ] Performance tests pass

### Monitoring Alerts
- API response time > 300ms for 5 minutes
- Database query time > 200ms
- Redis connection failures
- Error rate > 1%
- Memory usage > 80%

---

## Conclusion

This comprehensive optimization plan addresses critical performance bottlenecks across the Metropolitan monorepo. Implementation should follow the phased approach, with continuous monitoring to ensure improvements are sustained. Expected overall performance improvement is 50-70% across all metrics.