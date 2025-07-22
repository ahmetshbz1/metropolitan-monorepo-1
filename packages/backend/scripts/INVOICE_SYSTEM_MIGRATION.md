# Fatura Sistemi Migrasyonu

## Özet

Python/WeasyPrint tabanlı fatura sistemi **Fakturownia API** entegrasyonu ile değiştirilmiştir.

## Değişiklikler

### ❌ Eski Sistem (Disabled)
- `weasyprint-pdf.py.DISABLED` - Python WeasyPrint script'i (devre dışı)
- Manuel PDF oluşturma
- Lokal HTML template rendering
- Python bağımlılığı

### ✅ Yeni Sistem (Fakturownia API)
- `FakturowniaService` - TypeScript API client
- `FakturowniaAdapterService` - Data format conversion
- Otomatik fatura oluşturma ve PDF indirme
- Redis cache optimizasyonu
- Enhanced error handling ve logging

## Yapılan Değişiklikler

### 1. Environment Variables
```env
FAKTUROWNIA_API_TOKEN=364ffTp8wLtSOC5E4wa
FAKTUROWNIA_API_URL=https://ahmtcan12211.fakturownia.pl
```

### 2. Yeni Servisler
- `src/shared/infrastructure/external/fakturownia.service.ts`
- `src/domains/order/application/use-cases/fakturownia-adapter.service.ts`

### 3. Güncellenmiş Servisler
- `PDFService`: Fakturownia API kullanımı + fallback
- `InvoiceService`: Müşteri ID bazlı dosya organizasyonu
- `InvoiceCacheService`: Fakturownia ID cache desteği

### 4. Dosya Organizasyonu
```
/uploads/invoices/{customer_id}/invoice-{order_id}.pdf
```

## Migration Guide

### Production Deployment
1. Environment variables eklenmiş
2. Fakturownia API token doğrulanmış
3. Testler güncellenmeli
4. Python bağımlılığı kaldırılabilir

### Rollback Plan
Development ortamında fallback aktif:
```typescript
if (process.env.NODE_ENV === "development") {
  return this.generateInvoicePDFLegacy(data);
}
```

## Benefits

- ✅ Daha hızlı fatura oluşturma
- ✅ Otomatik numara yönetimi  
- ✅ Professional PDF templates
- ✅ API-first approach
- ✅ Better error handling
- ✅ Enhanced caching
- ✅ Müşteri bazlı dosya organizasyonu

## Created by Ahmet - 20.07.2025