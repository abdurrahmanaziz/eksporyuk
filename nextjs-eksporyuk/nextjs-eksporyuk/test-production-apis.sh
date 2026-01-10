#!/bin/bash

# Production API Test Script
# Tests all previously failing endpoints

BASE_URL="https://eksporyuk.vercel.app"
ERRORS=0
PASSED=0

echo "🧪 Testing Production APIs..."
echo "================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Testing: $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
    
    if [ "$response" == "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $response)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $response)"
        ERRORS=$((ERRORS + 1))
    fi
}

# Test endpoints that should return 401 (unauthorized) instead of 404/500
echo "📋 Authentication-Required Endpoints (expect 401 or 200):"
test_endpoint "/api/users/presence" "401" "User presence tracking"
test_endpoint "/api/user/affiliate-status" "401" "Affiliate status check"
test_endpoint "/api/admin/enrollments?page=1&limit=50" "401" "Admin enrollments list"
test_endpoint "/api/admin/course-reviews?page=1&limit=20" "Admin course reviews"
test_endpoint "/api/certificates" "401" "Certificates list"
test_endpoint "/api/community/online-users" "401" "Community online users"

echo ""
echo "📝 Post Interaction Endpoints (expect 401 or 200):"
test_endpoint "/api/posts/cmjkrg3y50000it8r4tuwg48e/reactions" "401" "Post reactions"
test_endpoint "/api/posts/cmjkrg3y50000it8r4tuwg48e/save" "404" "Save/bookmark post"
test_endpoint "/api/posts/cmjkrg3y50000it8r4tuwg48e/comments" "401" "Post comments"

echo ""
echo "🌐 Public Endpoints (expect 200):"
test_endpoint "/api/health" "200" "Health check"
test_endpoint "/api/membership-plans/paket-lifetime" "200" "Membership plan details"

echo ""
echo "================================"
echo "📊 Test Summary:"
echo "   Passed: $PASSED"
echo "   Failed: $ERRORS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Check deployment status.${NC}"
    exit 1
fi
