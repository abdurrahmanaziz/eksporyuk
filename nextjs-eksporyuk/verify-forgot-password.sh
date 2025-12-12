#!/bin/bash

# FORGOT PASSWORD SYSTEM - VERIFICATION SCRIPT
# Run this to verify all components are working

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "🔐 FORGOT PASSWORD SYSTEM - VERIFICATION"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CHECKS_PASSED=0
CHECKS_FAILED=0

# Helper functions
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} File missing: $1"
        ((CHECKS_FAILED++))
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found: $2"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} Missing: $2"
        ((CHECKS_FAILED++))
    fi
}

# 1. Check API Endpoint
echo "1️⃣ Checking API Endpoints..."
echo "────────────────────────────────────────────"
check_file "src/app/api/auth/forgot-password-v2/route.ts"
check_content "src/app/api/auth/forgot-password-v2/route.ts" "export async function POST"
check_content "src/app/api/auth/forgot-password-v2/route.ts" "export async function PUT"
echo ""

# 2. Check Frontend Page
echo "2️⃣ Checking Frontend Pages..."
echo "────────────────────────────────────────────"
check_file "src/app/auth/reset-password/page.tsx"
check_content "src/app/auth/reset-password/page.tsx" "forgot-password-v2"
check_content "src/app/auth/reset-password/page.tsx" "searchParams.get('token')"
echo ""

# 3. Check Test Files
echo "3️⃣ Checking Test Files..."
echo "────────────────────────────────────────────"
check_file "test-complete-reset-flow.js"
check_file "test-api-endpoints.js"
check_file "test-reset-password-flow.js"
echo ""

# 4. Check Documentation
echo "4️⃣ Checking Documentation..."
echo "────────────────────────────────────────────"
check_file "FORGOT_PASSWORD_FIX_COMPLETE.md"
check_file "QUICK_TEST_FORGOT_PASSWORD.md"
check_file "DEPLOYMENT_CHECKLIST_FORGOT_PASSWORD.md"
check_file "FORGOT_PASSWORD_FINAL_STATUS.md"
echo ""

# 5. Check for Node Modules
echo "5️⃣ Checking Dependencies..."
echo "────────────────────────────────────────────"
if [ -d "node_modules" ]; then
    if [ -d "node_modules/bcryptjs" ]; then
        echo -e "${GREEN}✓${NC} bcryptjs installed"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} bcryptjs missing - run: npm install"
        ((CHECKS_FAILED++))
    fi
    
    if [ -d "node_modules/@prisma/client" ]; then
        echo -e "${GREEN}✓${NC} @prisma/client installed"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} @prisma/client missing - run: npm install"
        ((CHECKS_FAILED++))
    fi
else
    echo -e "${RED}✗${NC} node_modules not found - run: npm install"
    ((CHECKS_FAILED++))
fi
echo ""

# 6. Check .env files
echo "6️⃣ Checking Environment Configuration..."
echo "────────────────────────────────────────────"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local exists"
    ((CHECKS_PASSED++))
    
    if grep -q "NEXTAUTH_URL" .env.local; then
        echo -e "${GREEN}✓${NC} NEXTAUTH_URL configured"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} NEXTAUTH_URL not set in .env.local"
    fi
else
    echo -e "${YELLOW}⚠${NC} .env.local not found (required for development)"
fi
echo ""

# 7. Summary
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "📊 VERIFICATION SUMMARY"
echo "════════════════════════════════════════════════════════════════════════"
echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run: npm run dev"
    echo "  2. Test: http://localhost:3000/forgot-password"
    echo "  3. Run: node test-api-endpoints.js"
    echo ""
else
    echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
    echo ""
    echo "Please fix the issues above before proceeding."
    echo ""
fi

echo "════════════════════════════════════════════════════════════════════════"
