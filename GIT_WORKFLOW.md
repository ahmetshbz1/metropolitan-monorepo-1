# Git Workflow - Metropolitan

## 🌿 Branch Stratejisi

### `main` branch - Geliştirme
- **Amaç:** Aktif geliştirme branch'i
- **Kim push edebilir:** Geliştiriciler
- **Ne zaman:** Yeni özellikler, bug fix'ler
- **Test:** Local ve staging testler

### `prod` branch - Production
- **Amaç:** Canlı ortam branch'i
- **Kim push edebilir:** Sadece onaylanmış değişiklikler
- **Ne zaman:** Test edilmiş ve hazır özellikler
- **Deploy:** Otomatik deployment tetiklenir

## 🔄 Workflow

### 1️⃣ Geliştirme (main branch)
```bash
# Main branch'te çalış
git checkout main

# Değişiklik yap
git add .
git commit -m "feat: yeni özellik"
git push origin main
```

### 2️⃣ Test Et
- Local test: `bun run dev`
- Mobile test: Expo ile test
- API test: Postman/curl

### 3️⃣ Production'a Gönder
```bash
# Main'deki değişiklikleri prod'a merge et
git checkout prod
git merge main
git push origin prod

# Deploy et
ssh root@91.99.232.146 /opt/deploy.sh
# veya alias kullan:
# metropolitan-deploy
```

### 4️⃣ Rollback (Gerekirse)
```bash
git checkout prod
git revert HEAD
git push origin prod
metropolitan-deploy
```

## 📋 Commit Mesajları

Conventional Commits kullanıyoruz:
- `feat:` Yeni özellik
- `fix:` Bug düzeltmesi
- `docs:` Dokümantasyon
- `style:` Kod formatı (logic değişikliği yok)
- `refactor:` Kod yeniden yapılandırma
- `test:` Test ekleme/düzeltme
- `chore:` Build, config vb. değişiklikler

## 🚨 Önemli Kurallar

1. **ASLA production'da direkt değişiklik yapma**
2. **Her zaman önce main'de geliştir**
3. **Production'a göndermeden test et**
4. **Hassas bilgileri (.env, API keys) commit'leme**

## 🔥 Acil Durum Hotfix

```bash
# Hotfix branch oluştur
git checkout -b hotfix/kritik-hata main

# Düzeltmeyi yap
git add .
git commit -m "fix: kritik hata düzeltmesi"

# Main'e merge et
git checkout main
git merge hotfix/kritik-hata
git push origin main

# Prod'a merge et
git checkout prod
git merge hotfix/kritik-hata
git push origin prod

# Deploy et
metropolitan-deploy

# Hotfix branch'i sil
git branch -d hotfix/kritik-hata
```

## 📊 Mevcut Durum

- **main branch:** Aktif geliştirme
- **prod branch:** Canlı ortam (https://api.metropolitanfg.pl)
- **Deploy Script:** `/opt/deploy.sh`
- **Server:** Hetzner (91.99.232.146)

---

*Son güncelleme: 27 Eylül 2025*