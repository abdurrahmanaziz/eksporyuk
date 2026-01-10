#!/bin/bash

echo "=========================================="
echo "DEPLOYING FIXES TO PRODUCTION SERVER"
echo "=========================================="

SERVER="eksporyuk@157.10.253.103"
PROJECT_PATH="~/eksporyuk/nextjs-eksporyuk"

echo ""
echo "Step 1: Uploading fixed files to server..."
echo "----------------------------------------"

# Upload admin page
echo "  → Uploading admin/page.tsx..."
scp "src/app/(dashboard)/admin/page.tsx" "$SERVER:$PROJECT_PATH/src/app/(dashboard)/admin/" || {
  echo "❌ Failed to upload admin page"
  exit 1
}

# Upload hooks
echo "  → Uploading use-api.ts..."
scp "src/hooks/use-api.ts" "$SERVER:$PROJECT_PATH/src/hooks/" || {
  echo "❌ Failed to upload hooks"
  exit 1
}

# Upload presence components
echo "  → Uploading OnlineStatusProvider.tsx..."
scp "src/components/presence/OnlineStatusProvider.tsx" "$SERVER:$PROJECT_PATH/src/components/presence/" || {
  echo "❌ Failed to upload OnlineStatusProvider"
  exit 1
}

echo "  → Uploading OnlineStatusBadge.tsx..."
scp "src/components/presence/OnlineStatusBadge.tsx" "$SERVER:$PROJECT_PATH/src/components/presence/" || {
  echo "❌ Failed to upload OnlineStatusBadge"
  exit 1
}

echo "✅ All files uploaded successfully!"

echo ""
echo "Step 2: Rebuilding application on server..."
echo "----------------------------------------"

ssh "$SERVER" << 'ENDSSH'
cd ~/eksporyuk/nextjs-eksporyuk

echo "  → Building Next.js application..."
npm run build 2>&1 | tail -30

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build completed successfully!"

echo ""
echo "Step 3: Restarting PM2..."
echo "----------------------------------------"

pm2 restart eksporyuk
sleep 3
pm2 list

echo ""
echo "Step 4: Checking application logs..."
echo "----------------------------------------"

pm2 logs eksporyuk --lines 10 --nostream | grep -v "PUSHER.*Trigger error"

ENDSSH

if [ $? -eq 0 ]; then
  echo ""
  echo "=========================================="
  echo "✅ DEPLOYMENT SUCCESSFUL!"
  echo "=========================================="
  echo ""
  echo "🌐 Website: https://app.eksporyuk.com/admin"
  echo "📊 Server: 157.10.253.103"
  echo ""
  echo "Next steps:"
  echo "1. Clear browser cache (Cmd+Shift+R)"
  echo "2. Login with: admin@eksporyuk.com / password123"
  echo "3. Check that no errors appear in console"
  echo ""
else
  echo ""
  echo "=========================================="
  echo "❌ DEPLOYMENT FAILED"
  echo "=========================================="
  exit 1
fi
