#!/bin/bash
set -e

echo '🚀 Starting deployment...'

# Variables
REPO_DIR='/opt/metropolitan'
BRANCH='main'
ENV_FILE='/opt/metropolitan.env'

# Create directory if not exists
mkdir -p $REPO_DIR

# Clone or pull repository
if [ ! -d "$REPO_DIR/.git" ]; then
    echo '📥 Cloning repository...'
    git clone -b $BRANCH git@github.com:ahmetshbz1/metropolitan-monorepo-1.git $REPO_DIR
else
    echo '📥 Pulling latest changes...'
    cd $REPO_DIR
    git fetch origin
    git reset --hard origin/$BRANCH
fi

cd $REPO_DIR

# Copy .env if exists
if [ -f $ENV_FILE ]; then
    cp $ENV_FILE $REPO_DIR/.env
    echo '✅ .env file copied'
else
    echo '⚠️  .env source file not found at $ENV_FILE'
    exit 1
fi

# Install Docker Compose if not exists
if ! command -v docker-compose &> /dev/null; then
    echo '📦 Installing Docker Compose...'
    curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Stop existing containers
echo '🛑 Stopping existing containers...'
docker-compose down || true

# Build and start services
echo '🔨 Building Docker images...'
docker-compose build --no-cache backend web-app admin-panel

echo '🚀 Starting database services...'
docker-compose up -d postgres redis
echo '⏳ Waiting for database to be ready...'
sleep 15

echo '🗄️ Running database migrations...'
docker-compose run --rm backend bun run db:migrate

echo '🌱 Seeding system data...'
docker-compose run --rm backend bun run db:seed

echo '👥 Creating admin users...'
docker-compose run --rm backend bun run db:seed:admins

echo '🚀 Starting backend...'
docker-compose up -d backend
echo '⏳ Waiting for backend to be ready...'
sleep 10

echo '🌐 Starting web-app...'
docker-compose up -d web-app

echo '👨‍💼 Starting admin-panel...'
docker-compose up -d admin-panel

echo '✅ Deployment complete!'
echo ''
echo '📊 Container status:'
docker-compose ps
echo ''
echo '🔗 Services:'
echo '   - API: https://api.metropolitanfg.pl'
echo '   - Web: https://metropolitanfg.pl'
echo '   - Admin: https://admin.metropolitanfg.pl'