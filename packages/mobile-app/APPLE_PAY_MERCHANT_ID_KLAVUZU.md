# 🍎 APPLE PAY MERCHANT ID KLAVUZU

**Bundle ID:** `com.metropolitan.food`
**Mevcut Merchant ID:** `merchant.com.metropolitan.food`
**Status:** 🟡 **KAYDETME GEREKİYOR** - Apple Developer Console'da oluşturulmalı

---

## 🎯 **MERCHANT ID NEDİR?**

Merchant ID, Apple Pay ile ödeme alabilmek için Apple Developer Console'da **manuel olarak oluşturulması gereken** unique identifier'dır.

### 📝 **Naming Convention:**
```
merchant.com.{APP_NAME}
merchant.com.{BUNDLE_IDENTIFIER}
```

**Örnek:**
- Bundle ID: `com.metropolitan.food`
- Merchant ID: `merchant.com.metropolitan.food` ✅

---

## 🔧 **MERCHANT ID OLUŞTURMA SÜRECİ**

### 1️⃣ **Apple Developer Console'a Git**
- https://developer.apple.com/account/
- **Certificates, Identifiers & Profiles** → **Identifiers**

### 2️⃣ **Yeni Merchant ID Oluştur**
```
1. Click "+" button
2. Select "Merchant IDs"
3. Description: "Metropolitan Food App"
4. Identifier: "merchant.com.metropolitan.food"
5. Continue & Register
```

### 3️⃣ **Stripe ile Entegrasyon**
```
1. Stripe Dashboard → Apple Pay
2. Download CSR (Certificate Signing Request)
3. Apple Developer Console → Merchant ID → "Create Certificate"
4. Upload CSR file
5. Download certificate
6. Upload certificate to Stripe
```

### 4️⃣ **iOS App'e Merchant ID Ekle**
```
1. Apple Developer Console → App ID
2. Select: com.metropolitan.food
3. Enable: Apple Pay Payment Processing
4. Configure: Select merchant.com.metropolitan.food
5. Save
```

---

## 📋 **MEVCUT KONFİGÜRASYON ANALİZİ**

### ✅ **Doğru Olanlar:**
```typescript
// config/stripe.ts
merchantIdentifier: "merchant.com.metropolitan.food" // ✅ Naming doğru
urlScheme: "metropolitan" // ✅ app.json'dan alıyor
```

### ⚠️ **Eksik Olanlar:**
- **Apple Developer Console'da merchant ID kayıtlı değil**
- **Stripe Dashboard'da certificate setup yok**
- **App ID'de Apple Pay capability enabled değil**

---

## 🚨 **APP STORE ÖNCESİ YAPILMASI GEREKENLER**

### 🔴 **URGENT - Apple Developer Setup:**

1. **Merchant ID Oluştur:**
```
Identifier: merchant.com.metropolitan.food
Description: Metropolitan Food App - Apple Pay
```

2. **App ID'yi Güncelle:**
```
Bundle ID: com.metropolitan.food
Capabilities: Enable Apple Pay
Merchant IDs: Select merchant.com.metropolitan.food
```

3. **Stripe Entegrasyonu:**
```
- Download CSR from Stripe
- Create certificate in Apple Developer
- Upload certificate to Stripe
- Test Apple Pay integration
```

### 🟡 **MEDIUM - Code Updates:**

4. **Entitlements Dosyasını Güncelle:**
```xml
<!-- ios/metropolitan/metropolitan.entitlements -->
<key>com.apple.developer.in-app-payments</key>
<array>
    <string>merchant.com.metropolitan.food</string>
</array>
```

5. **Test Apple Pay:**
```typescript
// Test environment'da Apple Pay çalışıyor mu?
// Simulator'de Apple Pay test kartları ekli mi?
```

---

## 🔍 **DOĞRULAMA CHECKLİSTİ**

### Apple Developer Console:
- [ ] Merchant ID `merchant.com.metropolitan.food` oluşturuldu
- [ ] App ID `com.metropolitan.food` Apple Pay enabled
- [ ] Certificate created and downloaded
- [ ] Provisioning profiles updated

### Stripe Dashboard:
- [ ] Apple Pay enabled
- [ ] CSR downloaded
- [ ] Certificate uploaded
- [ ] Test mode verified

### iOS App:
- [ ] Entitlements file updated
- [ ] Info.plist contains merchant ID
- [ ] Apple Pay test completed
- [ ] Production build tested

---

## 🎯 **TİMELINE**

| Adım | Süre | Dependency |
|------|------|------------|
| 1. Apple Developer setup | 30 min | Developer account |
| 2. Stripe integration | 15 min | Merchant ID created |
| 3. Certificate exchange | 20 min | Both platforms ready |
| 4. iOS app update | 10 min | Certificates ready |
| 5. Testing | 30 min | Everything configured |

**Total: ~2 hours**

---

## ⚠️ **UYARILAR**

### 🚫 **Yaygın Hatalar:**
1. **Merchant ID'yi oluşturmadan app submit etmek** → Rejection
2. **Bundle ID ile merchant ID'nin uyumsuz olması** → Apple Pay çalışmaz
3. **Certificate exchange'i tamamlamamak** → Stripe integration fails
4. **Test environment'da test etmemek** → Production'da sürpriz

### 💡 **Pro Tips:**
- Merchant ID oluşturulduktan sonra değiştirilemez
- Certificate'lar expire olur, yenilenmesi gerekir
- Test kartları Simulator'de farklı çalışır
- Production'da gerçek kart gerekli

---

## 🔄 **MEVCUT DURUM**

**Code:** 🟢 Ready (merchant ID doğru format)
**Apple Developer:** 🔴 **KAYIT GEREKİYOR**
**Stripe:** 🔴 **SETUP GEREKİYOR**
**Testing:** 🔴 **PENDING**

---

## 📞 **ACİL AKSİYON**

1. **Apple Developer account'a erişim sağla**
2. **Merchant ID'yi kaydet: `merchant.com.metropolitan.food`**
3. **Stripe dashboard'a erişim sağla**
4. **Certificate exchange'i tamamla**
5. **Test environment'da doğrula**

**Bu adımlar tamamlanmadan Apple Pay çalışmaz ve App Store submission fail eder!**

---

*Last updated: 22 Eylül 2025*
*Status: 🟡 Code ready, infrastructure setup needed*