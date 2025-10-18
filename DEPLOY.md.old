# Metropolitan Deployment Guide

## 🚀 Production Server

- **Server IP**: 91.99.232.146
- **Domain**: api.metropolitanfg.pl
- **OS**: Ubuntu 22.04
- **Location**: Hetzner Cloud

## 📁 Directory Structure

```
/opt/
├── metropolitan/              # Git repository (prod branch)
├── metropolitan.env           # Production environment variables
└── deploy.sh                  # Deployment script
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

## 🚢 Deployment Process

### Quick Deploy
```bash
# Deploy latest prod branch
ssh metropolitan-deploy "/opt/deploy.sh"
```

### Manual Deploy Steps
```bash
# 1. SSH to server
ssh metropolitan-deploy

# 2. Navigate to project
cd /opt/metropolitan

# 3. Pull latest changes
git fetch origin
git reset --hard origin/prod

# 4. Copy production env
cp /opt/metropolitan.env .env

# 5. Rebuild and restart
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

## 🔐 Environment Variables

Production environment variables are stored in `/opt/metropolitan.env` on the server.

See `deployment/.env.production.example` for required variables.

### Stripe Configuration
```env
# Development/Test Mode
NODE_ENV=development → Returns test keys
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Production Mode
NODE_ENV=production → Returns live keys
STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...
```

## 🍎 Apple Review Mode

During Apple Review, set the server to development mode:

1. Edit `docker-compose.yml`:
```yaml
environment:
  NODE_ENV: development  # Change from production
```

2. Commit and deploy:
```bash
git add docker-compose.yml
git commit -m "temp: Enable development mode for Apple Review"
git push origin main
git checkout prod && git merge main && git push origin prod
ssh metropolitan-deploy "/opt/deploy.sh"
```

3. After approval, revert to production:
```yaml
environment:
  NODE_ENV: production  # Change back
```

## 📊 Monitoring

### View Logs
```bash
# All services
ssh metropolitan-deploy "docker-compose logs -f"

# Backend only
ssh metropolitan-deploy "docker-compose logs -f backend"

# Last 100 lines
ssh metropolitan-deploy "docker-compose logs --tail=100 backend"
```

### Check Status
```bash
# Service status
ssh metropolitan-deploy "docker-compose ps"

# System resources
ssh metropolitan-deploy "docker stats --no-stream"
```

### Restart Services
```bash
# Restart backend only
ssh metropolitan-deploy "docker-compose restart backend"

# Restart all services
ssh metropolitan-deploy "docker-compose restart"
```

## 🐛 Troubleshooting

### Database Issues
```bash
# Check PostgreSQL logs
ssh metropolitan-deploy "docker-compose logs postgres"

# Access PostgreSQL
ssh metropolitan-deploy "docker-compose exec postgres psql -U metropolitan"
```

### Redis Issues
```bash
# Check Redis logs
ssh metropolitan-deploy "docker-compose logs redis"

# Access Redis CLI
ssh metropolitan-deploy "docker-compose exec redis redis-cli"
```

### Port Conflicts
```bash
# Check what's using port 3000
ssh metropolitan-deploy "lsof -i :3000"

# Kill process on port
ssh metropolitan-deploy "kill -9 $(lsof -t -i:3000)"
```

## 🔄 Backup & Restore

### Database Backup
```bash
# Create backup
ssh metropolitan-deploy "docker-compose exec postgres pg_dump -U metropolitan metropolitan_db > /opt/backup-$(date +%Y%m%d).sql"

# Download backup
scp metropolitan-deploy:/opt/backup-*.sql ./backups/
```

### Database Restore
```bash
# Upload backup
scp ./backup.sql metropolitan-deploy:/opt/

# Restore database
ssh metropolitan-deploy "docker-compose exec -T postgres psql -U metropolitan metropolitan_db < /opt/backup.sql"
```

## 🌐 DNS & SSL

### Domain Configuration
- Domain registrar: (Your registrar)
- DNS provider: (Your DNS provider)
- A Record: `api.metropolitanfg.pl` → `91.99.232.146`

### SSL Certificate
- Provider: Let's Encrypt (Certbot)
- Auto-renewal: Enabled via cron job
- Check expiry: `ssh metropolitan-deploy "certbot certificates"`

## 📝 Notes

1. **Always test locally first** before deploying to production
2. **Keep prod branch stable** - only merge tested changes
3. **Monitor after deployment** - Check logs for errors
4. **Backup before major changes** - Database and .env file
5. **Document any manual changes** made on the server

## 🆘 Emergency Contacts

- Server Provider: Hetzner Cloud
- Domain Provider: (Your provider)
- SSL Issues: Check Certbot logs
- Database Issues: Check PostgreSQL logs

## 🌐 Web Application Deployment

See `deployment/WEB_DEPLOYMENT_GUIDE.md` for detailed web-app deployment instructions.

### Quick Web Deployment

```bash
# Deploy both backend and web-app
ssh metropolitan-deploy "/opt/deploy.sh"

# Deploy only web-app
ssh metropolitan-deploy "cd /opt/metropolitan && docker-compose build --no-cache web-app && docker-compose up -d web-app"
```

## 📌 Quick Commands

```bash
# Deploy all services
ssh metropolitan-deploy "/opt/deploy.sh"

# Backend logs
ssh metropolitan-deploy "docker-compose logs -f backend"

# Web-app logs
ssh metropolitan-deploy "docker-compose logs -f web-app"

# Restart backend
ssh metropolitan-deploy "docker-compose restart backend"

# Restart web-app
ssh metropolitan-deploy "docker-compose restart web-app"

# Status
ssh metropolitan-deploy "docker-compose ps"
```