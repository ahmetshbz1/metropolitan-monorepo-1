#!/bin/bash
set -e

echo '🚀 Starting deployment...'

# Variables
REPO_DIR='/opt/metropolitan'
BRANCH='prod'
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
docker-compose build --no-cache backend

echo '🚀 Starting services...'
docker-compose up -d postgres redis
sleep 10

echo '🚀 Starting backend...'
docker-compose up -d backend

echo '✅ Deployment complete!'
docker-compose ps