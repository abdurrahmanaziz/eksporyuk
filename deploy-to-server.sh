#!/bin/bash
# Deploy Script untuk Eksporyuk ke CloudPanel
# Jalankan: ./deploy-to-server.sh

set -e

echo "🚀 Starting deployment to eksporyuk@157.10.253.103..."

# 1. Clone atau pull repository
echo "📦 Cloning/updating repository..."
if [ -d "eksporyuk" ]; then
  cd eksporyuk
  git pull origin main
else
  git clone https://github.com/abdurrahmanaziz/eksporyuk.git
  cd eksporyuk
fi

# 2. Masuk ke folder Next.js
cd nextjs-eksporyuk

# 3. Install dependencies
echo "📥 Installing dependencies..."
npm install

# 4. Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# 5. Build aplikasi
echo "🏗️ Building application..."
npm run build

# 6. Setup PM2
echo "⚡ Setting up PM2..."
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi

# 7. Start/Restart dengan PM2
if pm2 list | grep -q "eksporyuk"; then
  echo "🔄 Restarting eksporyuk..."
  pm2 restart eksporyuk
else
  echo "🚀 Starting eksporyuk..."
  pm2 start npm --name "eksporyuk" -- start
fi

pm2 save

echo ""
echo "✅ Deployment complete!"
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🔍 To view logs: pm2 logs eksporyuk"
echo "🌐 App should be running on port 3000"
