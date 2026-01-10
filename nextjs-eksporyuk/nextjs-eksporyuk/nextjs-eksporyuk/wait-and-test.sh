#!/bin/bash

echo "⏳ Waiting 90 seconds for Vercel deployment..."
sleep 90

echo ""
echo "🧪 Testing production API..."
echo ""

curl -s https://eksporyuk.com/api/affiliate/links \
  -H "Cookie: your-session-cookie-here" \
  -w "\n\nStatus: %{http_code}\n" || echo "Failed to connect"

echo ""
echo "📋 NEXT STEPS:"
echo "1. Login ke https://eksporyuk.com/auth/login"
echo "2. Open DevTools Console (F12)"
echo "3. Refresh halaman /affiliate/links"
echo "4. Copy error message yang muncul"
echo "5. Atau cek Vercel Logs di dashboard"
echo ""
echo "🔗 Vercel Logs: https://vercel.com/abdurrahmanaziz/eksporyuk/logs"
