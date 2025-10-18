# GitHub Actions CI/CD Kurulum Rehberi

## 🔐 GitHub Secrets Yapılandırması

CI/CD'nin çalışması için aşağıdaki secret'ları GitHub repository'nize eklemeniz gerekiyor.

### Secret'ları Eklemek İçin

1. GitHub repository'ye git: `https://github.com/ahmetshbz1/metropolitan-monorepo-1`
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** butonuna tıkla
4. Her bir secret için aşağıdaki bilgileri gir

---

## 📋 Gerekli Secrets

### 1. SSH_HOST
```
Name: SSH_HOST
Secret: 91.99.232.146
```
**Açıklama:** Production sunucusunun IP adresi

---

### 2. SSH_USER
```
Name: SSH_USER
Secret: root
```
**Açıklama:** SSH bağlantısı için kullanıcı adı

---

### 3. SSH_PRIVATE_KEY
```
Name: SSH_PRIVATE_KEY
Secret: <SSH Private Key>
```

**SSH Private Key Nasıl Alınır:**

```bash
# Local makinende (macOS/Linux)
cat ~/.ssh/id_rsa

# Eğer yoksa, yeni bir SSH key oluştur:
ssh-keygen -t rsa -b 4096 -C "github-actions@metropolitan"

# Public key'i sunucuya ekle
cat ~/.ssh/id_rsa.pub | ssh root@91.99.232.146 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# Private key'i kopyala (tüm içeriği)
cat ~/.ssh/id_rsa
# Çıktının TAMAMINI GitHub Secret'a yapıştır
```

**Örnek Format:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
...
(çok satır key verisi)
...
-----END OPENSSH PRIVATE KEY-----
```

---

### 4. GITHUB_TOKEN (Otomatik)

**GITHUB_TOKEN** otomatik olarak sağlanır, manuel eklemeye gerek YOK.

Bu token GHCR (GitHub Container Registry) için kullanılır.

---

## ✅ Secret'ları Doğrulama

Tüm secret'ları ekledikten sonra doğrulama:

1. **Settings** → **Secrets and variables** → **Actions**
2. Şu 3 secret'ın listelendiğini kontrol et:
   - ✅ `SSH_HOST`
   - ✅ `SSH_USER`
   - ✅ `SSH_PRIVATE_KEY`

---

## 🚀 İlk Deployment

Secret'lar eklendikten sonra:

### 1. Dev Branch'te Test
```bash
git checkout dev
git add .
git commit -m "ci: GitHub Actions CI/CD setup"
git push origin dev
```

**Sonuç:** GitHub Actions build yapacak ama deploy ETMEYECEK (sadece test)

### 2. Production Deployment
```bash
# GitHub'da Pull Request oluştur: dev → main
# PR'ı merge et
# Otomatik deployment başlayacak!
```

**GitHub Actions:** Repository → Actions → Deploy Production

---

## 🔧 Sunucu Tarafı Hazırlık

### 1. GHCR Login Ayarla

```bash
# Sunucuya SSH ile bağlan
ssh metropolitan-deploy

# GitHub Container Registry'ye login
echo "GITHUB_TOKEN_BURAYA" | docker login ghcr.io -u ahmetshbz1 --password-stdin
```

**GitHub Personal Access Token Oluştur:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Generate new token (classic)**
3. **Scopes:** `read:packages`, `write:packages`
4. Token'ı kopyala ve yukarıdaki komutta kullan

### 2. Deployment Script'i Executable Yap

```bash
ssh metropolitan-deploy "chmod +x /opt/metropolitan/deployment/deploy.sh"
```

### 3. Docker Compose Güncellemesi

```bash
# Sunucudaki docker-compose.yml'in GHCR image'ları kullandığından emin ol
ssh metropolitan-deploy "cd /opt/metropolitan && cat docker-compose.yml | grep ghcr.io"
```

**Beklenen çıktı:**
```
image: ghcr.io/ahmetshbz1/metropolitan-backend:latest
image: ghcr.io/ahmetshbz1/metropolitan-admin-panel:latest
image: ghcr.io/ahmetshbz1/metropolitan-web-app:latest
```

---

## 🐛 Troubleshooting

### Secret Hataları

**Hata:** `Error: Process completed with exit code 255.`
- **Çözüm:** SSH_PRIVATE_KEY'in doğru formatda olduğundan emin ol (BEGIN/END dahil)

**Hata:** `Permission denied (publickey)`
- **Çözüm:** Public key'in sunucuda `/root/.ssh/authorized_keys`'te olduğunu kontrol et

### GHCR Login Hataları

**Hata:** `denied: permission_denied`
- **Çözüm:** GitHub token'ın `write:packages` scope'una sahip olduğunu kontrol et

### Health Check Failed

**Hata:** `Backend health check failed!`
- **Çözüm:**
  ```bash
  ssh metropolitan-deploy "docker logs --tail=100 metropolitan_backend"
  ```

---

## 📊 Deployment İzleme

### GitHub Actions Workflow

1. Repository → **Actions** sekmesi
2. **Deploy Production** workflow'unu seç
3. En son çalışan workflow'a tıkla
4. **deploy** job'ını aç
5. Her adımın loglarını incele

### Sunucu Logları

```bash
# Real-time backend logs
ssh metropolitan-deploy "docker logs -f metropolitan_backend"

# Container durumu
ssh metropolitan-deploy "docker-compose ps"

# Health check
curl https://api.metropolitanfg.pl/health
```

---

## 🎯 Workflow Özeti

### Dev Branch Push
- ✅ Build backend, admin-panel, web-app
- ✅ Push to GHCR (dev-SHA tag)
- ❌ Deployment YOK

### Main Branch Push
- ✅ Build all services
- ✅ Push to GHCR (latest + prod-SHA tags)
- ✅ SSH to server
- ✅ Backup database
- ✅ Pull images
- ✅ Restart containers
- ✅ Health check
- ✅ Cleanup old images

---

## 📝 Notlar

1. **SSH Key Güvenliği:** Private key'i ASLA kodda paylaşma, sadece GitHub Secrets'ta sakla
2. **GITHUB_TOKEN:** Her workflow run'ında otomatik olarak yenilenir
3. **Backup:** Her deployment öncesi otomatik backup alınır (`/opt/backups/`)
4. **Rollback:** Başarısız deployment durumunda logları kontrol et, gerekirse önceki commit'e geri dön
5. **Volume'lar:** Container'lar yeniden oluşturulsa da volume'lar korunur, veri kaybı olmaz

---

## 🆘 Acil Durum

Eğer CI/CD başarısız olursa:

```bash
# Manuel deployment
ssh metropolitan-deploy "cd /opt/metropolitan && bash deployment/deploy.sh"
```

Eğer deployment script de başarısız olursa:

```bash
# Son çalışan versiyona geri dön
ssh metropolitan-deploy "cd /opt/metropolitan && git log --oneline -n 10"
# Çalışan bir commit SHA'sını seç
ssh metropolitan-deploy "cd /opt/metropolitan && git checkout <COMMIT_SHA> && docker-compose restart"
```
