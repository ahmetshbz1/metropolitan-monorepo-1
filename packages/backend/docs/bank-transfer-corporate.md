# Banka Havalesi - Kurumsal Müşteri Özelliği

## Özet

Kurumsal müşteriler için banka havalesi ödeme yöntemiyle sipariş verildiğinde otomatik onay ve Fakturownia entegrasyonu.

## Özellikler

### 🏢 Kurumsal Müşteri Otomatik Onay

- Kurumsal müşteriler banka havalesi seçtiğinde sipariş otomatik olarak onaylanır
- Sipariş durumu: `confirmed` (onaylandı)
- Ödeme durumu: `pending` (ödeme bekliyor)
- Stok rezervasyonu ve sepet temizleme işlemleri hemen yapılır

### 📄 Fakturownia Entegrasyonu

- Banka havalesi için özel etiket: `"Płatność: Przelew"`
- Fatura otomatik olarak oluşturulur ve e-posta ile gönderilir
- Payment method mapping: `bank_transfer` → `transfer`

## Teknik Detaylar

### Backend Değişiklikleri

#### 1. Order Creation Service

```typescript
// packages/backend/src/domains/order/application/use-cases/order-creation.service.ts

// Kurumsal müşteri kontrolü
const isBankTransfer = request.paymentMethodId === "bank_transfer";
const [user] = await tx.select({ userType: users.userType }).from(users)...

// Otomatik onay
if (isBankTransfer && user.userType === "corporate") {
  await tx.update(orders).set({
    status: "confirmed",
    paymentStatus: "pending"
  });
  // Fatura oluştur
  this.createInvoiceInBackground(order.id, userId);
}
```

#### 2. Fakturownia Adapter

```typescript
// packages/backend/src/domains/order/application/use-cases/fakturownia-adapter.service.ts

private static getPaymentLabel(paymentMethod: string): string {
  switch (paymentMethod.toLowerCase()) {
    case "bank_transfer":
      return "Płatność: Przelew";
    // ... diğer payment method'lar
  }
}
```

#### 3. Shared Types

```typescript
// packages/shared/types/order.ts

export interface OrderCreationRequest {
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethodId: string; // ✅ Eklendi
  notes?: string;
}
```

### Mobile App Değişiklikleri

#### 1. Checkout Summary Hook

```typescript
// packages/mobile-app/hooks/useCheckoutSummary.ts

// Kurumsal müşteri için özel mesaj
Alert.alert(
  t("checkout.bank_transfer_success"),
  t("checkout.bank_transfer_success_desc"),
  [
    {
      text: t("common.ok"),
      onPress: () => {
        /* navigation */
      },
    },
  ]
);
```

#### 2. Localization

```json
// packages/mobile-app/locales/tr.json
{
  "checkout": {
    "bank_transfer_success": "Sipariş Onaylandı",
    "bank_transfer_success_desc": "Kurumsal müşteri olarak siparişiniz otomatik olarak onaylandı. Fatura e-posta adresinize gönderilecek."
  }
}
```

## Test Senaryoları

### ✅ Başarılı Senaryolar

1. **Kurumsal müşteri banka havalesi seçer**
   - Sipariş otomatik onaylanır
   - Fatura oluşturulur
   - Kullanıcıya başarı mesajı gösterilir

2. **Bireysel müşteri banka havalesi seçer**
   - Banka havalesi seçeneği görünmez (zaten mevcut kısıtlama)

3. **Farklı ödeme yöntemleri**
   - Kart, BLIK, Apple Pay normal Stripe flow'u kullanır

### ❌ Hata Senaryoları

1. **Stok yetersiz**
   - Sipariş oluşturulmaz
   - Kullanıcıya hata mesajı gösterilir

2. **Fatura oluşturma hatası**
   - Sipariş etkilenmez
   - Hata loglanır

## API Endpoints

### POST /api/orders

```json
{
  "shippingAddressId": "uuid",
  "billingAddressId": "uuid",
  "paymentMethodId": "bank_transfer",
  "notes": "Kurumsal sipariş"
}
```

**Kurumsal müşteri yanıtı:**

```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "orderNumber": "ORD-2025-001",
    "status": "confirmed",
    "paymentStatus": "pending",
    "totalAmount": "129.99",
    "currency": "PLN"
  }
}
```

## Monitoring ve Logging

### Backend Logları

```
🏢 Kurumsal müşteri banka havalesi - otomatik onay
📄 Generating invoice for order uuid...
✅ Invoice generated successfully for order uuid
```

### Fakturownia Logları

```
📝 Creating Fakturownia invoice for: Şirket Adı
✅ Fakturownia faturası oluşturuldu: { id: 123, number: "FAT-2025-001" }
```

## Güvenlik

- Sadece kurumsal müşteriler (`userType === "corporate"`) bu özelliği kullanabilir
- Payment method validation mevcut
- Stok kontrolü ve rezervasyonu korunur

## Gelecek Geliştirmeler

1. **Ödeme Takibi**: Banka havalesi ödemelerinin manuel onayı
2. **Otomatik Bildirim**: Ödeme alındığında otomatik e-posta
3. **Dashboard**: Kurumsal müşteriler için özel dashboard
4. **Toplu Sipariş**: Kurumsal müşteriler için toplu sipariş özelliği

---

**Oluşturulma Tarihi**: 16 Temmuz 2025
**Geliştirici**: Ahmet
**Versiyon**: 1.0.0
