#!/bin/bash

# Metropolitan Production Deployment Script (CI/CD)
# This script pulls pre-built images from GHCR and deploys them

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Metropolitan CI/CD Deployment ===${NC}"
echo "Timestamp: $(date)"

# Configuration
PROJECT_DIR="/opt/metropolitan"
BACKUP_DIR="/opt/backups"
ENV_FILE="/opt/metropolitan.env"
MAX_BACKUPS=10

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment backup
create_backup() {
    log_info "Creating pre-deployment backup..."
    mkdir -p "$BACKUP_DIR"

    local backup_file="$BACKUP_DIR/pre-deploy-$(date +%Y%m%d-%H%M%S).sql"

    if docker exec metropolitan_postgres pg_dump -U metropolitan_prod metropolitan_production > "$backup_file"; then
        log_info "Backup created: $backup_file"

        # Keep only last MAX_BACKUPS files
        local backup_count=$(ls -1 "$BACKUP_DIR"/pre-deploy-*.sql 2>/dev/null | wc -l)
        if [ "$backup_count" -gt "$MAX_BACKUPS" ]; then
            log_warn "Cleaning old backups (keeping last $MAX_BACKUPS)..."
            ls -1t "$BACKUP_DIR"/pre-deploy-*.sql | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
        fi
    else
        log_error "Backup failed! Aborting deployment."
        exit 1
    fi
}

# Pull latest code
pull_code() {
    log_info "Navigating to project directory..."
    cd "$PROJECT_DIR"

    log_info "Pulling latest code from main branch..."
    git fetch origin
    git reset --hard origin/main

    log_info "Copying production environment..."
    cp "$ENV_FILE" .env
}

# Pull Docker images
pull_images() {
    log_info "Pulling latest Docker images from GHCR..."

    if ! docker-compose pull backend admin-panel web-app 2>&1; then
        log_error "Failed to pull Docker images!"
        exit 1
    fi

    log_info "Images pulled successfully"
}

# Deploy services
deploy_services() {
    log_info "Restarting services..."

    # Restart services (volumes are preserved)
    docker-compose up -d backend admin-panel web-app

    log_info "Services restarted, waiting for health checks..."
    sleep 5
}

# Health check
health_check() {
    log_info "Running health checks..."

    local max_attempts=30
    local attempt=0

    # Backend health check
    until docker exec metropolitan_backend curl -f http://localhost:3000/health >/dev/null 2>&1 || [ $attempt -eq $max_attempts ]; do
        attempt=$((attempt + 1))
        log_warn "Waiting for backend... Attempt $attempt/$max_attempts"
        sleep 2
    done

    if [ $attempt -eq $max_attempts ]; then
        log_error "Backend health check failed!"
        log_error "Check logs: docker logs metropolitan_backend"
        exit 1
    fi

    log_info "Backend is healthy!"
}

# Cleanup
cleanup() {
    log_info "Cleaning up old Docker images..."
    docker image prune -f

    log_info "Cleaning up old containers..."
    docker container prune -f
}

# Main deployment flow
main() {
    create_backup
    pull_code
    pull_images
    deploy_services
    health_check
    cleanup

    log_info "Deployment completed successfully!"
    log_info "Backend: https://api.metropolitanfg.pl/health"
    echo -e "${GREEN}=== Deployment Finished ===${NC}"
}

# Execute main function
main