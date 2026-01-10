#!/bin/bash

echo "🧪 Testing /api/learn/training-affiliate endpoint..."
echo ""

# Test without auth (should return 401)
echo "1️⃣ Test without authentication:"
curl -s http://localhost:3000/api/learn/training-affiliate | jq -r '.error'
echo ""

echo "2️⃣ For authenticated test, please check in browser:"
echo "   http://localhost:3000/learn/training-affiliate"
echo ""
echo "✅ Test script complete!"
