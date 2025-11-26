#!/bin/bash

# Database Restore Script for Calendar CRM
# This script restores a backup of the Supabase database

set -e  # Exit on error

# Configuration
BACKUP_DIR="./backups"

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

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    log_error "Backup directory does not exist: $BACKUP_DIR"
    exit 1
fi

# List available backups
log_info "Available backups:"
echo ""
backups=($(ls -t "$BACKUP_DIR"/calendar-crm-backup-*.sql.gz 2>/dev/null))

if [ ${#backups[@]} -eq 0 ]; then
    log_error "No backups found in $BACKUP_DIR"
    exit 1
fi

# Display backups with numbers
for i in "${!backups[@]}"; do
    backup_file=$(basename "${backups[$i]}")
    backup_size=$(du -h "${backups[$i]}" | cut -f1)
    echo "  $((i+1)). $backup_file ($backup_size)"
done

echo ""
read -p "Select backup number to restore (or 'q' to quit): " selection

if [ "$selection" = "q" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Validate selection
if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt ${#backups[@]} ]; then
    log_error "Invalid selection"
    exit 1
fi

# Get selected backup
selected_backup="${backups[$((selection-1))]}"
log_info "Selected backup: $(basename "$selected_backup")"

# Warning
echo ""
log_warn "⚠️  WARNING: This will overwrite your current database!"
log_warn "⚠️  Make sure you have a recent backup before proceeding."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Decompress backup
log_info "Decompressing backup..."
temp_file="${selected_backup%.gz}"
gunzip -c "$selected_backup" > "$temp_file"

# Restore database
log_info "Restoring database..."
if supabase db reset --db-url "$(supabase status | grep 'DB URL' | awk '{print $3}')"; then
    if psql "$(supabase status | grep 'DB URL' | awk '{print $3}')" < "$temp_file"; then
        log_info "✅ Database restored successfully!"
    else
        log_error "❌ Database restore failed!"
        rm -f "$temp_file"
        exit 1
    fi
else
    log_error "❌ Database reset failed!"
    rm -f "$temp_file"
    exit 1
fi

# Clean up temp file
rm -f "$temp_file"

log_info "✅ Restore process completed!"
