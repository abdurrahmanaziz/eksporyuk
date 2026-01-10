#!/bin/bash

# Simple test to send email directly via Mailketing API

API_KEY="4e6b07c547b3de9981dfe432569995ab"
API_URL="https://api.mailketing.co.id/api/v1"
TEST_EMAIL="mangikiwwdigital@gmail.com"

echo "📧 Testing Mailketing API directly..."
echo "API Key: ${API_KEY:0:10}..."
echo "To: $TEST_EMAIL"
echo ""

# Test 1: Send simple test email
echo "Sending test email..."
curl -s -X POST "${API_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_token=${API_KEY}&to=${TEST_EMAIL}&from_email=admin@eksporyuk.com&from_name=Tim%20Ekspor%20Yuk&subject=Test%20Email%20-%20$(date +%s)&html=<p>Test%20email%20at%20$(date)</p>&text=Test%20email" \
  | jq . 2>/dev/null || echo "Failed to parse response"

echo ""
echo "Check email inbox for test email"
