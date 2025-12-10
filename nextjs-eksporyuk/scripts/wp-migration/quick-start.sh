#!/bin/bash

echo "🚀 EKSPORYUK MIGRATION - QUICK START"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f "scripts/wp-migration/.env" ]; then
    echo "⚠️  .env file not found!"
    echo ""
    echo "Please create .env file:"
    echo "  cp scripts/wp-migration/.env.example scripts/wp-migration/.env"
    echo ""
    echo "Then edit it with your WordPress database credentials:"
    echo "  WP_DB_HOST=your-vps-ip"
    echo "  WP_DB_USER=your-username"
    echo "  WP_DB_PASSWORD=your-password"
    echo "  WP_DB_NAME=your-database"
    echo ""
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check if mysql2 is installed
if ! node -e "require('mysql2')" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    npm install mysql2 dotenv
    echo ""
fi

echo "📋 Migration Steps:"
echo ""
echo "1️⃣  Extract data from WordPress (100 users)"
echo "   → node scripts/wp-migration/1-extract-sejoli-data.js"
echo ""
echo "2️⃣  Import to Eksporyuk"
echo "   → node scripts/wp-migration/2-import-to-eksporyuk.js extracted-data/sejoli-data-[timestamp].json"
echo ""
echo "3️⃣  Verify migration"
echo "   → node scripts/wp-migration/3-verify-migration.js extracted-data/sejoli-data-[timestamp].json"
echo ""
echo "===================================="
echo "Ready to start? Run step 1 first!"
echo "===================================="
