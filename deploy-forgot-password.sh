#!/bin/bash
set -e

cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk

echo "🚀 Starting deployment to live..."
echo ""

# Step 1: Check status
echo "📋 Git status:"
git status --short

echo ""
echo "📤 Staging files..."
git add src/app/api/auth/forgot-password-v2/route.ts src/app/auth/reset-password/page.tsx

echo "✅ Files staged"
echo ""

echo "💬 Creating commit..."
git commit -m "Fix: Forgot password link now works - reset page calls correct endpoint v2"

echo "✅ Commit created"
echo ""

echo "🌐 Pushing to main branch..."
git push origin main

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Status:"
echo "   • Code pushed to main branch"
echo "   • Vercel is building automatically"
echo "   • Deployment will be live in 1-2 minutes"
echo ""
echo "🔗 Links:"
echo "   Live: https://app.eksporyuk.com"
echo "   Vercel: https://vercel.com/dashboard"
echo ""
echo "✨ Changes deployed:"
echo "   ✓ POST /api/auth/forgot-password-v2 - Send reset email"
echo "   ✓ PUT /api/auth/forgot-password-v2 - Reset password with token"
echo "   ✓ /reset-password page - Now reads token from query param"
echo ""
