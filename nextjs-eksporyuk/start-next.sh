#!/bin/bash

# Stop any running processes
pkill -f "vite\|next" 2>/dev/null || true

# Navigate to Next.js project
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk

# Verify we're in the right place
echo "Working directory: $(pwd)"
echo "Package name: $(grep -o '"name": "[^"]*"' package.json)"

# Clean and start
rm -rf .next 2>/dev/null || true

# Start Next.js with explicit binary path
echo "Starting Next.js development server..."
exec /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/node_modules/.bin/next dev --webpack --port 3000