#!/bin/bash

# Script untuk update Vercel environment variables dan deploy

echo "🚀 Deployment Script - Fix Reset Password URL"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check local env files
echo "📋 Step 1: Checking local environment files..."
echo ""

echo "Checking .env.local..."
if grep -q 'NEXT_PUBLIC_APP_URL="http://localhost:3000\\n"' .env.local 2>/dev/null; then
    echo -e "${RED}❌ .env.local still has \\n${NC}"
    exit 1
else
    echo -e "${GREEN}✅ .env.local is clean${NC}"
fi

echo "Checking .env..."
if grep -q 'NEXT_PUBLIC_APP_URL="https://eksporyuk.com\\n"' .env 2>/dev/null; then
    echo -e "${RED}❌ .env still has \\n${NC}"
    exit 1
else
    echo -e "${GREEN}✅ .env is clean${NC}"
fi

echo ""
echo "=============================================="
echo ""

# Step 2: Update Vercel Environment Variables
echo "📝 Step 2: Update Vercel Environment Variables"
echo ""
echo -e "${YELLOW}⚠️  MANUAL ACTION REQUIRED:${NC}"
echo ""
echo "Go to Vercel Dashboard:"
echo "https://vercel.com/ekspor-yuks-projects/eksporyuk/settings/environment-variables"
echo ""
echo "1. Find: NEXT_PUBLIC_APP_URL"
echo "2. Click Edit"
echo "3. Set value to: https://eksporyuk.com"
echo "   (Make sure NO trailing \\n or space)"
echo "4. Save"
echo ""
echo "Or use Vercel CLI:"
echo ""
echo "  vercel env rm NEXT_PUBLIC_APP_URL production"
echo "  vercel env add NEXT_PUBLIC_APP_URL production"
echo "  # Enter: https://eksporyuk.com"
echo ""
read -p "Press ENTER when done..."
echo ""

# Step 3: Commit changes
echo "=============================================="
echo ""
echo "📦 Step 3: Committing changes..."
echo ""

git add .
git status

echo ""
echo "Commit message will be:"
echo "fix: remove trailing newline from NEXT_PUBLIC_APP_URL environment variable"
echo ""
read -p "Proceed with commit? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "fix: remove trailing newline from NEXT_PUBLIC_APP_URL environment variable

- Fixed .env file: removed \\n from NEXT_PUBLIC_APP_URL
- Fixed .env.local file: removed \\n from NEXT_PUBLIC_APP_URL
- This fixes reset password email links having space after domain
- URL was: https://eksporyuk.com /auth/reset-password (wrong)
- URL now: https://eksporyuk.com/auth/reset-password (correct)

Related files:
- .env
- .env.local
- FINAL_FIX_VERIFICATION.md

Impact: Forgot password email links will now work correctly"
    
    echo -e "${GREEN}✅ Changes committed${NC}"
else
    echo -e "${YELLOW}⚠️  Commit skipped${NC}"
    exit 0
fi

echo ""
echo "=============================================="
echo ""

# Step 4: Push to repository
echo "🚢 Step 4: Pushing to repository..."
echo ""
read -p "Push to origin main? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    echo -e "${GREEN}✅ Pushed to repository${NC}"
else
    echo -e "${YELLOW}⚠️  Push skipped${NC}"
    echo "You can push manually later with: git push origin main"
fi

echo ""
echo "=============================================="
echo ""

# Step 5: Deploy to Vercel
echo "🚀 Step 5: Deploying to Vercel Production..."
echo ""
echo "Vercel will auto-deploy from git push, or you can trigger manually:"
echo ""
echo "  vercel --prod"
echo ""
read -p "Trigger manual deploy now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v vercel &> /dev/null; then
        vercel --prod
        echo -e "${GREEN}✅ Deployed to production${NC}"
    else
        echo -e "${RED}❌ Vercel CLI not installed${NC}"
        echo "Install with: npm i -g vercel"
    fi
else
    echo -e "${YELLOW}⚠️  Manual deploy skipped${NC}"
    echo "Vercel will auto-deploy from git push"
fi

echo ""
echo "=============================================="
echo ""

# Step 6: Testing
echo "🧪 Step 6: Testing Checklist"
echo ""
echo "After deployment completes, test these:"
echo ""
echo "1. Development (localhost:3000):"
echo "   - Restart dev server: npm run dev"
echo "   - Go to /auth/forgot-password"
echo "   - Enter email: azizbiasa@gmail.com"
echo "   - Check email for reset link"
echo "   - Verify URL: http://localhost:3000/auth/reset-password?token=xxx"
echo ""
echo "2. Production (eksporyuk.com):"
echo "   - Go to https://eksporyuk.com/auth/forgot-password"
echo "   - Enter email"
echo "   - Check email for reset link"
echo "   - Verify URL: https://eksporyuk.com/auth/reset-password?token=xxx"
echo "   - Click link and verify it opens correctly"
echo ""
echo -e "${GREEN}✅ Deployment script complete!${NC}"
echo ""
echo "📚 Documentation:"
echo "   - FINAL_FIX_VERIFICATION.md"
echo "   - RESET_PASSWORD_FIX_COMPLETE.md"
echo ""
