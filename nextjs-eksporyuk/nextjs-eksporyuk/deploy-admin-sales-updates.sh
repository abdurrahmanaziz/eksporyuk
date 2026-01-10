#!/bin/bash

# Deploy Admin Sales Updates to Production
# This script commits and pushes changes to admin sales page and API

echo "=== Deploying Admin Sales Updates ==="
echo ""

cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk

echo "📋 Changes to be deployed:"
echo "1. Admin Sales Page - Added Affiliate Commission card"
echo "2. Admin Sales API - Added affiliate commission stats"
echo ""

# Show current changes
echo "Current file status:"
git status --short src/app/\(dashboard\)/admin/sales/page.tsx
git status --short src/app/api/admin/sales/route.ts

echo ""
read -p "Deploy these changes? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    # Add files
    git add src/app/\(dashboard\)/admin/sales/page.tsx
    git add src/app/api/admin/sales/route.ts
    
    # Commit
    git commit -m "feat(admin): Add affiliate commission stats to sales dashboard

- Add Komisi Affiliate card showing total commission amount
- Add affiliate transaction count stats
- Update API to calculate and return affiliate commission data
- Improve sales dashboard with affiliate insights"
    
    # Push
    git push origin main
    
    echo ""
    echo "✅ Changes deployed successfully!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. If using Vercel: Changes will auto-deploy"
    echo "2. If manual: Run 'npm run build' on production server"
    echo "3. Wait ~2-3 minutes for deployment"
    echo "4. Clear browser cache and reload /admin/sales"
else
    echo "Deployment cancelled"
fi
