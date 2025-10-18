# Metropolitan Deployment Guide (CI/CD)

## 🎯 CI/CD Automated Deployment

**Bu proje GitHub Actions ile otomatik deployment kullanır. Manuel build işlemleri artık KULLANILMAMAKTADIR.**

### Branch Stratejisi
- **dev** → Geliştirme ortamı (build only, auto deploy YOK)
- **main** → Production (otomatik build + deploy)

### Deployment Akışı
1. `dev` branch'te geliştirme yap
2. Test et, commit yap, push et
3. GitHub Actions `dev` branch için image build eder (test amaçlı)
4. Pull Request oluştur: `dev` → `main`
5. PR merge edilince **otomatik production deployment** başlar:
   - Docker image'ları build eder (GHCR'de)
   - Sunucuya SSH ile bağlanır
   - Pre-deployment backup alır
   - Yeni image'ları pull eder
   - Container'ları restart eder (volume'lar korunur)
   - Health check yapar

## 🚀 Production Server

- **Server IP**: 91.99.232.146
- **Domain**: api.metropolitanfg.pl
- **OS**: Ubuntu 22.04
- **Location**: Hetzner Cloud
- **Container Registry**: GitHub Container Registry (GHCR)

## 📁 Directory Structure

```
/opt/
├── metropolitan/              # Git repository (main branch)
├── metropolitan.env           # Production environment variables
└── backups/                   # Auto backups (pre-deployment)
```

## 🔧 Server Configuration

### SSH Access
```bash
# Add to ~/.ssh/config
Host metropolitan-deploy
    HostName 91.99.232.146
    User root
    Port 22
```

### Nginx Configuration
- Config file: `/etc/nginx/sites-available/metropolitan-api`
- SSL certificates: Let's Encrypt (auto-renewed)
- Rate limiting enabled: 20 requests/second burst

### Docker Services
- **Backend**: Bun + Elysia.js (port 3000)
- **PostgreSQL**: Version 16 (port 5432)
- **Redis**: Version 7 (port 6379)
- **Web-App**: Next.js (port 3001)
- **Admin-Panel**: Vite + React (port 3002)

## 🚢 CI/CD Deployment Process

### Otomatik Deployment (Önerilen Yöntem)

Main branch'e her push otomatik deploy tetikler:

```bash
# 1. Dev branch'te geliştir
git checkout dev
# ... değişiklikler yap ...
git add .
git commit -m "feat: yeni özellik ekle"
git push origin dev

# 2. GitHub'da Pull Request oluştur (dev → main)
# 3. PR'ı merge et
# 4. GitHub Actions otomatik deploy başlar!
```

**GitHub Actions Pipeline:**
1. ✅ Tüm servisleri build et (backend, admin-panel, web-app)
2. ✅ Docker image'ları GHCR'ye push et
3. ✅ Sunucuya SSH bağlan
4. ✅ Database backup al (otomatik)
5. ✅ Latest image'ları pull et
6. ✅ Container'ları restart et
7. ✅ Health check yap
8. ✅ Başarısız olursa hata logla

### Manuel Deployment (Acil Durum)

**YALNIZCA ACİL DURUMLARDA** kullan:

```bash
# SSH ile sunucuya bağlan
ssh metropolitan-deploy

# Deployment script'i çalıştır
cd /opt/metropolitan
bash deployment/deploy.sh
```

## 🔐 GitHub Secrets Configuration

Repository Settings → Secrets and variables → Actions → New repository secret:

```bash
SSH_HOST=91.99.232.146
SSH_USER=root
SSH_PRIVATE_KEY=<sunucu SSH private key>
```

**GITHUB_TOKEN** otomatik olarak mevcut (GHCR için).

## 📦 Container Registry

### GHCR Image'ları

```bash
ghcr.io/ahmetshbz1/metropolitan-backend:latest
ghcr.io/ahmetshbz1/metropolitan-admin-panel:latest
ghcr.io/ahmetshbz1/metropolitan-web-app:latest
```

### Sunucuda GHCR Login

```bash
# GitHub personal access token ile login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

## 🔐 Environment Variables

Production environment variables `/opt/metropolitan.env` dosyasında saklanır.

Gerekli değişkenler için `deployment/.env.production.example` dosyasına bakın.

### Stripe Configuration
```env
# Development/Test Mode
NODE_ENV=development → Returns test keys
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Production Mode
NODE_ENV=production → Returns live keys
STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...
```

## 📊 Monitoring

### View Logs
```bash
# Backend logs (real-time)
ssh metropolitan-deploy "docker logs -f metropolitan_backend"

# Admin panel logs
ssh metropolitan-deploy "docker logs -f metropolitan_admin"

