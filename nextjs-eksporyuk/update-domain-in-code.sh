#!/bin/bash

# Script untuk update domain dari app.eksporyuk.com ke eksporyuk.com
# Usage: bash update-domain-in-code.sh

OLD_DOMAIN="app\.eksporyuk\.com"
NEW_DOMAIN="eksporyuk.com"

echo "🔄 Updating domain in codebase..."
echo "   Old: app.eksporyuk.com"
echo "   New: eksporyuk.com"
echo ""

# Counter
UPDATED=0

# Function to update file
update_file() {
  local file=$1
  if grep -q "$OLD_DOMAIN" "$file" 2>/dev/null; then
    sed -i '' "s/$OLD_DOMAIN/$NEW_DOMAIN/g" "$file"
    echo "✅ Updated: $file"
    ((UPDATED++))
  fi
}

# Update TypeScript/JavaScript files
echo "📝 Updating source files..."
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | while read file; do
  update_file "$file"
done

# Update .env files
echo ""
echo "🔐 Updating environment files..."
for env_file in .env .env.local .env.production .env.development; do
  if [ -f "$env_file" ]; then
    update_file "$env_file"
  fi
done

# Update config files
echo ""
echo "⚙️  Updating config files..."
for config_file in next.config.js vercel.json package.json; do
  if [ -f "$config_file" ]; then
    update_file "$config_file"
  fi
done

# Update markdown documentation
echo ""
echo "📚 Updating documentation..."
find . -maxdepth 1 -type f -name "*.md" | while read file; do
  update_file "$file"
done

echo ""
echo "✅ Domain update complete!"
echo "   Updated $UPDATED files"
echo ""
echo "⚠️  NEXT STEPS:"
echo "   1. Review changes: git diff"
echo "   2. Test locally"
echo "   3. Update Vercel environment variables"
echo "   4. Commit: git add . && git commit -m 'chore: migrate to eksporyuk.com'"
echo "   5. Deploy: vercel --prod"
