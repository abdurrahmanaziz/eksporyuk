#!/bin/bash

echo "🧪 Testing Local Login..."
echo ""

# Test login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@eksporyuk.com",
    "password": "admin123",
    "redirect": false
  }')

echo "Response: $LOGIN_RESPONSE"
echo ""

# Check if successful
if echo "$LOGIN_RESPONSE" | grep -q "url"; then
  echo "✅ Login successful!"
  echo ""
  echo "📝 You can now login at: http://localhost:3000/auth/login"
  echo "   Email: admin@eksporyuk.com"
  echo "   Password: admin123"
else
  echo "⚠️  Check response above"
fi
