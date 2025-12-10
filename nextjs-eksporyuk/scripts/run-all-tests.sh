#!/bin/bash

# Pre-Migration Testing Suite
# Run all tests before production migration

echo "🧪 EKSPORYUK PRE-MIGRATION TEST SUITE"
echo "======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo "Running: $test_name"
    echo "----------------------------------------"
    
    if eval $test_command; then
        echo -e "${GREEN}✅ PASSED${NC}: $test_name"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: $test_name"
        ((TESTS_FAILED++))
    fi
    
    echo ""
}

# Start testing
echo "Starting test suite at $(date)"
echo ""

# Test 1: Migration Flow
run_test "Migration Flow Test" "node scripts/test-wp-migration.js"

# Test 2: Concurrent Load
run_test "Concurrent Load Test" "node scripts/test-concurrent-load.js"

# Test 3: Migration Readiness Audit
run_test "Migration Readiness Audit" "node scripts/audit-migration-readiness.js"

# Final Results
echo "======================================"
echo "TEST SUITE RESULTS"
echo "======================================"
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "Platform is ready for production migration."
    exit 0
else
    echo -e "${RED}❌ TESTS FAILED!${NC}"
    echo "Fix issues before proceeding with migration."
    exit 1
fi
