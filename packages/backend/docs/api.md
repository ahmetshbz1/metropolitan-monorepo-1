# API Dokümantasyonu

## 🌐 Genel Bakış

Metropolitan Backend API, **RESTful** prensipleri takip eden, **JSON** formatında veri alışverişi yapan ve **OpenAPI 3.0** standardında dokümante edilmiş bir API servisidir. Sistem **OTP tabanlı kimlik doğrulama** kullanır.

## 🔗 Base URL

```
Development: http://localhost:3000
Production: https://api.metropolitan.com
```

## 🔐 Authentication

### OTP-Based Authentication

API kimlik doğrulaması **OTP (One-Time Password)** sistemi ile çalışır. Email/password sistemi yoktur.

### JWT Token Authentication

OTP doğrulaması sonrası JWT token alınır ve her istekte `Authorization` header'ında gönderilir.

```http
Authorization: Bearer <jwt_token>
```

### Token Lifecycle

- **Login Token**: 7 gün (profil tamamlanmış kullanıcılar için)
- **Registration Token**: 5 dakika (profil tamamlanmamış kullanıcılar için)
- **Blacklisting**: Logout işleminde token blacklist'e eklenir

## 📝 API Endpoints

### Authentication Domain 🔐

#### POST /api/auth/send-otp
OTP gönderme işlemi

**Request:**
```json
{
  "phoneNumber": "+48123456789",
  "userType": "individual"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Validation:**
- `phoneNumber`: E.164 formatında telefon numarası
- `userType`: "individual" veya "corporate"

#### POST /api/auth/verify-otp
OTP doğrulama işlemi

**Request:**
```json
{
  "phoneNumber": "+48123456789",
  "otpCode": "123456",
  "userType": "individual"
}
```

**Response (Profil Tamamlanmış):**
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Profil Tamamlanmamış):**
```json
{
  "success": true,
  "message": "OTP verified. Please complete your profile.",
  "registrationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/auth/migrate-guest-data
Misafir verilerini kullanıcı hesabına taşıma

**Request:**
```json
{
  "phoneNumber": "+48123456789",
  "guestId": "guest_uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Guest data migrated successfully",
  "migratedData": {
    "cartItems": 3,
    "favorites": 5
  }
}
```

#### POST /api/auth/logout
Çıkış işlemi (Token gereklidir)

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

### User Domain 👤

#### POST /api/complete-profile
Profil tamamlama (Registration token gereklidir)

**Headers:**
```http
Authorization: Bearer <registration_token>
```

**Request:**
```json
{
  "userType": "individual",
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "nip": "1234567890",
  "termsAccepted": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile completed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET /api/users/me
Kullanıcı profil bilgilerini getirir

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "individual",
    "phoneNumber": "+48123456789",
    "profilePhotoUrl": "http://localhost:3000/uploads/profile-photos/uuid.jpg"
  }
}
```

#### PUT /api/users/me
Kullanıcı profil güncelleme

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

#### POST /api/users/me/profile-photo
Profil fotoğrafı yükleme

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```http
Content-Type: multipart/form-data

photo: <file>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile photo updated successfully.",
  "data": {
    "photoUrl": "http://localhost:3000/uploads/profile-photos/uuid.jpg"
  }
}
```

**Validation:**
- Dosya tipi: JPEG, PNG, WebP
- Maksimum boyut: 2MB

---

### Catalog Domain 🏪

#### GET /api/products
Ürün listesi

**Query Parameters:**
- `lang`: Dil (tr, en, pl) - varsayılan: tr
- `category`: Kategori slug

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Ürün Adı",
      "image": "http://localhost:3000/images/product.jpg",
      "price": 29.99,
      "currency": "PLN",
      "stock": 100,
      "category": "sut-urunleri",
      "brand": "Yayla"
    }
  ]
}
```

#### GET /api/products/categories
Kategori listesi

**Query Parameters:**
- `lang`: Dil (tr, en, pl) - varsayılan: tr

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "sut-urunleri",
      "name": "SÜT ÜRÜNLERİ",
      "languageCode": "tr"
    },
    {
      "id": "uuid",
      "slug": "bakliyat",
      "name": "BAKLİYAT",
      "languageCode": "tr"
    },
    {
      "id": "uuid",
      "slug": "et-urunleri",
      "name": "ET ÜRÜNLERİ",
      "languageCode": "tr"
    },
    {
      "id": "uuid",
      "slug": "salca-ve-ezmeler",
      "name": "SALÇA VE EZMELER",
      "languageCode": "tr"
    },
    {
      "id": "uuid",
      "slug": "unlu-mamuller",
      "name": "UNLU MAMÜLLER",
      "languageCode": "tr"
    },
    {
      "id": "uuid",
      "slug": "zeytinler",
      "name": "ZEYTİNLER",
      "languageCode": "tr"
    },
    {
      "id": "uuid",
      "slug": "diger-urunler",
      "name": "DİĞER ÜRÜNLER",
      "languageCode": "tr"
    }
  ]
}
```

