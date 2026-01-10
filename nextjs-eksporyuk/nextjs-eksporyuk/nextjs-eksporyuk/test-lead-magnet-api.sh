#!/bin/bash

# Test Lead Magnet API Endpoints
# Make sure dev server is running: npm run dev

BASE_URL="http://localhost:3000"
ADMIN_COOKIE="" # Will be set after login

echo "🧪 Testing Lead Magnet API Endpoints"
echo "======================================"
echo ""

# Test 1: Check if server is running
echo "📡 Test 1: Checking if dev server is running..."
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|301\|302"; then
  echo "✅ Server is running"
else
  echo "❌ Server is not running. Please start with: npm run dev"
  exit 1
fi
echo ""

# Test 2: Admin Login (you need to adjust credentials)
echo "🔐 Test 2: Admin login required"
echo "   Please login as admin first in browser and copy session cookie"
echo "   Or use this curl command:"
echo '   curl -X POST http://localhost:3000/api/auth/callback/credentials \'
echo '     -H "Content-Type: application/json" \'
echo '     -d '"'"'{"email":"admin@eksporyuk.com","password":"your-password"}'"'"
echo ""
echo "   Then visit http://localhost:3000/admin/lead-magnets"
echo ""

# Test 3: Create Lead Magnet (requires authentication)
echo "📝 Test 3: Create Lead Magnet API"
echo "   Endpoint: POST /api/admin/lead-magnets"
echo "   Status: ⏳ Requires admin authentication"
echo ""

# Test 4: Get Active Lead Magnets (affiliate endpoint)
echo "📋 Test 4: Get Active Lead Magnets"
echo "   Endpoint: GET /api/affiliate/lead-magnets"
echo "   Status: ⏳ Requires authentication"
echo ""

echo "✨ Manual Testing Steps:"
echo ""
echo "1. Start dev server:"
echo "   cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk"
echo "   npm run dev"
echo ""
echo "2. Login as admin:"
echo "   Visit: http://localhost:3000/auth/login"
echo "   Use admin credentials"
echo ""
echo "3. Test Admin Lead Magnet Management:"
echo "   Visit: http://localhost:3000/admin/lead-magnets"
echo "   - Create new lead magnet (all 4 types)"
echo "   - Edit lead magnet"
echo "   - Toggle active/inactive"
echo "   - Delete lead magnet"
echo ""
echo "4. Test Affiliate Form Builder:"
echo "   Visit: http://localhost:3000/affiliate/optin-forms"
echo "   - Create or edit form"
echo "   - Select lead magnet from dropdown"
echo "   - Save form"
echo "   - Verify leadMagnetId saved in database"
echo ""
echo "5. Database Verification:"
echo "   npx prisma studio"
echo "   - Check LeadMagnet table"
echo "   - Check AffiliateOptinForm.leadMagnetId"
echo ""

