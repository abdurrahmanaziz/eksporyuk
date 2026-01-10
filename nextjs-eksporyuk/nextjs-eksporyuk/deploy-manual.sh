#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 MANUAL DEPLOYMENT TO VERCEL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk

echo "📋 Step 1: Checking git status..."
git status --short

echo ""
echo "📋 Step 2: Latest commits..."
git log --oneline -3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 DEPLOYMENT OPTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 1: RECOMMENDED - Vercel Dashboard (Web)"
echo "   👉 https://vercel.com/ekspor-yuks-projects/eksporyuk"
echo "   1. Klik tab 'Deployments'"
echo "   2. Pilih deployment terakhir yang READY"
echo "   3. Klik [...] → Redeploy"
echo ""
echo "Option 2: Build local + Deploy (slower)"
echo "   Command: npm run build && vercel --prod --prebuilt"
echo ""
echo "Option 3: Direct upload with archive (very slow)"
echo "   Command: vercel --prod --archive=tgz"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Pilih opsi (1/2/3) atau Enter untuk skip: " choice

case $choice in
  1)
    echo "Opening Vercel Dashboard..."
    open "https://vercel.com/ekspor-yuks-projects/eksporyuk/deployments"
    ;;
  2)
    echo "Building locally first..."
    npm run build
    if [ $? -eq 0 ]; then
      echo "Build successful! Deploying to Vercel..."
      vercel --prod --prebuilt
    else
      echo "Build failed! Please fix errors first."
      exit 1
    fi
    ;;
  3)
    echo "Deploying with archive (this will take 5-10 minutes)..."
    vercel --prod --archive=tgz
    ;;
  *)
    echo "Skipped. Manual deployment via dashboard recommended."
    echo "Visit: https://vercel.com/ekspor-yuks-projects/eksporyuk"
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Check deployment status:"
echo "vercel ls --prod | head -10"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
