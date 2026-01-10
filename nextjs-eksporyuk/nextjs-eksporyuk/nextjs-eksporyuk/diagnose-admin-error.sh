#!/bin/bash

echo "=========================================="
echo "EKSPORYUK - Admin Error Diagnostic"
echo "=========================================="

# Test 1: Check if NEXTAUTH_URL is correct
echo -e "\n1. Checking NextAuth Configuration..."
ssh eksporyuk@157.10.253.103 'cd ~/eksporyuk/nextjs-eksporyuk && grep NEXTAUTH_URL .env'

# Test 2: Check PM2 status
echo -e "\n2. Checking PM2 Status..."
ssh eksporyuk@157.10.253.103 'pm2 list'

# Test 3: Check recent errors
echo -e "\n3. Recent Error Logs..."
ssh eksporyuk@157.10.253.103 'pm2 logs eksporyuk --lines 15 --nostream --err'

# Test 4: Test API endpoints
echo -e "\n4. Testing API Endpoints..."
echo "   - Testing /api/auth/csrf"
curl -s https://app.eksporyuk.com/api/auth/csrf

echo -e "\n   - Testing /api/auth/providers"
curl -s https://app.eksporyuk.com/api/auth/providers

# Test 5: Check if admin route redirects properly
echo -e "\n5. Testing /admin redirect..."
curl -sI https://app.eksporyuk.com/admin | grep -E "HTTP|Location"

echo -e "\n=========================================="
echo "Diagnostic complete!"
echo "=========================================="
