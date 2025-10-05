# Web-App Deployment Talimatları

## 🚀 Sunucu Kurulumu

### 1. Nginx Yapılandırması

```bash
# Sunucuya bağlan
ssh metropolitan-deploy

# Nginx yapılandırma dosyasını kopyala
sudo nano /etc/nginx/sites-available/metropolitan-web

# Dosya içeriğini deployment/nginx/metropolitan-web dosyasından kopyala

# Symbolic link oluştur
sudo ln -s /etc/nginx/sites-available/metropolitan-web /etc/nginx/sites-enabled/

# Nginx yapılandırmasını test et
sudo nginx -t

# Nginx'i yeniden yükle (henüz SSL sertifikası olmadığı için başlatma)
# sudo systemctl reload nginx
```

### 2. SSL Sertifikası (Certbot)

```bash
# Certbot kurulumu (eğer kurulu değilse)
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# SSL sertifikası al (metropolitanfg.pl için)
sudo certbot certonly --nginx -d metropolitanfg.pl

# SSL sertifikası al (www.metropolitanfg.pl için)
sudo certbot certonly --nginx -d www.metropolitanfg.pl

# Sertifikaları test et
sudo certbot certificates

# Nginx'i yeniden başlat
sudo systemctl reload nginx
```

### 3. Otomatik Yenileme Testi

```bash
# Certbot otomatik yenileme testi
sudo certbot renew --dry-run
```

## 🔧 Production Environment Variables

`/opt/metropolitan.env` dosyasına aşağıdaki değişkenleri ekle:

```bash
# Web Application
WEB_PORT=3001
```

**Not**: Stripe publishable key backendden alınıyor, web-app'e environment variable olarak verilmesine gerek yok.

## 🚢 Deployment

### Otomatik Deployment

```bash
# Deploy scriptini çalıştır
ssh metropolitan-deploy "/opt/deploy.sh"
```

### Manuel Deployment

```bash
ssh metropolitan-deploy

cd /opt/metropolitan
git fetch origin
git reset --hard origin/prod

cp /opt/metropolitan.env .env

docker-compose down
docker-compose build --no-cache web-app
docker-compose up -d web-app
```

## 📊 Monitoring

### Logları Görüntüle

```bash
# Web-app logları
ssh metropolitan-deploy "docker-compose logs -f web-app"

# Son 100 satır
ssh metropolitan-deploy "docker-compose logs --tail=100 web-app"
```

### Container Durumu

```bash
# Tüm containerlar
ssh metropolitan-deploy "docker-compose ps"

# Sadece web-app
ssh metropolitan-deploy "docker ps | grep metropolitan_web"
```

### Web-app'i Yeniden Başlat

```bash
ssh metropolitan-deploy "docker-compose restart web-app"
```

## 🧪 Test

### Lokal Test

```bash
# Container'ı build et
docker-compose build web-app

# Container'ı başlat
docker-compose up web-app

# Tarayıcıda test et
# http://localhost:3001
```

### Production Test

```bash
# HTTP test (redirect beklenir)
curl -I http://metropolitanfg.pl

# HTTPS test
curl -I https://metropolitanfg.pl
curl -I https://www.metropolitanfg.pl
```

## 🔍 Troubleshooting

### Port 3001 Kullanımda

```bash
ssh metropolitan-deploy "lsof -i :3001"
ssh metropolitan-deploy "kill -9 $(lsof -t -i:3001)"
```

### Container Başlamıyor

```bash
# Logları kontrol et
ssh metropolitan-deploy "docker-compose logs web-app"

# Container'ı yeniden build et
ssh metropolitan-deploy "docker-compose build --no-cache web-app && docker-compose up -d web-app"
```

### Nginx Hataları

```bash
# Nginx error logları
ssh metropolitan-deploy "sudo tail -f /var/log/nginx/error.log"

# Nginx yapılandırmasını test et
ssh metropolitan-deploy "sudo nginx -t"
```

## 📌 Önemli Notlar

1. **Cloudflare DNS**: DNS only modunda bırakın (Proxy kapalı)
2. **SSL**: Certbot otomatik olarak yenileyecek
3. **Build Süresi**: İlk build ~5-10 dakika sürebilir
4. **Cache**: Next.js static dosyalarını cache'ler
5. **Health Check**: Container otomatik olarak health check yapar

## 🌐 Domain Yapılandırması

- `metropolitanfg.pl` → 91.99.232.146 (Ana domain)
- `www.metropolitanfg.pl` → 91.99.232.146 (WWW subdomain)
- `api.metropolitanfg.pl` → 91.99.232.146 (Backend API)

Cloudflare'de DNS kayıtları:
- Proxy Status: DNS only (orange cloud kapalı)
- TTL: Auto
