#!/bin/bash

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "🚀 DEPLOYING FORGOT PASSWORD FIX TO PRODUCTION"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1. Checking git status...${NC}"
git status

echo ""
echo -e "${BLUE}2. Staging changed files...${NC}"
git add src/app/api/auth/forgot-password-v2/route.ts
git add src/app/auth/reset-password/page.tsx

echo ""
echo -e "${BLUE}3. Creating commit...${NC}"
git commit -m "Fix: Forgot password link now works - reset page calls correct endpoint (v2) with query parameter token handling"

echo ""
echo -e "${BLUE}4. Pushing to main branch (Vercel will auto-deploy)...${NC}"
git push origin main

echo ""
echo -e "${GREEN}✅ DEPLOYMENT INITIATED!${NC}"
echo ""
echo "Vercel deployment status:"
echo "  - Monitor at: https://vercel.com/abdurrahmanaziz/eksporyuk"
echo "  - Live site: https://app.eksporyuk.com"
echo ""
echo "Changes deployed:"
echo "  ✅ /src/app/api/auth/forgot-password-v2/route.ts (POST + PUT handlers)"
echo "  ✅ /src/app/auth/reset-password/page.tsx (calls v2 endpoint)"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