---

### Payment Domain 💳

#### GET /api/users/me/payment-methods
Kullanıcının ödeme yöntemlerini getirir

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "cardholderName": "John Doe",
      "cardNumberLast4": "1234",
      "expiryMonth": "12",
      "expiryYear": "2025",
      "cardType": "visa",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/users/me/payment-methods
Yeni ödeme yöntemi ekler

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```json
{
  "cardholderName": "John Doe",
  "cardNumberLast4": "1234",
  "expiryMonth": "12",
  "expiryYear": "2025",
  "cardType": "visa"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method added successfully.",
  "data": {
    "id": "uuid",
    "cardholderName": "John Doe",
    "cardNumberLast4": "1234",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cardType": "visa"
  }
}
```

#### DELETE /api/users/me/payment-methods/:paymentMethodId
Ödeme yöntemini siler

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method deleted successfully."
}
```

---

### Address Domain 🏠

#### GET /api/users/me/addresses
Kullanıcının adreslerini getirir

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "addressTitle": "Ev",
      "street": "Przykładowa 123",
      "city": "Warsaw",
      "postalCode": "00-001",
      "country": "Poland",
      "isDefaultDelivery": true,
      "isDefaultBilling": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/users/me/addresses
Yeni adres ekler

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```json
{
  "addressTitle": "İş",
  "street": "Business Street 456",
  "city": "Krakow",
  "postalCode": "30-001",
  "country": "Poland"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address added successfully.",
  "data": {
    "id": "uuid",
    "addressTitle": "İş",
    "street": "Business Street 456",
    "city": "Krakow",
    "postalCode": "30-001",
    "country": "Poland"
  }
}
```

#### PUT /api/users/me/addresses/:addressId
Adres günceller

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```json
{
  "addressTitle": "Ev (Güncellendi)",
  "street": "New Street 789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address updated successfully."
}
```

#### DELETE /api/users/me/addresses/:addressId
Adres siler

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Address deleted successfully."
}
```

#### POST /api/users/me/addresses/:addressId/set-default
Varsayılan adres ayarlar

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```json
{
  "type": "delivery"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Default address updated successfully."
}
```

---

### Orders Domain 📦

#### POST /api/orders
Yeni sipariş oluşturur

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```json
{
  "shippingAddressId": "uuid",
  "billingAddressId": "uuid",
  "paymentMethodId": "uuid",
  "notes": "Kapıya bırakabilirsiniz"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "orderNumber": "ORD-2024-001",
    "status": "pending",
    "totalAmount": 129.99,
    "paymentIntentId": "pi_stripe_payment_intent_id"
  }
}
```

#### GET /api/orders
Kullanıcının siparişlerini getirir

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "orderNumber": "ORD-2024-001",
      "status": "delivered",
      "totalAmount": 129.99,
      "currency": "PLN",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "shippedAt": "2024-01-02T00:00:00.000Z",
      "deliveredAt": "2024-01-05T00:00:00.000Z"
    }
  ]
}
```

#### GET /api/orders/:orderId
Belirli bir siparişin detaylarını getirir

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "order": {
    "id": "uuid",
    "orderNumber": "ORD-2024-001",
    "status": "delivered",
    "totalAmount": 129.99,
    "currency": "PLN",
    "trackingNumber": "TR123456789",
    "shippingCompany": "UPS"
  },
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "productName": "Yayla Yoğurt",
      "quantity": 2,
      "price": 29.99,
      "totalPrice": 59.98
    }
  ],
  "trackingEvents": [
    {
      "status": "delivered",
      "description": "Paket teslim edildi",
      "location": "Warsaw",
      "timestamp": "2024-01-05T10:30:00.000Z"
    }
  ]
}
```

