#!/bin/bash

# Complete Fix Deployment Script
# Uploads all fixed files and rebuilds in single SSH session

set -e

SERVER="eksporyuk@157.10.253.103"
REMOTE_PATH="~/eksporyuk/nextjs-eksporyuk"
LOCAL_PATH="/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk"

echo "=========================================="
echo "COMPLETE FIX DEPLOYMENT"
echo "=========================================="
echo ""

# Check server connectivity
echo "Step 0: Checking server connection..."
echo "----------------------------------------"
if ! ping -c 1 157.10.253.103 &> /dev/null; then
  echo "❌ Server not reachable!"
  echo "Please restart server via CloudPanel: https://157.10.253.103:8443"
  exit 1
fi
echo "✅ Server is reachable"

# Create tar of all fixed files
echo ""
echo "Step 1: Packaging fixed files..."
echo "----------------------------------------"

cd "$LOCAL_PATH"

# List of all files that were fixed
tar -cvzf /tmp/fixes.tar.gz \
  src/components/groups/GroupSidebar.tsx \
  src/components/layout/ChatBadge.tsx \
  src/components/layout/NotificationBell.tsx \
  src/components/layout/ChatBell.tsx \
  src/components/layout/DashboardSidebar.tsx \
  src/components/presence/OnlineStatusProvider.tsx \
  src/components/presence/OnlineStatusBadge.tsx \
  src/app/\(dashboard\)/notifications/page.tsx \
  src/app/\(dashboard\)/chat/page.tsx \
  src/app/\(dashboard\)/admin/page.tsx \
  src/hooks/use-api.ts

echo "✅ Package created: $(du -h /tmp/fixes.tar.gz | cut -f1)"

# Upload in single connection
echo ""
echo "Step 2: Uploading to server..."
echo "----------------------------------------"

scp /tmp/fixes.tar.gz $SERVER:/tmp/fixes.tar.gz
echo "✅ Upload complete"

# Extract and rebuild on server
echo ""
echo "Step 3: Extracting and rebuilding on server..."
echo "----------------------------------------"

ssh $SERVER << 'REMOTE_COMMANDS'
set -e

cd ~/eksporyuk/nextjs-eksporyuk

echo "  → Extracting files..."
tar -xvzf /tmp/fixes.tar.gz

echo ""
echo "  → Stopping PM2..."
pm2 stop eksporyuk || true

echo ""
echo "  → Building application..."
npm run build

echo ""
echo "  → Starting PM2..."
pm2 start eksporyuk
pm2 save

echo ""
echo "  → Checking status..."
pm2 status
sleep 3
pm2 logs eksporyuk --lines 5 --nostream

rm /tmp/fixes.tar.gz
REMOTE_COMMANDS

echo ""
echo "Step 4: Testing website..."
echo "----------------------------------------"

sleep 3
HOMEPAGE=$(curl -s -o /dev/null -w "%{http_code}" https://app.eksporyuk.com/)
ADMIN=$(curl -s -o /dev/null -w "%{http_code}" https://app.eksporyuk.com/admin)

echo "  → Homepage: HTTP ${HOMEPAGE}"
echo "  → Admin: HTTP ${ADMIN}"

if [ "$HOMEPAGE" = "200" ]; then
  echo ""
  echo "=========================================="
  echo "✅ DEPLOYMENT COMPLETE!"
  echo "=========================================="
  echo ""
  echo "🌐 Website: https://app.eksporyuk.com"
  echo ""
  echo "Next steps:"
  echo "1. Clear browser cache (Cmd+Shift+R)"
  echo "2. Login to admin"
  echo "3. Check console - no more Pusher errors!"
else
  echo ""
  echo "⚠️ Website returned HTTP $HOMEPAGE"
  echo "Please check server logs"
fi

# Cleanup
rm /tmp/fixes.tar.gz
