#!/bin/bash

echo "🚀 Deploying database fix to production..."
echo ""
echo "⚠️  This will update showInGeneralCheckout for 6bulan-ekspor membership"
echo ""

# Read production database URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set in environment"
  echo "Please set production DATABASE_URL first:"
  echo "export DATABASE_URL='your-production-database-url'"
  exit 1
fi

echo "📊 Production database: ${DATABASE_URL:0:30}..."
echo ""
echo "Running migration script..."

# Run the fix script against production database
node fix-6bulan-checkout.js

echo ""
echo "✅ Done! Check production site: https://eksporyuk.com/checkout/6bulan-ekspor"
