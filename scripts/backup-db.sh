#!/bin/bash

# Database Backup Script for Calendar CRM
# This script creates a backup of the Supabase database

set -e  # Exit on error

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="calendar-crm-backup-${DATE}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI is not installed"
    log_info "Install it with: npm install -g supabase"
    exit 1
fi

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    log_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    log_error "Supabase project is not linked"
    log_info "Link your project with: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

# Create backup
log_info "Starting database backup..."
log_info "Backup file: $BACKUP_PATH"

if supabase db dump -f "$BACKUP_PATH"; then
    log_info "✅ Backup completed successfully!"
    
    # Get file size
    FILE_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    log_info "Backup size: $FILE_SIZE"
    
    # Compress backup
    log_info "Compressing backup..."
    gzip "$BACKUP_PATH"
    COMPRESSED_SIZE=$(du -h "${BACKUP_PATH}.gz" | cut -f1)
    log_info "Compressed size: $COMPRESSED_SIZE"
    
    # Clean up old backups (keep last 7 days)
    log_info "Cleaning up old backups (keeping last 7 days)..."
    find "$BACKUP_DIR" -name "calendar-crm-backup-*.sql.gz" -mtime +7 -delete
    
    log_info "✅ Backup process completed!"
    log_info "Backup location: ${BACKUP_PATH}.gz"
else
    log_error "❌ Backup failed!"
    exit 1
fi
