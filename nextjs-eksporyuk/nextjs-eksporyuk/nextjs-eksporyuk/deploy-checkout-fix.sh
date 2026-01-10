#!/bin/bash

# Deploy Checkout API Error Fix - December 22, 2024
# Fixes 500 error in /api/checkout/simple

set -e

SERVER="eksporyuk@157.10.253.103"
REMOTE_PATH="~/eksporyuk/nextjs-eksporyuk"

echo "=========================================="
echo "DEPLOYING CHECKOUT FIX"
echo "=========================================="
echo ""

# Files to upload
FILES_TO_UPLOAD=(
  "src/app/api/checkout/simple/route.ts"
  "src/lib/invoice-generator.ts"
)

echo "📦 Files to deploy:"
for file in "${FILES_TO_UPLOAD[@]}"; do
  echo "   - $file"
done
echo ""

# Upload files
echo "🚀 Uploading files to server..."
for file in "${FILES_TO_UPLOAD[@]}"; do
  echo "   Uploading: $file"
  # Create directory if needed
  DIR=$(dirname "$file")
  ssh $SERVER "mkdir -p $REMOTE_PATH/$DIR"
  
  # Upload file
  scp "$file" "$SERVER:$REMOTE_PATH/$file"
done

echo ""
echo "✅ Files uploaded successfully!"
echo ""

# Rebuild on server
echo "🔨 Rebuilding on server..."
ssh $SERVER << 'EOF'
  cd ~/eksporyuk/nextjs-eksporyuk
  
  echo "📦 Installing dependencies (if needed)..."
  npm install --prefer-offline --no-audit
  
  echo "🔨 Building Next.js app..."
  npm run build
  
  echo "♻️  Restarting PM2..."
  pm2 restart eksporyuk-nextjs || pm2 start npm --name "eksporyuk-nextjs" -- start
  
  echo "✅ Deployment complete!"
EOF

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT SUCCESSFUL"
echo "=========================================="
echo ""
echo "Changes deployed:"
echo "  - Enhanced error logging in checkout API"
echo "  - Optimized invoice generation"
echo "  - Better error handling for Xendit calls"
echo ""
echo "Monitor logs with:"
echo "  ssh $SERVER"
echo "  pm2 logs eksporyuk-nextjs"
echo ""
