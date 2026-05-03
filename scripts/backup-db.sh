#!/bin/bash

# Database backup script for Web Exam System
# Usage: ./scripts/backup-db.sh

set -e

# Configuration
BACKUP_DIR="/var/backups/exam-system/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="exam_system"
DB_USER="exam_user"
RETENTION_DAYS=30

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup filename
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

print_status "Starting database backup..."
print_status "Database: $DB_NAME"
print_status "Backup file: $BACKUP_FILE"

# Perform backup
if pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    print_status "Database backup completed successfully!"
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_status "Backup size: $BACKUP_SIZE"
else
    print_error "Database backup failed!"
    exit 1
fi

# Remove old backups
print_status "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List recent backups
print_status "Recent backups:"
ls -lh "$BACKUP_DIR" | tail -n 5

print_status "Backup process completed! 🎉"
