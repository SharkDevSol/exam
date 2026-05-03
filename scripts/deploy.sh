#!/bin/bash

# Deployment script for Web Exam System
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Starting deployment process..."

# Configuration
APP_DIR="/var/www/exam-system"
BACKUP_DIR="/var/backups/exam-system"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root"
    exit 1
fi

# Navigate to application directory
cd "$APP_DIR" || exit 1
print_status "Changed to application directory: $APP_DIR"

# Pull latest code from repository
print_status "Pulling latest code from GitHub..."
git fetch origin
git pull origin main

# Install dependencies
print_status "Installing dependencies..."
npm install --production=false

# Build backend
print_status "Building backend..."
cd api
npm run build
cd ..

# Build frontend
print_status "Building frontend..."
cd app
npm run build
cd ..

# Run database migrations
print_status "Running database migrations..."
cd api
npm run migrate
cd ..

# Restart application with PM2
print_status "Restarting application..."
pm2 restart ecosystem.config.js

# Wait for application to start
sleep 5

# Health check
print_status "Performing health check..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)

if [ "$HEALTH_CHECK" -eq 200 ]; then
    print_status "Health check passed! Application is running."
else
    print_error "Health check failed! HTTP status: $HEALTH_CHECK"
    print_warning "Rolling back..."
    pm2 restart ecosystem.config.js
    exit 1
fi

# Save PM2 process list
pm2 save

print_status "Deployment completed successfully! 🎉"
print_status "Timestamp: $TIMESTAMP"

# Show PM2 status
pm2 status
