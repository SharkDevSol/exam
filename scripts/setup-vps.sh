#!/bin/bash

# VPS Setup Script for Web Exam System
# Usage: sudo ./scripts/setup-vps.sh
# VPS IP: 76.13.48.245
# Domain: exam.skoolific.com

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

echo "🚀 Starting VPS setup for Web Exam System..."
echo ""

# Update system packages
print_status "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Node.js 20.x
print_status "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js version: $NODE_VERSION"
print_status "npm version: $NPM_VERSION"

# Install PostgreSQL
print_status "Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql
print_status "PostgreSQL installed and started"

# Install Nginx
print_status "Installing Nginx..."
apt-get install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx
print_status "Nginx installed and started"

# Install PM2 globally
print_status "Installing PM2..."
npm install -g pm2

# Setup PM2 startup script
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER
print_status "PM2 installed and configured"

# Install Certbot for Let's Encrypt
print_status "Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx

# Install other utilities
print_status "Installing additional utilities..."
apt-get install -y git curl wget unzip jq

# Configure firewall (UFW)
print_status "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 5432/tcp  # PostgreSQL (only if needed for remote access)
print_status "Firewall configured"

# Create application directory
APP_DIR="/var/www/exam-system"
print_status "Creating application directory: $APP_DIR"
mkdir -p "$APP_DIR"
chown -R $SUDO_USER:$SUDO_USER "$APP_DIR"

# Create backup directory
BACKUP_DIR="/var/backups/exam-system"
print_status "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR/database"
chown -R $SUDO_USER:$SUDO_USER "$BACKUP_DIR"

# Create logs directory
LOG_DIR="$APP_DIR/logs"
print_status "Creating logs directory: $LOG_DIR"
mkdir -p "$LOG_DIR"
chown -R $SUDO_USER:$SUDO_USER "$LOG_DIR"

# Setup PostgreSQL database and user
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql <<EOF
-- Create database user
CREATE USER exam_user WITH PASSWORD 'CHANGE_THIS_PASSWORD';

-- Create database
CREATE DATABASE exam_system OWNER exam_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE exam_system TO exam_user;

-- Connect to database and grant schema privileges
\c exam_system
GRANT ALL ON SCHEMA public TO exam_user;
EOF

print_status "PostgreSQL database and user created"

# Create certbot directory for Let's Encrypt verification
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot

print_status "Certbot directory created"

echo ""
print_status "VPS setup completed! 🎉"
echo ""
print_warning "Next steps:"
echo "1. Update PostgreSQL password in /var/www/exam-system/api/.env.production"
echo "2. Generate JWT and SESSION secrets using: openssl rand -base64 32"
echo "3. Clone your repository to $APP_DIR"
echo "4. Copy Nginx configuration: sudo cp $APP_DIR/nginx/exam.skoolific.com.conf /etc/nginx/sites-available/"
echo "5. Enable Nginx site: sudo ln -s /etc/nginx/sites-available/exam.skoolific.com.conf /etc/nginx/sites-enabled/"
echo "6. Test Nginx config: sudo nginx -t"
echo "7. Obtain SSL certificate: sudo certbot --nginx -d exam.skoolific.com"
echo "8. Run deployment script: cd $APP_DIR && ./scripts/deploy.sh"
echo "9. Setup database backup cron job: crontab -e"
echo "   Add: 0 2 * * * /var/www/exam-system/scripts/backup-db.sh"
echo ""
