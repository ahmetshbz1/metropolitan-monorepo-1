# Metropolitan Workspace

Bu proje, Metropolitan e-ticaret sisteminin tüm bileşenlerini içeren bir monorepo yapısıdır.

## Proje Yapısı

```
metropolitan-workspace/
├── packages/
│   ├── mobile-app/          # React Native mobil uygulama
│   ├── backend/             # Node.js/TypeScript API
│   ├── admin-panel/         # Admin paneli (gelecekte)
│   ├── website/             # Ana website (gelecekte)
│   └── shared/              # Ortak kod ve tipler
│       ├── types/           # API tipleri
│       ├── utils/           # Utility fonksiyonları
│       ├── constants/       # Sabitler
│       └── ui/              # Ortak UI bileşenleri
├── package.json             # Workspace konfigürasyonu
└── README.md
```

## Kurulum

```bash
# Tüm paketleri yükle
bun run install:all

# Veya tek tek
cd packages/mobile-app && bun install
cd packages/backend && bun install
```

## Geliştirme

```bash
# Mobil uygulamayı başlat
bun run dev:mobile

# Backend'i başlat
bun run dev:backend

# İkisini birden başlat
bun run dev:all
```

## Kullanım

### Shared Package Kullanımı

```typescript
// Backend'de
import { User, Product, formatPrice } from '@metropolitan/shared';

// Mobile app'de
import { API_ENDPOINTS, ERROR_MESSAGES } from '@metropolitan/shared';
```

## Workspace Avantajları

1. **Tek Codebase**: Tüm projeler tek yerde
2. **Ortak Tipler**: API değişikliklerinde otomatik sync
3. **Shared Utilities**: Kod tekrarını önler
4. **Unified Development**: Tek komutla tüm servisleri çalıştır
5. **Consistent Deployment**: Docker compose ile kolay deploy

## Gelecek Planları

- [ ] Admin paneli ekleme
- [ ] Website ekleme
- [ ] Shared UI component library
- [ ] E2E test setup
- [ ] CI/CD pipeline 