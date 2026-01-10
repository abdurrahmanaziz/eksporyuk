#!/bin/bash

echo "🧪 Testing Production Deployment"
echo "================================"
echo ""

PROD_URL="https://eksporyuk.com"

echo "1️⃣ Testing API health..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${PROD_URL}/api/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
  echo "   ✅ Server responding (${HTTP_CODE})"
else
  echo "   ⚠️  Server status: ${HTTP_CODE}"
fi
echo ""

echo "2️⃣ Testing training-affiliate API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${PROD_URL}/api/learn/training-affiliate 2>/dev/null)
if [ "$HTTP_CODE" = "401" ]; then
  echo "   ✅ API working (401 = auth required, correct!)"
elif [ "$HTTP_CODE" = "500" ]; then
  echo "   ❌ API error 500"
else
  echo "   ℹ️  API status: ${HTTP_CODE}"
fi
echo ""

echo "3️⃣ Testing homepage..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${PROD_URL} 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Homepage loaded"
else
  echo "   ⚠️  Homepage status: ${HTTP_CODE}"
fi
echo ""

echo "================================"
echo "🔗 Production URL: ${PROD_URL}"
echo "📊 Check full deployment: https://vercel.com/ekspor-yuks-projects/eksporyuk"
echo ""
echo "✅ Deployment verification complete!"
