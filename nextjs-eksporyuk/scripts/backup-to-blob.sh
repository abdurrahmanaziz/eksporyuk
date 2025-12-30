#!/bin/bash
# Manual backup script - jalankan lokal untuk backup ke Vercel Blob

BACKUP_DIR="./backups"
PROD_URL="https://eksporyuk.com"
CRON_SECRET="${CRON_SECRET}"

echo "🔄 Memulai backup database ke Vercel Blob..."

# Jika punya CRON_SECRET, gunakan untuk trigger
if [ -n "$CRON_SECRET" ]; then
  RESPONSE=$(curl -s -X POST \
    "$PROD_URL/api/cron/backup-to-blob" \
    -H "Authorization: Bearer $CRON_SECRET")
else
  # Tanpa secret (jika endpoint public)
  RESPONSE=$(curl -s -X POST \
    "$PROD_URL/api/cron/backup-to-blob")
fi

echo "✅ Response:"
echo "$RESPONSE" | jq .

echo ""
echo "📝 Catatan:"
echo "- Backup disimpan di Vercel Blob dengan nama: database-backup-YYYY-MM-DD.db"
echo "- Cron job otomatis: setiap hari jam 2 pagi UTC (09:00 WIB)"
echo "- Untuk akses backup, gunakan Vercel Dashboard → Storage → Blob"
