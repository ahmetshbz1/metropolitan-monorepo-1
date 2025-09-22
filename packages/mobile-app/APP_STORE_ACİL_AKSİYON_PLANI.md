# 🚨 APP STORE ACİL AKSİYON PLANI - METROPOLITAN MOBILE APP

**Analiz Tarihi:** 22 Eylül 2025
**Mevcut Durum:** 🔴 **KRİTİK - App Store'a submit edilmemelidir**
**Tahmini Süre:** 7-10 iş günü

---

## 📊 GENEL ÖZET

**✅ HAZIR OLANLAR:**
- ✅ Modern tech stack (Expo 53, React Native 0.79)
- ✅ PrivacyInfo.xcprivacy dosyası mevcut
- ✅ Çoklu dil desteği (TR, EN, PL)
- ✅ App icon mevcut (1024x1024)
- ✅ Development team konfigürasyonu (64XKK46655)
- ✅ Bundle identifier tutarlı (com.metropolitan.food)

**🔴 KRİTİK SORUNLAR:**
- 🚨 Entitlements dosyası tamamen boş
- 🚨 Production environment yok
- 🚨 Stripe test keys production'da kullanılacak
- 🚨 Development IP adresi sabit kodlanmış
- 🚨 Privacy policy/terms dummy content
- 🚨 Apple Pay merchant ID tutarsız

---

## 🎯 ACİL AKSİYON PLANI

### 🔥 **PHASE 1: KRİTİK DÜZELTMELER (1-2 gün)**

#### 1. ⚡ **Entitlements Dosyasını Düzelt**
**Dosya:** `ios/metropolitan/metropolitan.entitlements`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.in-app-payments</key>
    <array>
        <string>merchant.com.metropolitan.food</string>
    </array>
</dict>
</plist>
```

#### 2. ⚡ **Production Environment Kurulumu**
**Dosya:** `.env.production`

```bash
# Production Environment
EXPO_PUBLIC_API_BASE_URL=https://api.metropolitan.app
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXX
```

**Dosya:** `config/stripe.ts` - Production fallback'i kaldır

#### 3. ⚡ **Development URL'lerini Temizle**
- `.env` dosyasını .gitignore'a ekle
- Tüm hardcoded IP adreslerini environment variable'a çevir

#### 4. ⚡ **Merchant ID Tutarlılığı**
**config/stripe.ts:**
```typescript
merchantIdentifier: "merchant.com.metropolitan.food"
```

### 🔧 **PHASE 2: LEGAL DOKÜMANLARI (2-3 gün)**

#### 5. 📄 **Privacy Policy Oluştur**
**Gerekli Bölümler:**
- Toplanan veriler (phone, address, payment info)
- Stripe, Twilio, Fakturownia entegrasyonları
- Veri saklama süreleri
- KVKK/GDPR uyumluluğu
- İletişim bilgileri

#### 6. 📄 **Terms of Service Oluştur**
**Gerekli Bölümler:**
- Hizmet kullanım koşulları
- Ödeme/iade politikaları
- Sorumluluk reddi
- Yasal yükümlülükler

#### 7. 🔗 **Legal Link'leri Entegre Et**
- App içinde Privacy Policy/Terms linki
- App Store listing'de gerekli URL'ler

### 🎨 **PHASE 3: APP STORE METADATA (2-3 gün)**

#### 8. 📱 **App Store Screenshots**
**Gerekli Boyutlar:**
- iPhone 6.7" (1290 x 2796)
- iPhone 6.5" (1242 x 2688)
- iPhone 5.5" (1242 x 2208)
- iPad Pro 12.9" (2048 x 2732)

**Screenshots İçeriği:**
- Ana sayfa (product listing)
- Ürün detay sayfası
- Sepet/checkout flow
- Profil sayfası
- Çoklu dil desteği gösterimi

#### 9. 📝 **App Store Açıklaması**
**Türkçe (ana dil):**
```
Metropolitan - Kaliteli Gıda Ürünleri

