#!/bin/bash

# Restart Development Server dengan clean cache

echo "=== Restarting Development Server ==="
echo ""

cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk

# Kill existing dev server
echo "🛑 Stopping existing dev server..."
pkill -f "next dev" || echo "No running dev server found"

# Clean cache
echo "🧹 Cleaning Next.js cache..."
rm -rf .next

# Regenerate Prisma Client
echo "🔄 Regenerating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Ready to start!"
echo ""
echo "To start dev server, run:"
echo "  npm run dev"
echo ""
