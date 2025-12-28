#!/bin/bash

echo "🧪 Testing Auto-Enroll API..."
echo ""

# Get admin session first (login)
echo "🔐 Getting admin session..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@eksporyuk.com",
    "password": "admin123"
  }')

# Extract session token (this is simplified - in real app, you'd use proper session handling)
# For now, just call the API directly with proper headers

echo "📡 Calling Auto-Enroll API..."
echo ""

# Call auto-enroll API
RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/auto-enroll-affiliates \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -b cookies.txt)

echo "📊 Response:"
echo "$RESPONSE" | jq '.'

echo ""
echo "✅ Test complete!"
