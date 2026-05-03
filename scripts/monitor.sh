#!/bin/bash

# Monitoring script for Web Exam System
# Usage: ./scripts/monitor.sh
# Can be run via cron for continuous monitoring

set -e

# Configuration
LOG_FILE="/var/www/exam-system/logs/monitor.log"
ALERT_EMAIL="admin@skoolific.com"  # Update with actual email
API_URL="http://localhost:3000/api/health"
MAX_MEMORY_MB=450
MAX_CPU_PERCENT=80
MAX_DISK_PERCENT=85

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

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

send_alert() {
    local subject="$1"
    local message="$2"
    
    # Log alert
    log_message "ALERT: $subject - $message"
    
    # Send email if mail command is available
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
    fi
}

# Create log file if it doesn't exist
touch "$LOG_FILE"

echo "🔍 Monitoring Web Exam System..."
log_message "Starting monitoring check"

# Check API health
echo "Checking API health..."
if curl -s -f "$API_URL" > /dev/null 2>&1; then
    print_status "API is responding"
    log_message "API health check: OK"
else
    print_error "API is not responding"
    log_message "API health check: FAILED"
    send_alert "Web Exam System - API Down" "The API is not responding at $API_URL"
    
    # Try to restart with PM2
    if command -v pm2 &> /dev/null; then
        print_warning "Attempting to restart with PM2..."
        pm2 restart ecosystem.config.js
        sleep 5
        
        # Check again
        if curl -s -f "$API_URL" > /dev/null 2>&1; then
            print_status "API restarted successfully"
            log_message "API restarted successfully"
            send_alert "Web Exam System - API Recovered" "The API was restarted and is now responding"
        else
            print_error "API restart failed"
            log_message "API restart failed"
            send_alert "Web Exam System - API Restart Failed" "Failed to restart the API"
        fi
    fi
fi

# Check PM2 process
if command -v pm2 &> /dev/null; then
    echo "Checking PM2 process..."
    PM2_STATUS=$(pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null || echo "unknown")
    
    if [ "$PM2_STATUS" = "online" ]; then
        print_status "PM2 process is online"
        log_message "PM2 status: online"
        
        # Check memory usage
        MEMORY_MB=$(pm2 jlist | jq -r '.[0].monit.memory' 2>/dev/null || echo "0")
        MEMORY_MB=$((MEMORY_MB/1024/1024))
        
        if [ "$MEMORY_MB" -gt "$MAX_MEMORY_MB" ]; then
            print_warning "High memory usage: ${MEMORY_MB}MB (threshold: ${MAX_MEMORY_MB}MB)"
            log_message "WARNING: High memory usage: ${MEMORY_MB}MB"
            send_alert "Web Exam System - High Memory Usage" "Memory usage is ${MEMORY_MB}MB, exceeding threshold of ${MAX_MEMORY_MB}MB"
        else
            print_status "Memory usage: ${MEMORY_MB}MB"
        fi
        
        # Check CPU usage
        CPU=$(pm2 jlist | jq -r '.[0].monit.cpu' 2>/dev/null || echo "0")
        
        if [ "$CPU" -gt "$MAX_CPU_PERCENT" ]; then
            print_warning "High CPU usage: ${CPU}% (threshold: ${MAX_CPU_PERCENT}%)"
            log_message "WARNING: High CPU usage: ${CPU}%"
            send_alert "Web Exam System - High CPU Usage" "CPU usage is ${CPU}%, exceeding threshold of ${MAX_CPU_PERCENT}%"
        else
            print_status "CPU usage: ${CPU}%"
        fi
    else
        print_error "PM2 process status: $PM2_STATUS"
        log_message "ERROR: PM2 status: $PM2_STATUS"
        send_alert "Web Exam System - PM2 Process Down" "PM2 process status is $PM2_STATUS"
    fi
fi

# Check database connectivity
echo "Checking database..."
if psql -U exam_user -d exam_system -c "SELECT 1;" &> /dev/null; then
    print_status "Database is accessible"
    log_message "Database check: OK"
else
    print_error "Database is not accessible"
    log_message "ERROR: Database check failed"
    send_alert "Web Exam System - Database Down" "Cannot connect to PostgreSQL database"
fi

# Check disk space
echo "Checking disk space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -gt "$MAX_DISK_PERCENT" ]; then
    print_error "Critical disk usage: ${DISK_USAGE}%"
    log_message "ERROR: Critical disk usage: ${DISK_USAGE}%"
    send_alert "Web Exam System - Critical Disk Space" "Disk usage is ${DISK_USAGE}%, exceeding threshold of ${MAX_DISK_PERCENT}%"
elif [ "$DISK_USAGE" -gt 70 ]; then
    print_warning "Disk usage: ${DISK_USAGE}%"
    log_message "WARNING: Disk usage: ${DISK_USAGE}%"
else
    print_status "Disk usage: ${DISK_USAGE}%"
fi

# Check Nginx
echo "Checking Nginx..."
if systemctl is-active --quiet nginx; then
    print_status "Nginx is running"
    log_message "Nginx check: OK"
else
    print_error "Nginx is not running"
    log_message "ERROR: Nginx is not running"
    send_alert "Web Exam System - Nginx Down" "Nginx web server is not running"
    
    # Try to restart Nginx
    print_warning "Attempting to restart Nginx..."
    systemctl restart nginx
    sleep 2
    
    if systemctl is-active --quiet nginx; then
        print_status "Nginx restarted successfully"
        log_message "Nginx restarted successfully"
        send_alert "Web Exam System - Nginx Recovered" "Nginx was restarted and is now running"
    else
        print_error "Nginx restart failed"
        log_message "ERROR: Nginx restart failed"
        send_alert "Web Exam System - Nginx Restart Failed" "Failed to restart Nginx"
    fi
fi

# Check SSL certificate expiration
if command -v openssl &> /dev/null; then
    echo "Checking SSL certificate..."
    CERT_FILE="/etc/letsencrypt/live/exam.skoolific.com/cert.pem"
    
    if [ -f "$CERT_FILE" ]; then
        EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
        EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
        CURRENT_EPOCH=$(date +%s)
        DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
        
        if [ "$DAYS_UNTIL_EXPIRY" -lt 7 ]; then
            print_error "SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
            log_message "ERROR: SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
            send_alert "Web Exam System - SSL Certificate Expiring" "SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
        elif [ "$DAYS_UNTIL_EXPIRY" -lt 30 ]; then
            print_warning "SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
            log_message "WARNING: SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
        else
            print_status "SSL certificate valid for $DAYS_UNTIL_EXPIRY days"
        fi
    fi
fi

# Check recent errors in logs
echo "Checking recent errors..."
ERROR_COUNT=$(grep -c "ERROR" /var/www/exam-system/logs/api-error.log 2>/dev/null | tail -100 || echo "0")

if [ "$ERROR_COUNT" -gt 10 ]; then
    print_warning "Found $ERROR_COUNT errors in recent logs"
    log_message "WARNING: $ERROR_COUNT errors in recent logs"
fi

echo ""
log_message "Monitoring check completed"
print_status "Monitoring check completed"

# Rotate log file if it's too large (> 10MB)
LOG_SIZE=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo "0")
if [ "$LOG_SIZE" -gt 10485760 ]; then
    mv "$LOG_FILE" "${LOG_FILE}.old"
    touch "$LOG_FILE"
    log_message "Log file rotated"
fi
