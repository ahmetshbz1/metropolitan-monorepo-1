# Development Workflow Guide

## 🌳 Branch Stratejisi

### Dev Branch
- **Amaç:** Geliştirme, test, deneme
- **Deployment:** YOK (sadece build test edilir)
- **CI/CD:** Build only
- **Kullanım:** Günlük development çalışmaları

### Main Branch
- **Amaç:** Production (canlı sistem)
- **Deployment:** Otomatik (her push'ta)
- **CI/CD:** Build + Deploy + Health Check
- **Kullanım:** Sadece merge ile güncellenir

---

## 💻 Günlük Development Workflow

### 1. Dev Branch'te Çalış

```bash
# Dev branch'e geç
git checkout dev

# Güncel kodu çek
git pull origin dev
```

### 2. Geliştirme Yap

```bash
# Kod yaz, test et
# ...

# Değişiklikleri commit et
git add .
git commit -m "feat: yeni özellik ekle"

# Dev branch'e push et
git push origin dev
```

**Sonuç:**
- ✅ GitHub Actions dev branch için build yapar
- ✅ Build başarılı olursa image GHCR'ye push edilir
- ❌ Deploy OLMAZ (sunucuya gitmez)

### 3. Production'a Al (Main Branch)

```bash
# GitHub'da Pull Request oluştur
# dev → main

# PR'ı merge et
# Otomatik deployment başlar! 🚀
```

**Sonuç:**
- ✅ Build yapılır
- ✅ GHCR'ye push edilir
- ✅ Sunucuya deploy edilir
- ✅ Health check yapılır

---

## 🚀 CI/CD Pipeline

### Dev Branch Push:

```
1. Değişiklik tespiti (path-based)
2. Sadece değişen servisler build edilir:
   - Backend değişti mi? → Backend build
   - Admin değişti mi? → Admin build
   - Web-app değişti mi? → Web-app build
3. GHCR'ye push (dev-SHA tag)
4. ✅ Bitti (deploy YOK)
```

**Süre:** ~1-3 dakika

### Main Branch Push (Production):

```
1. Değişiklik tespiti (path-based)
2. Sadece değişen servisler build edilir
3. GHCR'ye push (latest + prod-SHA tag)
4. Sunucuya SSH bağlan
5. Pre-deployment backup al
6. Git pull origin main
7. Sadece değişen servisleri restart et
8. Health check yap
9. ✅ Deployment tamamlandı
```

**Süre:** ~2-4 dakika

---

## 📋 Örnek Senaryolar

### Senaryo 1: Backend'de Bug Fix

```bash
# Dev branch'te çalış
git checkout dev

# Bug fix yap
vim packages/backend/src/index.ts

# Commit + Push
git add .
git commit -m "fix: authentication bug düzeltildi"
git push origin dev

# GitHub Actions: Sadece backend build edilir (~1 dakika)
# Deploy YOK, test ortamında kalır

# Test ettikten sonra production'a al
# GitHub'da PR oluştur: dev → main
# Merge et
# Otomatik deployment başlar!
```

### Senaryo 2: Yeni Feature

```bash
# Dev branch'te feature geliştir
git checkout dev

# Birden fazla commit yap
git commit -m "feat: kullanıcı profil sayfası eklendi"
git commit -m "feat: profil fotoğrafı upload"
git commit -m "test: profil testleri eklendi"

# Her commit dev branch'te build edilir
# Hazır olunca main'e al
# PR oluştur → Merge → Otomatik deploy
```

### Senaryo 3: Acil Production Fix

```bash
# Direkt main branch'te çalış (sadece acil durumlar!)
git checkout main
git pull origin main

# Acil fix
git commit -m "hotfix: kritik güvenlik açığı kapatıldı"
git push origin main

# Otomatik deployment başlar (~2 dakika)

# Sonra dev'i sync et
git checkout dev
git merge main
git push origin dev
```

---

## ⚠️ Önemli Kurallar

### ✅ Yapılması Gerekenler:

1. **Her zaman dev branch'te çalış**
2. **Küçük, anlamlı commit'ler yap**
3. **Main'e merge etmeden önce dev'de test et**
4. **PR açarken açıklayıcı başlık ve açıklama yaz**
5. **Conflict olursa dev branch'i main ile sync et**

### ❌ Yapılmaması Gerekenler:

1. **Direkt main branch'e push etme** (acil durumlar hariç)
2. **Test edilmemiş kodu main'e merge etme**
3. **Dev branch'i uzun süre sync etmeden bırakma**
4. **Büyük, monolitik commit'ler yapma**

---

## 🔄 Dev Branch Sync Etme

Eğer dev ve main farklılaştıysa:

```bash
# Dev branch'e geç
git checkout dev

# Main'den güncellemeleri al
git fetch origin
git merge origin/main

# Conflict varsa çöz
# ...

# Push et
git push origin dev
```

---

## 📊 Deployment İzleme

### GitHub Actions
```
Repository → Actions sekmesi
- "Build Development" → Dev branch build'leri
- "Deploy Production (Optimized)" → Main branch deployment'ları
```

### Production Health Check
```bash
curl https://api.metropolitanfg.pl/health
```

### Sunucu Durumu
```bash
ssh metropolitan-deploy "cd /opt/metropolitan && docker-compose ps"
```

---

## 💡 İpuçları

1. **Her gün başında dev branch'i güncel tut**
   ```bash
   git checkout dev
   git pull origin dev
   git fetch origin
   git merge origin/main  # Main'deki değişiklikleri al
   ```

2. **Küçük PR'lar oluştur**
   - Her feature için ayrı PR
   - Kolay review edilir
   - Hızlı merge edilir

3. **Build başarısız olursa**
   - GitHub Actions logs'una bak
   - Hatayı düzelt
   - Yeniden push et

4. **Deployment başarısız olursa**
   - Sunucu loglarını kontrol et
   - Rollback gerekirse önceki commit'e dön

---

## 🎯 Özet

```
Dev Branch:
  - Geliştirme ortamı
  - Build only (test)
  - Deploy YOK
  - Conflict'siz çalışma

Main Branch:
  - Production
  - Build + Deploy
  - Her push otomatik deployment
  - Sadece PR ile güncellenir
```

**Başarılı Development! 🚀**
