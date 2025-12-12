#!/bin/bash

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "🚀 DEPLOYING FORGOT PASSWORD FIX TO PRODUCTION"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

cd /Users/abdurrahmanaziz/Herd/eksporyuk

echo -e "${BLUE}📍 Working Directory:${NC}"
pwd
echo ""

# Step 1: Check git status
echo -e "${BLUE}1️⃣ Checking git status...${NC}"
echo "────────────────────────────────────────────────"
git status --short
echo ""

# Step 2: Stage changed files
echo -e "${BLUE}2️⃣ Staging production files...${NC}"
echo "────────────────────────────────────────────────"
git add nextjs-eksporyuk/src/app/api/auth/forgot-password-v2/route.ts
git add nextjs-eksporyuk/src/app/auth/reset-password/page.tsx
echo "✓ Files staged"
echo ""

# Step 3: Check what will be committed
echo -e "${BLUE}3️⃣ Changes to commit:${NC}"
echo "────────────────────────────────────────────────"
git diff --cached --name-only
echo ""

# Step 4: Commit
echo -e "${BLUE}4️⃣ Creating commit...${NC}"
echo "────────────────────────────────────────────────"
git commit -m "Fix: Forgot password link now functional - reset page calls correct v2 endpoint with query parameter token handling"
COMMIT_RESULT=$?
echo ""

if [ $COMMIT_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Commit created successfully${NC}"
    echo ""
    
    # Step 5: Push to main
    echo -e "${BLUE}5️⃣ Pushing to main branch...${NC}"
    echo "────────────────────────────────────────────────"
    git push origin main
    PUSH_RESULT=$?
    echo ""
    
    if [ $PUSH_RESULT -eq 0 ]; then
        echo -e "${GREEN}════════════════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
        echo -e "${GREEN}════════════════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo "🎯 What just happened:"
        echo "   • Code pushed to GitHub (main branch)"
        echo "   • Vercel webhook triggered automatically"
        echo "   • Build process started on Vercel"
        echo ""
        echo "📊 Deployment Info:"
        echo "   Repository: abdurrahmanaziz/eksporyuk"
        echo "   Branch: main"
        echo "   Live URL: https://app.eksporyuk.com"
        echo "   Build time: ~30-60 seconds"
        echo ""
        echo "🔧 Changes deployed:"
        echo "   ✓ /src/app/api/auth/forgot-password-v2/route.ts"
        echo "   ✓ /src/app/auth/reset-password/page.tsx"
        echo ""
        echo "📝 What was fixed:"
        echo "   • Reset link format: /reset-password?token=VALUE (was path-based)"
        echo "   • API endpoint: reset page now calls correct v2 endpoint"
        echo "   • Token validation: PUT handler validates and resets password"
        echo "   • Email sending: Mailketing integration working"
        echo ""
        echo "🧪 Testing the fix:"
        echo "   1. Wait 1-2 minutes for Vercel build to complete"
        echo "   2. Visit: https://app.eksporyuk.com/forgot-password"
        echo "   3. Enter registered email"
        echo "   4. Check inbox for reset email"
        echo "   5. Click reset link in email (should work now!)"
        echo "   6. Enter new password and submit"
        echo "   7. See success message and redirect to login"
        echo "   8. Login with new password"
        echo ""
        echo "📊 Monitor deployment:"
        echo "   https://vercel.com/dashboard"
        echo ""
        echo "════════════════════════════════════════════════════════════════════════"
    else
        echo -e "${RED}❌ Push failed!${NC}"
        echo ""
        echo "Possible issues:"
        echo "   • Network connection problem"
        echo "   • GitHub authentication issue"
        echo "   • Branch protection rules"
        echo ""
        echo "Solution:"
        echo "   • Check internet connection"
        echo "   • Verify GitHub authentication: git config --list | grep github"
        echo "   • Try again: git push origin main"
    fi
else
    echo -e "${RED}❌ No changes to commit${NC}"
    echo ""
    echo "This could mean:"
    echo "   • All files already committed"
    echo "   • No staging changes"
    echo ""
    echo "Check status: git status"
fi

echo ""
