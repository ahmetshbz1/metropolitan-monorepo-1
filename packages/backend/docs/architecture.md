# Metropolitan Backend Mimarisi

## 🏗️ Genel Mimari Yaklaşımı

Metropolitan Backend, **Domain-Driven Design (DDD)** prensiplerini takip eden, **enterprise-grade** bir e-ticaret backend servisidir. Sistem **hexagonal architecture** yaklaşımı ile tasarlanmış olup, yüksek performans ve güvenilirlik için optimize edilmiştir.

## 📁 Proje Yapısı

```
packages/backend/
├── src/
│   ├── domains/              # Domain-specific business logic
│   │   ├── catalog/          # Ürün katalogu
│   │   ├── content/          # İçerik yönetimi
│   │   ├── identity/         # Kimlik doğrulama
│   │   ├── order/           # Sipariş işlemleri
│   │   ├── payment/         # Ödeme işlemleri
│   │   ├── shopping/        # Alışveriş (sepet, favoriler)
│   │   └── user/            # Kullanıcı profili
│   ├── shared/              # Ortak altyapı bileşenleri
│   │   ├── application/     # Uygulama katmanı
│   │   └── infrastructure/  # Altyapı katmanı
│   └── tests/               # Test suites
├── drizzle/                 # Database migrations
├── public/                  # Static assets
├── scripts/                 # Development scripts
└── uploads/                 # File uploads
```

## 🎯 Domain-Driven Design Yapısı

Her domain aşağıdaki yapıyı takip eder:

```
domain/
├── application/
│   └── use-cases/          # İş mantığı servisleri
├── domain/
│   ├── entities/           # Domain varlıkları
│   └── value-objects/      # Değer nesneleri
├── presentation/
│   └── routes/             # HTTP endpoints
└── index.ts               # Domain exports
```

### Domain'ler

#### 1. **Catalog Domain** 🏪
- **Sorumluluk**: Ürün katalog yönetimi
- **Ana Bileşenler**:
  - Product listing and filtering
  - Category management
  - Search functionality

#### 2. **Content Domain** 📄
- **Sorumluluk**: İçerik yönetimi ve misafir işlemleri
- **Ana Bileşenler**:
  - FAQ content management
  - Terms & conditions
  - Guest cart operations

#### 3. **Identity Domain** 🔐
- **Sorumluluk**: Kimlik doğrulama ve yetkilendirme
- **Ana Bileşenler**:
  - JWT authentication
  - OTP verification (Twilio)
  - Token blacklisting

#### 4. **Order Domain** 📦
- **Sorumluluk**: Sipariş yaşam döngüsü
- **Ana Bileşenler**:
  - Order creation and validation
  - Invoice generation (PDF)
  - Order tracking
  - Stock management with Redis

#### 5. **Payment Domain** 💳
- **Sorumluluk**: Ödeme işlemleri
- **Ana Bileşenler**:
  - Stripe integration
  - Webhook handling with idempotency
  - Payment status tracking

#### 6. **Shopping Domain** 🛒
- **Sorumluluk**: Alışveriş deneyimi
- **Ana Bileşenler**:
  - Cart management
  - Favorites system
  - Cart calculations

#### 7. **User Domain** 👤
- **Sorumluluk**: Kullanıcı profili yönetimi
- **Ana Bileşenler**:
  - Profile management
  - Address management
  - Profile photo upload

## 🔧 Shared Infrastructure

### Application Layer
- **Guards**: Authentication middleware
- **Middleware**: Request correlation, logging
- **Common Routes**: Health checks, utilities

### Infrastructure Layer

#### Database (`infrastructure/database/`)
- **Connection**: PostgreSQL bağlantı yönetimi
- **Schema**: Drizzle ORM schema definitions
- **Migration**: Database migration scripts
- **Seed**: Initial data seeding

#### Cache (`infrastructure/cache/`)
- **Redis Stock Service**: Distributed locking ve atomic operations
- **Session Management**: JWT token blacklisting
- **Performance Optimization**: High-speed data access

