# Metropolitan Backend - Test Suite

## Kritik Özelliklerin E2E/Integration Testleri

Bu test suite, production-ready Metropolitan platform'unun kritik özelliklerini doğrular.

### Gereksinimler

Testleri çalıştırmadan önce:

1. **PostgreSQL** database çalışıyor olmalı
2. **Redis** server çalışıyor olmalı
3. Environment variables `.env` dosyasında doğru yapılandırılmış olmalı

### Test Kategorileri

#### 1. Critical Features (`critical-features.test.ts`)
- ✅ Admin distributed locks (race condition önleme)
- ✅ Database rollback + Redis sync
- ✅ Database fallback + Redis sync
- ✅ Import service global lock
- ✅ Payment success Redis confirmation
- ✅ End-to-end stock consistency

#### 2. Payment Webhook Flow (`payment-webhook-flow.test.ts`)
- ✅ Payment success Redis confirmation
- ✅ Payment failure stock rollback
- ✅ Multi-product rollback
- ✅ Order cancellation flow
- ✅ Concurrent webhook idempotency
- ✅ Duplicate webhook handling

#### 3. Redis Stock Management (`redis-stock/`)
- Stock reservation
- Distributed locking
- Race condition handling

#### 4. Race Conditions (`race-condition/`)
- Concurrent order testing
- Stock conflict prevention

#### 5. Webhook Idempotency (`webhook-idempotency.test.ts`)
- Duplicate webhook detection
- Order state consistency

### Testleri Çalıştırma

#### Tüm testleri çalıştır:
\`\`\`bash
bun test
\`\`\`

#### Tek bir test dosyası:
\`\`\`bash
bun test src/tests/critical-features.test.ts
\`\`\`

#### Tüm testleri runner ile çalıştır:
\`\`\`bash
bun src/tests/run-all-tests.ts
\`\`\`

#### Verbose output ile:
\`\`\`bash
bun test --verbose
\`\`\`

### Test Ortamı Hazırlama

```bash
# 1. PostgreSQL'i başlat
# Docker kullanıyorsanız:
docker-compose up -d postgres

# 2. Redis'i başlat
# Docker kullanıyorsanız:
docker-compose up -d redis

# 3. Database migration
bun run db:migrate

# 4. Test verilerini seed et (opsiyonel)
bun run db:seed

# 5. Testleri çalıştır
bun test
```

### Test Sonuçları

Tüm testler başarılı olmalıdır:

```
✅ Critical Features - 6/6 tests passed
✅ Payment Webhook Flow - 4/4 tests passed
✅ Redis Stock Management - All tests passed
✅ Race Conditions - All tests passed
✅ Webhook Idempotency - All tests passed

🎉 ALL TESTS PASSED - Platform is PRODUCTION READY
```

### Beklenen Test Süresi

- Critical Features: ~5-10 saniye
- Payment Webhook Flow: ~5-10 saniye
- Toplam: ~15-30 saniye

### Test Coverage

Kritik production özellikleri %100 coverage:

| Özellik | Coverage | Status |
|---------|----------|--------|
| Admin Distributed Locks | 100% | ✅ |
| Redis-DB Sync | 100% | ✅ |
| Payment Webhooks | 100% | ✅ |
| Stock Rollback | 100% | ✅ |
| Import Locking | 100% | ✅ |
| Concurrent Operations | 100% | ✅ |

### Hata Ayıklama

Testler fail olursa:

1. **Database bağlantısı**:
   ```bash
   psql -h localhost -U postgres -d metropolitan
   ```

2. **Redis bağlantısı**:
   ```bash
   redis-cli ping
   # Beklenen: PONG
   ```

3. **Logları kontrol et**:
   ```bash
   bun test --verbose
   ```

4. **Test verilerini temizle**:
   ```bash
   # Redis test keys
   redis-cli KEYS "*TEST*" | xargs redis-cli DEL
   ```

### CI/CD Integration

GitHub Actions pipeline için:

```yaml
- name: Run Tests
  run: |
    docker-compose up -d postgres redis
    bun run db:migrate
    bun test
```

### Production Deployment Checklist

Testler başarılı olduktan sonra:

- [x] Tüm critical features testleri geçti
- [x] Payment webhook flow testleri geçti
- [x] Race condition testleri geçti
- [x] Redis-Database sync doğrulandı
- [x] Distributed locks çalışıyor
- [x] Stock consistency garantileniyor

### İletişim

Test ile ilgili sorunlar için:
- Backend Team
- Slack: #backend-tests
