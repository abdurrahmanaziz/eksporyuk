#!/bin/bash

# Test coupon generation endpoint
# Need to be authenticated as an affiliate user

echo "🔍 Testing coupon generation endpoint..."
echo ""

# Step 1: Get template ID for KARDUS
echo "📋 Step 1: Find KARDUS template..."
TEMPLATES=$(curl -s "https://eksporyuk.com/api/affiliate/coupons/templates" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" 2>&1)

echo "Templates Response: $TEMPLATES"
echo ""

# Step 2: Generate coupon
echo "📝 Step 2: Generate coupon from template..."
RESULT=$(curl -s -X POST "https://eksporyuk.com/api/affiliate/coupons/generate" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "templateId": "template-id-here",
    "customCode": "KARDUS123"
  }' 2>&1)

echo "Generation Response: $RESULT"
echo ""

# Step 3: Verify created coupon
echo "✅ Step 3: List generated coupons..."
VERIFY=$(curl -s "https://eksporyuk.com/api/affiliate/coupons" \
  -H "Cookie: your-session-cookie" 2>&1)

echo "Verification: $VERIFY"
