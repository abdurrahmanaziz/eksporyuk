#!/bin/bash

# Quick Deploy - Upload Changed Files Only
# Gunakan ini untuk fix kecil (ubah beberapa file saja)

set -e

SERVER="eksporyuk@157.10.253.103"
REMOTE_PATH="~/eksporyuk/nextjs-eksporyuk"

echo "=========================================="
echo "QUICK DEPLOY - FILES ONLY"
echo "=========================================="
echo ""

# =============================================
# EDIT DI SINI: Daftar file yang mau diupload
# =============================================
FILES_TO_UPLOAD=(
  # Contoh:
  # "src/app/(dashboard)/admin/page.tsx"
  # "src/components/layout/ChatBadge.tsx"
  # "src/hooks/use-api.ts"
)

# Cek apakah ada file yang di-specify
if [ ${#FILES_TO_UPLOAD[@]} -eq 0 ]; then
  echo "⚠️  Belum ada file yang di-specify!"
  echo ""
  echo "Cara pakai:"
  echo "1. Edit script ini (deploy-quick.sh)"
  echo "2. Tambahkan file yang diubah ke array FILES_TO_UPLOAD:"
  echo ""
  echo "   FILES_TO_UPLOAD=("
  echo "     \"src/components/SomeComponent.tsx\""
  echo "     \"src/app/some/page.tsx\""
  echo "   )"
  echo ""
  echo "3. Jalankan: ./deploy-quick.sh"
  echo ""
  exit 1
fi

echo "File yang akan diupload:"
for file in "${FILES_TO_UPLOAD[@]}"; do
  echo "  • ${file}"
done
echo ""

read -p "Lanjutkan upload? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Dibatalkan"
  exit 1
fi

echo ""
echo "Step 1: Upload files ke server..."
echo "----------------------------------------"

for file in "${FILES_TO_UPLOAD[@]}"; do
  if [ ! -f "${file}" ]; then
    echo "⚠️  File tidak ditemukan: ${file}"
    continue
  fi
  
  echo "  → Uploading ${file}..."
  
  # Buat direktori remote jika belum ada
  remote_dir=$(dirname "${file}")
  ssh ${SERVER} "mkdir -p ${REMOTE_PATH}/${remote_dir}"
  
  # Upload file
  scp "${file}" ${SERVER}:${REMOTE_PATH}/"${file}"
done

echo "✅ Upload selesai!"

echo ""
echo "Step 2: Restart PM2..."
echo "----------------------------------------"

ssh ${SERVER} << 'EOF'
cd ~/eksporyuk/nextjs-eksporyuk
pm2 restart eksporyuk
sleep 2
pm2 status
EOF

echo ""
echo "Step 3: Test website..."
echo "----------------------------------------"

sleep 2
HOMEPAGE=$(curl -s -o /dev/null -w "%{http_code}" https://app.eksporyuk.com/)
ADMIN=$(curl -s -o /dev/null -w "%{http_code}" https://app.eksporyuk.com/admin)

echo "  → Homepage: HTTP ${HOMEPAGE}"
echo "  → Admin: HTTP ${ADMIN}"

echo ""
echo "=========================================="
echo "✅ QUICK DEPLOY SELESAI!"
echo "=========================================="
echo ""
echo "🌐 Website: https://app.eksporyuk.com"
echo ""
echo "Next: Clear cache browser (Cmd+Shift+R)"
echo ""
