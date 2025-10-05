# 📱 Metropolitan Mobile App - Store Deployment Checklist

## 🚀 Deployment Durumu: %75 Hazır
**Tahmini Tamamlanma Süresi:** 7-10 iş günü

---

## ✅ TAMAMLANAN GÖREVLER

### Teknik Altyapı
- [x] Expo SDK 53.0.20 kurulumu
- [x] React Native 0.79.5 güncellemesi
- [x] TypeScript konfigürasyonu
- [x] Build scriptleri (package.json)
- [x] Bağımsız paket yapısı

### Platform Konfigürasyonları
- [x] iOS Bundle Identifier: `com.metropolitan.food`
- [x] Android Package Name: `com.metropolitan.food`
- [x] Apple Team ID: `64XKK46655`
- [x] Version: 1.0.2, Build: 3

### Uygulama Özellikleri
- [x] Çoklu dil desteği (TR, EN, PL)
- [x] Stripe ödeme entegrasyonu
- [x] Apple Pay konfigürasyonu
- [x] Push notification altyapısı
- [x] Deep linking yapısı

### Güvenlik
- [x] JWT token yönetimi
- [x] Secure storage implementasyonu
- [x] SSL pinning hazırlığı
- [x] Privacy manifest (iOS)

---

## ❌ EKSİK GÖREVLER

### 1️⃣ EAS Build Konfigürasyonu (Öncelik: KRİTİK)

**Görev:** `eas.json` dosyası oluştur
```json
{
  "cli": {
    "version": ">= 7.8.0"
  },
  "build": {
    "development": {
      "channel": "development",
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "channel": "preview",
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "channel": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "[APPLE_ID_EMAIL]",
        "ascAppId": "[APP_STORE_CONNECT_ID]",
        "appleTeamId": "64XKK46655"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "internal"
      }
    }
  }
}
```

### 2️⃣ Splash Screen & App Icons (Öncelik: YÜKSEK)

**Gerekli Dosyalar:**
- [ ] `assets/images/splash.png` (2732x2732 px)
- [ ] `assets/images/adaptive-icon.png` (1024x1024 px)

**app.json Güncellemesi:**
```json
{
  "splash": {
    "image": "./assets/images/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#ffffff"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/images/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    }
  }
}
```

### 3️⃣ Production Environment Variables (Öncelik: KRİTİK)

**.env.production dosyası:**
```bash
# Production API
EXPO_PUBLIC_API_BASE_URL=https://api.metropolitan.app

# Stripe Production Keys
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=[GERÇEK_PRODUCTION_KEY]

# Sentry DSN (opsiyonel)
EXPO_PUBLIC_SENTRY_DSN=[SENTRY_PROJECT_DSN]
```

### 4️⃣ App Store Assets

**iOS Screenshots (Her biri için 5-10 adet):**
- [ ] iPhone 6.7" - 1290 x 2796 px
- [ ] iPhone 6.5" - 1242 x 2688 px
- [ ] iPhone 5.5" - 1242 x 2208 px
- [ ] iPad Pro 12.9" - 2048 x 2732 px

**Android Screenshots:**
- [ ] Phone - 1080 x 1920 px
- [ ] 7" Tablet - 1200 x 1920 px
- [ ] 10" Tablet - 1920 x 1200 px

### 5️⃣ Store Metadata

**App Store Connect:**
- [ ] Uygulama açıklaması (TR, EN, PL)
- [ ] Keywords (100 karakter)
- [ ] Kategori: Food & Drink
- [ ] Support URL
- [ ] Marketing URL
- [ ] Privacy Policy URL

**Google Play Console:**
- [ ] Kısa açıklama (80 karakter)
- [ ] Uzun açıklama (4000 karakter)
- [ ] Kategori: Shopping
- [ ] Content rating anketi
- [ ] Target audience

### 6️⃣ Legal & Compliance

- [ ] Kullanım Koşulları sayfası
- [ ] Gizlilik Politikası sayfası
- [ ] KVKK metni
- [ ] GDPR uyumluluğu
- [ ] App Store Review Guidelines kontrolü

---

## 📋 DEPLOYMENT ADIMLARI

### Adım 1: EAS Setup (30 dakika)
```bash
# EAS CLI kurulumu
npm install -g eas-cli

# Giriş yap
eas login

# Proje konfigürasyonu
cd packages/mobile-app
eas build:configure

# Credentials setup
eas credentials
```

### Adım 2: İlk Test Build (1-2 saat)
```bash
# iOS preview build
eas build --platform ios --profile preview

# Android APK
eas build --platform android --profile preview

# Build durumunu kontrol et
eas build:list
```

### Adım 3: Production Build (2-3 saat)
```bash
# Version bump
npm version patch

# Production builds
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Adım 4: Store Submission
```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

---

## 🧪 TEST KONTROL LİSTESİ

### Fonksiyonel Testler
- [ ] Kullanıcı kaydı ve girişi
- [ ] OTP doğrulama
- [ ] Ürün listeleme ve arama
- [ ] Sepet işlemleri
- [ ] Ödeme akışı (Stripe)
- [ ] Sipariş takibi
- [ ] Bildirimler
- [ ] Çoklu dil değişimi

### Performans Testleri
- [ ] Uygulama başlangıç süresi < 3 saniye
- [ ] Liste scroll performansı
- [ ] Görsel yükleme süreleri
- [ ] Memory leak kontrolü

### Cihaz Testleri
- [ ] iPhone 12 ve üzeri
- [ ] iPhone SE (küçük ekran)
- [ ] iPad compatibility
- [ ] Android 10+
- [ ] Farklı ekran boyutları

---

## 📅 TAHMİNİ ZAMAN ÇİZELGESİ

### Hafta 1 (Gün 1-3)
- ✅ EAS konfigürasyonu
- ✅ Splash screen & icon tasarımı
- ✅ Production environment setup

### Hafta 1-2 (Gün 4-6)
- ⏳ Screenshot hazırlığı
- ⏳ Store metadata yazımı
- ⏳ Legal dokümanlar

### Hafta 2 (Gün 7-10)
- ⏳ Production build & test
- ⏳ Store submission
- ⏳ Review süreçleri

---

## 🚨 KRİTİK NOTLAR

1. **Stripe Production Keys**: Gerçek production key'leri almadan deployment yapmayın
2. **Backend URL**: Production API endpoint'inin hazır olduğundan emin olun
3. **Apple Developer Account**: Ücretli hesap gerekli ($99/yıl)
4. **Google Play Console**: Hesap açılışı ve $25 ödeme
5. **Privacy Policy**: Apple zorunlu tutuyor, hazır olmalı

---

## 📞 İLETİŞİM & DESTEK

**Proje Sahibi:** Metropolitan Food Group
**Developer:** Ahmet
**Son Güncelleme:** 25 Eylül 2025

---

## ✅ DEPLOYMENT ÖNCESİ SON KONTROL

- [ ] Tüm placeholder değerler gerçek değerlerle değiştirildi
- [ ] Debug mode kapatıldı
- [ ] Console.log'lar temizlendi
- [ ] Test kullanıcıları kaldırıldı
- [ ] Analytics entegrasyonu yapıldı
- [ ] Crash reporting aktif
- [ ] Performance monitoring kuruldu
- [ ] Legal URL'ler erişilebilir
- [ ] Support email hazır
- [ ] App Store/Play Store hesapları hazır

**NOT:** Bu checklist'i tamamladıktan sonra uygulamanız store'lara gönderime hazır olacaktır. Apple review süreci 1-7 gün, Google Play review süreci 2-24 saat sürebilir.