#### GET /api/orders/tracking/:trackingNumber
Kargo takip numarası ile sipariş sorgular

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "order": {
    "id": "uuid",
    "orderNumber": "ORD-2024-001",
    "status": "in_transit",
    "trackingNumber": "TR123456789",
    "estimatedDelivery": "2024-01-05T00:00:00.000Z"
  },
  "trackingEvents": [
    {
      "status": "in_transit",
      "description": "Paket yolda",
      "location": "Krakow Distribution Center",
      "timestamp": "2024-01-03T14:20:00.000Z"
    }
  ]
}
```

#### DELETE /api/orders/:orderId
Siparişi iptal eder

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Sipariş başarıyla iptal edildi"
}
```

---

### Invoice Domain 📄

#### GET /api/invoices/:orderId
Sipariş için fatura indirir

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="invoice-ORD-2024-001.pdf"

[PDF Binary Data]
```

---

### Favorites Domain ❤️

#### GET /api/users/me/favorites
Kullanıcının favorilerini getirir

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `lang`: Dil (tr, en, pl) - varsayılan: tr

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Yayla Yoğurt",
      "image": "http://localhost:3000/images/product.jpg",
      "price": 29.99,
      "currency": "PLN",
      "stock": 100,
      "category": "sut-urunleri",
      "brand": "Yayla"
    }
  ]
}
```

#### POST /api/users/me/favorites
Favorilere ürün ekler

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```json
{
  "productId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product added to favorites."
}
```

#### DELETE /api/users/me/favorites/:productId
Favorilerden ürün çıkarır

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Product removed from favorites."
}
```

---

### Shopping Domain 🛒

#### GET /api/me/cart
Kullanıcı sepetini getirir

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `lang`: Dil (tr, en, pl) - opsiyonel

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "product": {
          "id": "uuid",
          "name": "Ürün Adı",
          "price": 29.99,
          "imageUrl": "http://localhost:3000/images/product.jpg"
        },
        "quantity": 2,
        "subtotal": 59.98
      }
    ],
    "summary": {
      "itemCount": 2,
      "subtotal": 59.98,
      "total": 59.98,
      "currency": "PLN"
    }
  }
}
```

#### POST /api/me/cart
Sepete ürün ekler

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```json
{
  "productId": "uuid",
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart successfully"
}
```

#### PUT /api/me/cart/:itemId
Sepet öğesi miktarını günceller

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```json
{
  "quantity": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cart item updated successfully"
}
```

#### DELETE /api/me/cart/:itemId
Sepetten ürün çıkarır

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart successfully"
}
```

#### DELETE /api/me/cart
Sepeti tamamen temizler

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

---

### Guest Domain 👥

#### POST /api/guest/session/create
Guest session oluşturur

**Request:**
```json
{
  "guestId": "guest_uuid",
  "deviceInfo": "Mozilla/5.0 (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "guestId": "guest_uuid",
  "expiresAt": "2024-01-08T00:00:00.000Z"
}
```

#### GET /api/guest/cart/:guestId
Guest sepetini getirir

**Query Parameters:**
- `lang`: Dil (tr, en, pl) - varsayılan: tr

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "product": {
          "id": "uuid",
          "name": "Yayla Yoğurt",
          "price": 29.99,
          "currency": "PLN",
          "stock": 100,
          "image": "http://localhost:3000/images/product.jpg",
          "brand": "Yayla"
        },
        "quantity": 2,
        "totalPrice": 59.98
      }
    ],
    "totalAmount": 59.98,
    "itemCount": 1
  }
}
```

#### POST /api/guest/cart/add
Guest sepetine ürün ekler

**Request:**
```json
{
  "guestId": "guest_uuid",
  "productId": "uuid",
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product added to cart"
}
```

#### DELETE /api/guest/cart/:guestId/:itemId
Guest sepetinden ürün çıkarır

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

#### GET /api/guest/favorites/:guestId
Guest favorilerini getirir

