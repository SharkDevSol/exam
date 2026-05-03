#!/bin/bash

# Health check script for Web Exam System
# Usage: ./scripts/health-check.sh

set -e

# Configuration
API_URL="http://localhost:3000/api/health"
TIMEOUT=10

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

echo "🏥 Running health checks..."
echo ""

# Check API health endpoint
echo "Checking API health endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$API_URL" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    print_status "API health check passed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
else
    print_error "API health check failed (HTTP $HTTP_CODE)"
    exit 1
fi

echo ""

# Check PM2 process status
echo "Checking PM2 process status..."
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null || echo "unknown")
    
    if [ "$PM2_STATUS" = "online" ]; then
        print_status "PM2 process is online"
        
        # Get process details
        UPTIME=$(pm2 jlist | jq -r '.[0].pm2_env.pm_uptime' 2>/dev/null || echo "unknown")
        MEMORY=$(pm2 jlist | jq -r '.[0].monit.memory' 2>/dev/null || echo "unknown")
        CPU=$(pm2 jlist | jq -r '.[0].monit.cpu' 2>/dev/null || echo "unknown")
        
        echo "  Uptime: $(date -d @$((UPTIME/1000)) -u +%H:%M:%S 2>/dev/null || echo 'N/A')"
        echo "  Memory: $((MEMORY/1024/1024))MB"
        echo "  CPU: ${CPU}%"
    else
        print_error "PM2 process status: $PM2_STATUS"
        exit 1
    fi
else
    print_warning "PM2 not found, skipping process check"
fi

echo ""

# Check database connectivity
echo "Checking database connectivity..."
if command -v psql &> /dev/null; then
    if psql -U exam_user -d exam_system -c "SELECT 1;" &> /dev/null; then
        print_status "Database connection successful"
    else
        print_error "Database connection failed"
        exit 1
    fi
else
    print_warning "psql not found, skipping database check"
fi

echo ""

# Check disk space
echo "Checking disk space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    print_status "Disk usage: ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -lt 90 ]; then
    print_warning "Disk usage: ${DISK_USAGE}% (Warning: approaching limit)"
else
    print_error "Disk usage: ${DISK_USAGE}% (Critical: disk almost full)"
fi

echo ""

# Check Nginx status
echo "Checking Nginx status..."
if command -v nginx &> /dev/null; then
    if systemctl is-active --quiet nginx; then
        print_status "Nginx is running"
    else
        print_error "Nginx is not running"
        exit 1
    fi
else
    print_warning "Nginx not found, skipping Nginx check"
fi

echo ""
print_status "All health checks completed! 🎉"
