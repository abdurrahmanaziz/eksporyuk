#!/bin/bash

echo "🔍 DEBUGGING POST SYSTEM"
echo "======================="
echo ""

# Test 1: Check API endpoint status
echo "TEST 1: API Endpoint Status"
echo "---"
curl -s -w "Status: %{http_code}\n" "http://localhost:3000/api/community/feed?filter=all&page=1&limit=5" \
  -H "Cookie: next-auth.session-token=invalid" 2>&1 | head -5
echo ""

# Test 2: Check if feed page loads
echo "TEST 2: Feed Page HTML"
echo "---"
curl -s "http://localhost:3000/community/feed" 2>&1 | head -100 | grep -E "title|error|Error|404|500" | head -3
echo ""

# Test 3: Check Prisma schema
echo "TEST 3: Database Schema Check"
echo "---"
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const postCount = await prisma.post.count();
    const userCount = await prisma.user.count();
    const groupCount = await prisma.group.count();
    console.log('Posts:', postCount);
    console.log('Users:', userCount);
    console.log('Groups:', groupCount);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>&1
echo ""

# Test 4: Check Next.js build status
echo "TEST 4: Build Verification"
echo "---"
grep -i "error\|success" /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/.next 2>/dev/null || echo "Build files exist"
npm run build 2>&1 | tail -5