🥘 Taze ve kaliteli gıda ürünlerini kapınıza kadar getiriyoruz
📱 Kolay sipariş verme deneyimi
💳 Güvenli ödeme (Stripe entegrasyonu)
🌍 Türkiye, İngiltere ve Polonya'da hizmet
📧 Otomatik fatura sistemi
🔄 Sipariş takibi
```

#### 10. 🏷️ **Keywords ve Kategoriler**
**Kategori:** Food & Drink
**Keywords:** gıda, yemek, online market, grocery, delivery

### 🔒 **PHASE 4: GÜVENLİK & PRODUCTION (1-2 gün)**

#### 11. 🛡️ **Production Build Konfigürasyonu**
- Test kodlarını temizle
- Debug mode'u kapat
- Production API endpoint'lerini doğrula
- Error logging'i production'a yönlendir

#### 12. 🔑 **Apple Developer Account Hazırlığı**
- Bundle ID'yi Apple Developer'da kaydet
- Merchant ID'yi Apple Pay'de oluştur
- Production certificates'leri oluştur
- Provisioning profiles'ları hazırla

#### 13. 🏪 **Stripe Production Setup**
- Production keys'leri al
- Webhook endpoint'lerini production'a yönlendir
- Payment methods'ları test et
- Apple Pay'i production'da aktifleştir

---

## 🚧 **BLOKE EDİCİ SORUNLAR**

### ❌ **Hemen Düzeltilmesi Gerekenler:**

1. **Entitlements Boş:** Apple Pay çalışmaz
2. **Production Environment Yok:** Development server'a bağlanır
3. **Test Stripe Keys:** Gerçek ödemeler alınamaz
4. **Dummy Legal Content:** App Store reddeder
5. **Development IP:** App çalışmaz

---

## ⏰ **TİMELINE**

| Gün | Görevler | Sorumlu |
|-----|----------|---------|
| 1 | Entitlements + Production ENV | Developer |
| 2 | Stripe Production + URL cleanup | Developer |
| 3-4 | Privacy Policy + Terms yazımı | Legal/Content |
| 5-6 | App Store screenshots + metadata | Design/Marketing |
| 7-8 | Production build + test | Developer |
| 9-10 | Final review + submit | Team |

---

## 🎯 **ÖNCELİK SIRASI**

### 🔴 **URGENT (0-2 gün):**
1. Entitlements dosyası
2. Production environment
3. Development URL cleanup
4. Stripe merchant ID fix

### 🟡 **HIGH (3-5 gün):**
1. Privacy policy
2. Terms of service
3. App Store screenshots
4. Metadata hazırlığı

### 🟢 **MEDIUM (6-10 gün):**
1. Production build optimization
2. Final testing
3. Apple Developer account setup
4. Submit to App Store

---

## 📋 **CHECKLIST - SUBMIT ÖNCESİ**

- [ ] Entitlements dosyası dolu ve doğru
- [ ] Production environment variables set
- [ ] Tüm test kodları temizlendi
- [ ] Privacy policy/terms real content
- [ ] App Store screenshots hazır
- [ ] Metadata tamamlandı (TR, EN, PL)
- [ ] Stripe production keys aktif
- [ ] Apple Pay test edildi
- [ ] Build production'da çalışıyor
- [ ] Legal dokümanlar accessible

---

## 🚨 **UYARI**

**Bu aksiyon planı takip edilmeden App Store'a submit yapmayın!**

Mevcut durumda app:
- ❌ Çalışmayacak (development IP)
- ❌ Ödeme alamayacak (test keys)
- ❌ Apple Pay çalışmayacak (boş entitlements)
- ❌ Legal problemler (dummy content)
- ❌ App Store tarafından reddedilecek

**Minimum 7-10 iş günü gerekli!**

---

*Last updated: 22 Eylül 2025*
*Status: 🔴 Critical - DO NOT SUBMIT*