# Web App - Bağımsız Workflow

Bu web-app paketi, root monorepo'dan bağımsız olarak yönetilir.

## 🚀 Hızlı Başlangıç

### Web App Geliştirme

```bash
# Web app'i başlat
cd packages/web-app
bun run dev

# Veya root'tan
bun run dev:web
```

### Web App Build

```bash
# Web app build
cd packages/web-app
bun run build

# Veya root'tan
bun run build:web
```

## 📦 Bağımsız Yönetim

Web-app paketi:

- ✅ Kendi `package.json`'ı var
- ✅ Kendi `node_modules`'ı var
- ✅ Shared paketini kullanır (`@metropolitan/shared`)
- ✅ Root workspace'den bağımsız çalışır
- ✅ Kendi port'unda çalışır (3001)

## 🔧 Geliştirme Komutları

```bash
# Web app geliştirme sunucusu
bun run dev

# Web app build
bun run build

# Web app production start
bun run start

# Linting
bun run lint
```

## 🌐 Port ve URL

- **Development**: http://localhost:3001
- **Production**: Next.js production server

## 📁 Proje Yapısı

```
packages/web-app/
├── src/
│   ├── app/           # Next.js app router
│   ├── components/    # React components
│   ├── lib/          # Utilities & shared code
│   ├── hooks/        # Custom hooks
│   └── services/     # API services
├── public/           # Static assets
└── package.json      # Web app dependencies
```

## 🔗 Bağımlılıklar

- **Shared**: `@metropolitan/shared` (types, constants, utils)
- **Framework**: Next.js 15.5.4
- **UI**: Radix UI + Tailwind CSS
- **State**: Zustand
- **API**: Axios + React Query
- **Auth**: Firebase + JWT
- **Payments**: Stripe

## ⚠️ Önemli Notlar

1. **Bağımsız Geliştirme**: Web-app kendi workflow'unu takip eder
2. **Shared Kullanımı**: `@metropolitan/shared` paketini kullanır
3. **Port Çakışması**: Backend (3000) ve Web-app (3001) farklı portlarda
4. **Build**: Next.js production build kullanır
5. **Deployment**: Kendi deployment pipeline'ı olabilir
