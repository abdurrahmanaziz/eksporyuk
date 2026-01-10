#!/bin/bash

# WORDPRESS TO EKSPORYUK MIGRATION
# =================================
# Quick start script for local migration testing

echo "🚀 WORDPRESS MIGRATION - QUICK START"
echo "====================================="
echo ""

# Check if .env.wp exists
if [ ! -f ".env.wp" ]; then
    echo "❌ Error: .env.wp not found"
    echo ""
    echo "📝 Please create .env.wp with your WordPress credentials:"
    echo "   cp .env.wp.example .env.wp"
    echo "   nano .env.wp  # Edit with your credentials"
    exit 1
fi

# Check if SSH tunnel is needed
if grep -q "127.0.0.1" .env.wp || grep -q "localhost" .env.wp; then
    echo "🔌 SSH Tunnel Required"
    echo "   Run this in another terminal:"
    echo "   ssh -L 3306:localhost:3306 eksporyuk@103.125.181.47"
    echo ""
    read -p "   SSH tunnel ready? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "⏸️  Waiting for SSH tunnel... Run migration manually when ready."
        exit 1
    fi
fi

echo ""
echo "📊 Step 1: Extract WordPress Data (100 users)"
echo "----------------------------------------------"
node scripts/migration/extract-sejoli-data.js

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Extraction failed. Check:"
    echo "   - SSH tunnel is running"
    echo "   - .env.wp credentials are correct"
    echo "   - MySQL is accessible"
    exit 1
fi

# Find latest export file
EXPORT_FILE=$(ls -t scripts/migration/wp-data/sejoli-export-*.json 2>/dev/null | head -1)

if [ -z "$EXPORT_FILE" ]; then
    echo "❌ No export file found"
    exit 1
fi

echo ""
echo "✅ Export successful: $EXPORT_FILE"
echo ""
echo "📊 Step 2: Preview Import (Dry Run)"
echo "------------------------------------"
node scripts/migration/import-to-eksporyuk.js --file="$EXPORT_FILE" --dry-run

echo ""
read -p "Continue with actual import? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📊 Step 3: Import to Eksporyuk"
    echo "-------------------------------"
    node scripts/migration/import-to-eksporyuk.js --file="$EXPORT_FILE"
    
    echo ""
    echo "📊 Step 4: Verify Migration"
    echo "---------------------------"
    node scripts/migration/verify-migration.js --file="$EXPORT_FILE"
    
    echo ""
    echo "✅ MIGRATION COMPLETED!"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Test login: http://localhost:3000/auth/login"
    echo "   2. Default password for migrated users: eksporyuk2024"
    echo "   3. Check affiliate dashboard: http://localhost:3000/affiliate"
    echo "   4. Verify wallet balances"
    echo ""
    echo "📁 Export saved: $EXPORT_FILE"
else
    echo ""
    echo "⏸️  Import cancelled. Run manually when ready:"
    echo "   node scripts/migration/import-to-eksporyuk.js --file=$EXPORT_FILE"
fi
