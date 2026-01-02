#!/bin/bash

# Test Email Notification System via API Calls
# This script tests the email notification flow by simulating user actions

echo "╔══════════════════════════════════════════╗"
echo "║   Email Notification System - Test Run   ║"
echo "╚══════════════════════════════════════════╝"

API_URL="http://localhost:3000"
TEST_EMAIL="mangikiwwdigital@gmail.com"
TEST_PASSWORD="TestPassword123!"
TEST_NAME="Test Customer"

echo ""
echo "Target: ${TEST_EMAIL}"
echo "API URL: ${API_URL}"
echo ""

# Test 1: User Registration (triggers welcome email)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: User Registration (Welcome Email)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

REGISTER_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"name\": \"${TEST_NAME}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"phone\": \"+6281234567890\",
    \"whatsapp\": \"+6281234567890\"
  }")

echo "Response:"
echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

if echo "$REGISTER_RESPONSE" | grep -q '"success":true\|"id":'; then
  echo "✅ Registration successful"
  echo "📧 Welcome email should be sent to ${TEST_EMAIL}"
else
  echo "⚠️  Registration response: Check if user already exists"
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║            Test Summary                  ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "✓ Welcome email test initiated"
echo "✓ Check ${TEST_EMAIL} for welcome email"
echo "✓ Email should arrive within 1-5 minutes"
echo ""
echo "Next steps:"
echo "1. Check email inbox/spam folder for:"
echo "   - Welcome registration email"
echo ""
echo "⚠️  Note: Order confirmation and payment confirmation emails"
echo "   require complete checkout flow to test"
echo ""
