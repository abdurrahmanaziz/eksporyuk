#!/bin/bash

echo "=== Testing Course API Endpoint ==="
echo ""

# Get the course slug to test
SLUG="${1:-kelas-eksporyuk}"

echo "Testing: /api/learn/$SLUG"
echo ""

# Start the dev server if not running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "⚠️  Dev server not running. Please start it with 'npm run dev'"
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Test the endpoint (this will return 401 without auth, but we can see the structure)
echo "Making request to API endpoint..."
echo ""

RESPONSE=$(curl -s http://localhost:3000/api/learn/$SLUG)

# Pretty print JSON if jq is available
if command -v jq &> /dev/null; then
    echo "$RESPONSE" | jq '.'
else
    echo "$RESPONSE"
fi

echo ""
echo "=== Test Complete ==="