#### External Services (`infrastructure/external/`)
- **Stripe Service**: Payment processing
- **NIP Service**: Polish company validation
- **Twilio Service**: SMS/OTP functionality

#### Monitoring (`infrastructure/monitoring/`)
- **Sentry**: Error tracking ve performance monitoring
- **Pino Logger**: Structured logging
- **Winston**: Advanced logging capabilities

## 🚀 Elysia Framework Integration

```typescript
// Ana uygulama yapısı
export const app = new Elysia()
  .use(logger())
  .use(swagger())
  .decorate("db", db)
  .use(healthRoutes)
  .use(stripeWebhookRoutes)
  .group("/api", (app) => 
    app
      .use(authRoutes)
      .group("/users", (userApp) => 
        userApp
          .use(profileRoutes)
          .use(addressRoutes)
      )
      .use(cartRoutes)
      .use(productRoutes)
      .use(ordersRoutes)
  )
```

## 📊 Performance & Scalability

### Redis-Based Stock Management
- **Distributed Locking**: Race condition prevention
- **Atomic Operations**: Consistent stock updates
- **Fallback Strategy**: Database backup for reliability

### Database Performance
- **20+ Critical Indexes**: Optimized query performance
- **Composite Indexes**: Complex e-commerce queries
- **Connection Pooling**: Efficient resource utilization

### Caching Strategy
- **Multi-layer Caching**: Redis + Application cache
- **Smart Invalidation**: Cache consistency maintenance
- **Performance Monitoring**: Real-time metrics

## 🔒 Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Token Blacklisting**: Secure logout
- **Role-based Access**: Permission management

### Input Validation
- **Multi-layer Validation**: Client + Server validation
- **File Upload Security**: MIME type + magic number validation
- **SQL Injection Prevention**: Parameterized queries

### Environment Security
- **Configuration Validation**: Environment-specific settings
- **Secret Management**: Secure credential storage
- **Production Controls**: Environment-based feature flags

## 🧪 Testing Strategy

### Test Architecture
- **Unit Tests**: Domain logic testing
- **Integration Tests**: API endpoint testing
- **Race Condition Tests**: Concurrent operation validation
- **System Tests**: End-to-end workflow testing

### Test Coverage
- **39 Comprehensive Tests**: Full system coverage
- **Redis Operations**: Distributed locking validation
- **Webhook Processing**: Stripe integration testing
- **Performance Testing**: Load and stress testing

## 📈 Monitoring & Observability

### Error Tracking
- **Sentry Integration**: Real-time error monitoring
- **Structured Logging**: Searchable log entries
- **Error Correlation**: Request tracing

### Performance Monitoring
- **Response Time Tracking**: API performance metrics
- **Resource Utilization**: Memory and CPU monitoring
- **Database Performance**: Query optimization insights

### Health Checks
- **Service Health**: Component status monitoring
- **Database Health**: Connection and query health
- **Cache Health**: Redis connectivity and performance

## 🔄 Data Flow Architecture

1. **Request Reception**: HTTP request alır
2. **Authentication**: JWT token doğrulama
3. **Authorization**: Yetki kontrolü
4. **Validation**: Input validation
5. **Business Logic**: Domain service execution
6. **Data Access**: Database/Cache operations
7. **Response**: JSON response döndürme
8. **Logging**: Request/response logging
9. **Monitoring**: Performance metrics collection

## 🌐 API Design Principles

### RESTful Design
- **Resource-based URLs**: `/api/users/123/addresses`
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: Appropriate HTTP response codes
- **Content Negotiation**: JSON API

### Error Handling
- **Consistent Error Format**: Standardized error responses
- **Error Correlation**: Unique error IDs
- **Logging Integration**: Comprehensive error logging
- **User-friendly Messages**: Clear error descriptions

### Documentation
- **OpenAPI/Swagger**: Interactive API documentation
- **Request/Response Examples**: Clear usage examples
- **Authentication Guide**: Security implementation details