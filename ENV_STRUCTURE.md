# .env Dosya Yapısı (Temizlenmiş)

## 📁 Yerel Ortam (2 Dosya)

### 1. Backend .env
**Konum:** `/packages/backend/.env`
- **Veritabanı:** Yerel PostgreSQL (localhost:5432)
- **Redis:** Yerel Redis (localhost:6379)
- **API URL:** Yerel IP üzerinden (http://172.20.10.9:3000)
- **NODE_ENV:** development
- **Stripe:** Test anahtarları

### 2. Mobile .env
**Konum:** `/packages/mobile-app/.env`
- **API URL:** Yerel backend IP'si (http://172.20.10.9:3000)
- **Stripe:** Backend'den dinamik olarak alınıyor (/payment/config endpoint)

## 📁 Sunucu Ortam (2 Dosya)

### 1. Backend .env (Production)
**Konum:** `/opt/metropolitan.env`
- **Veritabanı:** Docker PostgreSQL (postgres:5432)
- **Redis:** Docker Redis (redis:6379)
- **API URL:** Production domain (https://api.metropolitanfg.pl)
- **NODE_ENV:** development (Apple Review için geçici)
- **Stripe:** Hem test hem live anahtarları

### 2. Docker-compose.yml
**Konum:** `/opt/metropolitan/docker-compose.yml`
- Docker servisleri için ortam değişkenleri
- Backend, PostgreSQL ve Redis konfigürasyonu

## 🔄 Deployment Süreci

### Yerel Geliştirme
```bash
# Backend başlatma
cd packages/backend
bun --hot index.ts

# Mobile app başlatma
cd packages/mobile-app
bun start
```

### Production Deployment
```bash
# SSH ile sunucuya bağlanma
ssh metropolitan-deploy

# Deploy script çalıştırma
/opt/deploy.sh
```

## ⚙️ Önemli Notlar

1. **Yerel Ortam:**
   - Backend ve Mobile app ayrı .env dosyaları kullanıyor
   - Mobile app yerel IP üzerinden backend'e bağlanıyor
   - Test Stripe anahtarları kullanılıyor

2. **Sunucu Ortam:**
   - Tek bir .env dosyası tüm servisler için (`/opt/metropolitan.env`)
   - Docker-compose bu .env dosyasını kullanıyor
   - Apple Review için geçici olarak NODE_ENV=development

3. **Temizlenen Dosyalar:**
   - .env.development ❌ (Silindi)
   - .env.production ❌ (Silindi)
   - .env.local ❌ (Silindi)
   - .env.example ❌ (Silindi)

## 🚀 Hızlı Başlangıç

### Yerel Kurulum
1. Backend .env dosyasını kopyala ve düzenle
2. Mobile .env dosyasında yerel IP'yi güncelle
3. Docker ile PostgreSQL ve Redis başlat
4. Backend ve Mobile app'i çalıştır

### Production Kurulum
1. Sunucuda `/opt/metropolitan.env` dosyasını düzenle
2. Deploy script ile güncellemeyi yayınla
3. Docker-compose ile servisleri yeniden başlat