# Web-app logs
ssh metropolitan-deploy "docker logs -f metropolitan_web"

# Son 100 satır
ssh metropolitan-deploy "docker logs --tail=100 metropolitan_backend"
```

### Check Status
```bash
# Tüm container'ları kontrol et
ssh metropolitan-deploy "docker-compose ps"

# Sistem kaynakları
ssh metropolitan-deploy "docker stats --no-stream"

# Health check
ssh metropolitan-deploy "curl -f https://api.metropolitanfg.pl/health"
```

### Restart Services
```bash
# Backend restart
ssh metropolitan-deploy "docker-compose restart backend"

# Tüm servisleri restart
ssh metropolitan-deploy "docker-compose restart"
```

## 💡 Common Operations

### Local Development

```bash
# Local'de development build (sunucuya değil)
docker-compose -f docker-compose.dev.yml up -d

# Local build ile test
docker-compose -f docker-compose.dev.yml build backend
docker-compose -f docker-compose.dev.yml up backend
```

### Check Deployment Status

```bash
# GitHub Actions workflow'larını kontrol et
# Repository → Actions → Latest workflow run

# Sunucuda container status
ssh metropolitan-deploy "docker-compose ps"

# Health endpoint
curl https://api.metropolitanfg.pl/health
```

### Rollback (Image Geri Alma)

```bash
# Son çalışan image'a geri dön
ssh metropolitan-deploy "cd /opt/metropolitan && docker-compose pull && docker-compose up -d"

# Spesifik commit SHA'ya dön (manual)
ssh metropolitan-deploy "cd /opt/metropolitan && git checkout <COMMIT_SHA> && bash deployment/deploy.sh"
```

## 🐛 Troubleshooting

### Deployment Failed

```bash
# 1. GitHub Actions logs kontrol et
# Repository → Actions → Failed workflow → Logs

# 2. Sunucu logları kontrol et
ssh metropolitan-deploy "docker logs --tail=200 metropolitan_backend"

# 3. Health check
ssh metropolitan-deploy "curl -v http://localhost:3000/health"

# 4. Container status
ssh metropolitan-deploy "docker-compose ps"
```

### Database Issues
```bash
# PostgreSQL logs
ssh metropolitan-deploy "docker logs metropolitan_postgres"

# Database bağlantı testi
ssh metropolitan-deploy "docker exec metropolitan_postgres psql -U metropolitan_prod -d metropolitan_production -c 'SELECT 1;'"
```

### Image Pull Issues
```bash
# GHCR login kontrolü
ssh metropolitan-deploy "docker login ghcr.io -u ahmetshbz1"

# Manuel image pull
ssh metropolitan-deploy "docker pull ghcr.io/ahmetshbz1/metropolitan-backend:latest"
```

## 🔄 Backup & Restore

### Otomatik Backup

Her deployment öncesi otomatik backup alınır:
```bash
/opt/backups/pre-deploy-YYYYMMDD-HHMMSS.sql
```

### Manuel Backup
```bash
# Database backup al
ssh metropolitan-deploy "docker exec metropolitan_postgres pg_dump -U metropolitan_prod metropolitan_production > /opt/backups/manual-backup-$(date +%Y%m%d).sql"

# Backup'ı local'e indir
scp metropolitan-deploy:/opt/backups/manual-backup-*.sql ./backups/
```

### Restore
```bash
# Backup'ı sunucuya yükle
scp ./backup.sql metropolitan-deploy:/tmp/

# Restore et
ssh metropolitan-deploy "docker exec -i metropolitan_postgres psql -U metropolitan_prod metropolitan_production < /tmp/backup.sql"
```

## 📝 Important Notes

1. ✅ **CI/CD kullan** - Manuel build artık KULLANILMIYOR
2. ✅ **Dev branch'te çalış** - Main branch production deployment tetikler
3. ✅ **Volume'lar korunur** - Deployment sırasında veriler kaybolmaz
4. ✅ **Otomatik backup** - Her deployment öncesi backup alınır
5. ✅ **Health check** - Deployment başarısız olursa otomatik tespit edilir
6. ⚠️ **Main branch'e dikkatli push** - Her push production'a deploy eder!

## 🌐 Quick Commands Cheat Sheet

```bash
# Deployment durumu
ssh metropolitan-deploy "docker-compose ps"

# Backend logs
ssh metropolitan-deploy "docker logs -f metropolitan_backend"

# Health check
curl https://api.metropolitanfg.pl/health

# Tüm servisleri restart
ssh metropolitan-deploy "docker-compose restart"

# Database backup
ssh metropolitan-deploy "docker exec metropolitan_postgres pg_dump -U metropolitan_prod metropolitan_production > /opt/backups/backup-$(date +%Y%m%d).sql"
```
