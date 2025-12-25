#!/bin/bash
# Script to start Next.js dev server from correct directory

cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk

echo "📍 Current directory: $(pwd)"
echo "🔍 Checking Next.js installation..."
npx next --version

echo ""
echo "🚀 Starting Next.js development server..."
echo "   URL: http://localhost:3000"
echo "   Admin Login: admin@eksporyuk.com / admin123"
echo ""
echo "📊 Check browser console for [SIDEBAR DEBUG] logs"
echo ""

npx next dev --port 3000
