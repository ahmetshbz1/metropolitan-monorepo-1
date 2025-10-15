# Metropolitan Deployment Guide

## 🚀 Production Server

- **Server IP**: 91.99.232.146
- **Domain**: api.metropolitanfg.pl
- **OS**: Ubuntu 22.04
- **Location**: Hetzner Cloud

## 📁 Directory Structure

```
/opt/
├── metropolitan/              # Git repository (main branch)
└── metropolitan.env           # Production environment variables
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

### Quick Deploy (Backend + Admin Panel)
```bash
ssh metropolitan-deploy "cd /opt/metropolitan && git fetch origin && git reset --hard origin/main && cp /opt/metropolitan.env .env && docker-compose down && docker-compose build --no-cache backend admin-panel && docker-compose up -d"
```

### Manual Deploy Steps
```bash
# 1. SSH to server
ssh metropolitan-deploy

# 2. Navigate to project
cd /opt/metropolitan

# 3. Pull latest changes from main branch
git fetch origin
git reset --hard origin/main

# 4. Copy production env
cp /opt/metropolitan.env .env

# 5. Rebuild backend and admin panel
docker-compose down
docker-compose build --no-cache backend admin-panel
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
# Then deploy using Quick Deploy command above
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

## 💡 Common Operations

### Quick Rebuild After Code Changes
```bash
# Fast rebuild (only rebuild TypeScript inside running container)
ssh metropolitan-deploy "cd /opt/metropolitan && git fetch origin && git reset --hard origin/main && docker exec metropolitan_backend bun run build && docker restart metropolitan_backend"

# Full rebuild (slower, rebuilds Docker image)
ssh metropolitan-deploy "cd /opt/metropolitan && git fetch origin && git reset --hard origin/main && docker-compose build --no-cache backend && docker-compose up -d backend"
```

### Important Notes
- **Always use `cd /opt/metropolitan`** before docker-compose commands
- **Container names**: Use `metropolitan_backend`, `metropolitan_postgres`, etc. (NOT service names like `backend`, `postgres`)
- **Service names**: Use `backend`, `postgres`, etc. in `docker-compose` commands
- **Environment file**: Copy `/opt/metropolitan.env` to `.env` when needed
- **Rebuild vs Restart**:
  - `docker exec ... bun run build && docker restart`: Fast, only recompiles code
  - `docker-compose build --no-cache`: Slow, rebuilds entire Docker image

### Check Container Status
```bash
# List all containers
ssh metropolitan-deploy "cd /opt/metropolitan && docker-compose ps"

# Check specific container logs
ssh metropolitan-deploy "docker logs --tail 50 metropolitan_backend"
ssh metropolitan-deploy "docker logs --tail 50 metropolitan_admin"
ssh metropolitan-deploy "docker logs --tail 50 metropolitan_postgres"

# Follow logs in real-time
ssh metropolitan-deploy "docker logs -f metropolitan_backend"

# Filter logs for specific keywords
ssh metropolitan-deploy "docker logs --tail 100 metropolitan_backend 2>&1 | grep -i error"
ssh metropolitan-deploy "docker logs --tail 100 metropolitan_backend 2>&1 | grep -i 'stock rollback'"
```

### Access Services
```bash
# Backend shell
ssh metropolitan-deploy "docker exec -it metropolitan_backend sh"

# PostgreSQL shell
ssh metropolitan-deploy "docker exec -it metropolitan_postgres psql -U postgres -d metropolitan"

# Redis CLI
ssh metropolitan-deploy "docker exec -it metropolitan_redis redis-cli"

# Check Redis stock data
ssh metropolitan-deploy "docker exec -it metropolitan_redis redis-cli --scan --pattern 'product:*:stock'"
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
2. **Keep main branch stable** - only push tested changes
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
# Deploy only web-app
ssh metropolitan-deploy "cd /opt/metropolitan && git fetch origin && git reset --hard origin/main && docker-compose build --no-cache web-app && docker-compose up -d web-app"
```

## 📌 Quick Commands

```bash
# Deploy all services (backend + admin-panel + web-app)
ssh metropolitan-deploy "cd /opt/metropolitan && git fetch origin && git reset --hard origin/main && cp /opt/metropolitan.env .env && docker-compose down && docker-compose build --no-cache && docker-compose up -d"

# Deploy only backend
ssh metropolitan-deploy "cd /opt/metropolitan && git fetch origin && git reset --hard origin/main && docker-compose build --no-cache backend && docker-compose up -d backend"

# Deploy only admin panel
ssh metropolitan-deploy "cd /opt/metropolitan && git fetch origin && git reset --hard origin/main && docker-compose build --no-cache admin-panel && docker-compose up -d admin-panel"

# Backend logs
ssh metropolitan-deploy "docker-compose logs -f backend"

# Admin panel logs
ssh metropolitan-deploy "docker-compose logs -f admin-panel"

# Web-app logs
ssh metropolitan-deploy "docker-compose logs -f web-app"

# Restart backend
ssh metropolitan-deploy "docker-compose restart backend"

# Restart admin panel
ssh metropolitan-deploy "docker-compose restart admin-panel"

# Restart web-app
ssh metropolitan-deploy "docker-compose restart web-app"

# Status
ssh metropolitan-deploy "docker-compose ps"
```