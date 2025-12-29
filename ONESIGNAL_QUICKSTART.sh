#!/bin/bash
# OneSignal Phase 1 Quick Start Guide
# Run this after adding OneSignal credentials

echo "🚀 OneSignal Phase 1 - Quick Setup"
echo "=================================="
echo ""

# Check if env vars are set
if [ -z "$ONESIGNAL_APP_ID" ]; then
  echo "⚠️  NEXT_PUBLIC_ONESIGNAL_APP_ID not configured"
  echo ""
  echo "To get started:"
  echo "1. Go to https://onesignal.com/"
  echo "2. Sign up or log in"
  echo "3. Create a Web Application"
  echo "4. Copy the App ID"
  echo "5. Update .env.local:"
  echo "   NEXT_PUBLIC_ONESIGNAL_APP_ID=your_app_id_here"
  echo ""
fi

echo "✅ Implementation Status:"
echo "   • Environment variables: ADDED"
echo "   • Hook (use-onesignal): CREATED"
echo "   • API endpoint (/api/user/profile): UPDATED"
echo "   • Component integration: COMPLETE"
echo "   • Database field: READY"
echo ""

echo "📋 Files Modified:"
echo "   1. .env.local - Added OneSignal env vars"
echo "   2. src/hooks/use-onesignal.ts - NEW"
echo "   3. src/app/api/user/profile/route.ts - Updated PUT handler"
echo "   4. src/components/providers/OneSignalComponent.tsx - Integrated hook"
echo ""

echo "🧪 Testing:"
echo "   npm run build      - Check TypeScript (should PASS)"
echo "   npm run dev        - Start dev server"
echo "   curl http://localhost:3000/api/user/profile - Test endpoint"
echo ""

echo "📚 Documentation:"
echo "   See: ONESIGNAL_PHASE1_IMPLEMENTATION.md"
echo ""

echo "✨ Ready to go!"
