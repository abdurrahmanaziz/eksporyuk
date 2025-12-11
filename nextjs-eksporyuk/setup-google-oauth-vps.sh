#!/bin/bash

# Setup Google OAuth on VPS
# This script will:
# 1. Pull latest code
# 2. Add Google OAuth env vars
# 3. Build and restart

set -e

echo "🚀 Starting Google OAuth setup on VPS..."

# Detect current directory
if [ -f "package.json" ]; then
    echo "📍 Already in project directory"
elif [ -d "/home/eksporyuk/eksporyuk/nextjs-eksporyuk" ]; then
    cd /home/eksporyuk/eksporyuk/nextjs-eksporyuk
elif [ -d "/var/www/eksporyuk/nextjs-eksporyuk" ]; then
    cd /var/www/eksporyuk/nextjs-eksporyuk
else
    echo "❌ Cannot find project directory"
    exit 1
fi

echo "📥 Pulling latest code..."
git pull origin main 2>/dev/null || echo "⚠️ Git pull skipped (already up to date or not a git repo)"

echo "🔑 Adding Google OAuth environment variables..."

# Check if .env exists, create if not
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    touch .env
fi

# Remove old Google OAuth vars if exist
sed -i '/GOOGLE_CLIENT_ID/d' .env
sed -i '/GOOGLE_CLIENT_SECRET/d' .env

# Add new vars
echo 'GOOGLE_CLIENT_ID="805480551537-b89th9psujgarmr8atcj140j9q353eb.apps.googleusercontent.com"' >> .env
echo 'GOOGLE_CLIENT_SECRET="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"' >> .env

echo "✅ Environment variables added"

echo "🔨 Building application..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart eksporyuk

echo ""
echo "✅ Google OAuth setup complete!"
echo ""
echo "🧪 Test it at: https://app.eksporyuk.com/auth/login"
echo "📊 Check status: https://app.eksporyuk.com/admin/integrations"
echo ""
