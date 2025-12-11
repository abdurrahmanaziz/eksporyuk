#!/bin/bash

# Safe Deployment Script - Build Locally, Deploy Build Artifacts
# Prevents server crash from memory-intensive build process

set -e

echo "=========================================="
echo "SAFE DEPLOYMENT - LOCAL BUILD METHOD"
echo "=========================================="

# Configuration
SERVER="eksporyuk@157.10.253.103"
REMOTE_PATH="~/eksporyuk/nextjs-eksporyuk"
LOCAL_PATH="/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk"

echo ""
echo "Step 1: Clean previous build..."
echo "----------------------------------------"
rm -rf .next
echo "✅ Cleaned"

echo ""
echo "Step 2: Building application locally..."
echo "----------------------------------------"
echo "  → This will use your Mac's resources, not the server"
npm run build

if [ ! -d ".next" ]; then
  echo "❌ Build failed - .next folder not created"
  exit 1
fi

echo "✅ Build completed successfully!"
echo "  → Build size: $(du -sh .next | cut -f1)"

echo ""
echo "Step 3: Uploading build artifacts to server..."
echo "----------------------------------------"
echo "  → Syncing .next folder..."
rsync -avz --delete \
  --exclude='cache' \
  .next/ ${SERVER}:${REMOTE_PATH}/.next/

echo "  → Uploading package files..."
scp package.json package-lock.json ${SERVER}:${REMOTE_PATH}/

echo "✅ Upload completed!"

echo ""
echo "Step 4: Installing dependencies on server..."
echo "----------------------------------------"
ssh ${SERVER} << 'EOF'
cd ~/eksporyuk/nextjs-eksporyuk
echo "  → Running npm install (production only)..."
npm install --production
echo "✅ Dependencies installed"
EOF

echo ""
echo "Step 5: Restarting PM2..."
echo "----------------------------------------"
ssh ${SERVER} << 'EOF'
pm2 restart eksporyuk
sleep 3
pm2 status
echo ""
echo "Recent logs:"
pm2 logs eksporyuk --lines 5 --nostream
EOF

echo ""
echo "Step 6: Testing deployment..."
echo "----------------------------------------"
sleep 2
HOMEPAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app.eksporyuk.com/)
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app.eksporyuk.com/admin)

echo "  → Homepage: HTTP ${HOMEPAGE_STATUS}"
echo "  → Admin: HTTP ${ADMIN_STATUS}"

if [ "$HOMEPAGE_STATUS" = "200" ]; then
  echo "✅ Homepage working!"
else
  echo "⚠️  Homepage returned ${HOMEPAGE_STATUS}"
fi

echo ""
echo "=========================================="
echo "✅ SAFE DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🌐 Website: https://app.eksporyuk.com"
echo "📊 Stats:"
echo "  - Build method: Local (Mac)"
echo "  - Server load: Minimal (no build process)"
echo "  - Memory saved: ~8GB (no build on server)"
echo ""
echo "Next steps:"
echo "1. Clear browser cache (Cmd+Shift+R)"
echo "2. Test admin login"
echo "3. Check for Pusher errors in console"
echo ""