**Query Parameters:**
- `lang`: Dil (tr, en, pl) - varsayılan: tr

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "product": {
        "id": "uuid",
        "name": "Yayla Yoğurt",
        "price": 29.99,
        "currency": "PLN",
        "stock": 100,
        "image": "http://localhost:3000/images/product.jpg",
        "brand": "Yayla"
      }
    }
  ]
}
```

#### POST /api/guest/favorites/add
Guest favorilere ürün ekler

**Request:**
```json
{
  "guestId": "guest_uuid",
  "productId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product added to favorites"
}
```

#### DELETE /api/guest/favorites/:guestId/:productId
Guest favorilerden ürün çıkarır

**Response:**
```json
{
  "success": true,
  "message": "Product removed from favorites"
}
```

---

### Content Domain 📄

#### GET /api/content/faq
Sık sorulan sorular

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Sık Sorulan Sorular",
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "sections": [
      {
        "category": "Genel",
        "questions": [
          {
            "question": "Nasıl sipariş verebilirim?",
            "answer": "Ürünleri sepete ekleyerek sipariş verebilirsiniz."
          }
        ]
      }
    ]
  }
}
```

#### GET /api/content/terms
Kullanım koşulları ve gizlilik politikası

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Kullanım Koşulları ve Gizlilik Politikası",
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "content": {
      "termsOfService": "Kullanım koşulları metni...",
      "privacyPolicy": "Gizlilik politikası metni...",
      "cookiePolicy": "Çerez politikası metni..."
    }
  }
}
```

---

### Utils Domain 🔧

#### POST /api/utils/check-nip
NIP (Polonya vergi numarası) doğrulama

**Request:**
```json
{
  "nip": "1234567890"
}
```

**Response (Başarılı):**
```json
{
  "success": true,
  "data": {
    "companyName": "Şirket Adı",
    "nip": "1234567890",
    "statusVat": "Czynny",
    "regon": "123456789",
    "krs": "0000123456",
    "workingAddress": "Warszawa ul. Przykładowa 123",
    "registrationDate": "2020-01-01"
  }
}
```

**Response (Aktif Değil):**
```json
{
  "success": false,
  "message": "Bu şirket VAT açısından aktif değil. Sadece aktif şirketler kayıt olabilir.",
  "data": {
    "companyName": "Şirket Adı",
    "nip": "1234567890",
    "statusVat": "Nieczynny",
    "regon": "123456789",
    "krs": "0000123456",
    "workingAddress": "Warszawa ul. Przykładowa 123",
    "registrationDate": "2020-01-01"
  }
}
```

---

### Health Domain 🏥

#### GET /health
Basit sağlık kontrolü

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "metropolitan-backend"
}
```

#### GET /health/detailed
Detaylı sağlık kontrolü

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "environment": "production",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 15
    },
    "redis": {
      "status": "healthy",
      "responseTime": 5
    }
  },
  "system": {
    "memory": {
      "used": 256,
      "total": 1024,
      "percentage": 25
    },
    "cpu": {
      "usage": 15
    }
  }
}
```

#### GET /health/ready
Hazır olma durumu (Kubernetes uyumlu)

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /health/live
Canlılık durumu (Kubernetes uyumlu)

**Response:**
```json
{
  "status": "alive",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

---

### Stripe Webhook Domain 🔗

#### POST /stripe/webhook
Stripe webhook endpoint (root seviyesinde)

**Headers:**
```http
Content-Type: application/json
Stripe-Signature: t=1234567890,v1=signature
```

**Request (Örnek Payment Intent Succeeded):**
```json
{
  "id": "evt_stripe_event_id",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_stripe_payment_intent_id",
      "status": "succeeded",
      "amount": 12999,
      "currency": "pln",
      "metadata": {
        "orderId": "uuid"
      }
    }
  }
}
```

**Response:**
```json
{
  "received": true
}
```

---

## 🔄 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "errorId": "abc123def"
}
```

## 🌐 Internationalization

### Language Support
- `tr`: Türkçe (varsayılan)
- `en`: English
- `pl`: Polski

### Query Parameter
```
GET /api/products?lang=tr
```

## 🚨 Error Codes

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

### Custom Error Messages
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_FAILED`: Invalid credentials
- `INSUFFICIENT_STOCK`: Product out of stock
- `UNAUTHORIZED_ACCESS`: Access denied

## 🔒 Security

### Request Headers
```http
Authorization: Bearer <token>
Content-Type: application/json
```

### File Upload Security
- Dosya tipi kontrolü (MIME type + magic number)
- Maksimum boyut limiti
- Virüs tarama (production)

## 📋 OpenAPI Documentation

Swagger UI: `http://localhost:3000/swagger`

### API Konfigürasyonu
```typescript
.use(swagger({
  documentation: {
    info: {
      title: "Metropolitan Food API",
      description: "Metropolitan Food Group API dokümantasyonu",
      version: "1.0.0"
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server"
      }
    ]
  }
}))
```