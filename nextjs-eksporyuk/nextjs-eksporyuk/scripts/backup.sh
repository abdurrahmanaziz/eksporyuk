#!/bin/bash
# Script backup sederhana - jalankan dari lokal atau CI/CD
# Memerlukan: node, .env.local dengan BLOB_READ_WRITE_TOKEN

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
DB_FILE="$PROJECT_ROOT/database/dev.db"

if [ ! -f "$DB_FILE" ]; then
  echo "❌ Database file tidak ditemukan: $DB_FILE"
  exit 1
fi

echo "🔄 Backup database ke Vercel Blob..."

# Jalankan Node script yang handle Blob upload
node "$SCRIPT_DIR/backup-to-blob-local.js"

if [ $? -eq 0 ]; then
  echo "✅ Backup selesai!"
else
  echo "❌ Backup gagal"
  exit 1
fi
