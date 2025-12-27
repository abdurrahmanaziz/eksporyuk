#!/bin/bash

echo "🚀 Deploying database fix for originalPrice..."
echo ""
echo "⚠️  IMPORTANT: This will update PRODUCTION database!"
echo ""
echo "Changes to be applied:"
echo "  - 6 Bulan membership: originalPrice 1.200.000 → 2.000.000"
echo ""

read -p "Continue? (y/N): " confirm

if [[ $confirm != "y" && $confirm != "Y" ]]; then
  echo "❌ Cancelled"
  exit 0
fi

echo ""
echo "📝 Creating production update script..."

cat > /tmp/update-production-originalprice.js << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateProduction() {
  try {
    console.log('\n🔧 Updating production database...\n')
    
    // Update paket 6 bulan
    const result = await prisma.membership.update({
      where: {
        OR: [
          { checkoutSlug: '6bulan-ekspor' },
          { slug: '6bulan-ekspor' }
        ]
      },
      data: {
        originalPrice: 2000000
      }
    })
    
    console.log('✅ Updated!')
    console.log('  Name:', result.name)
    console.log('  Price: Rp', Number(result.price).toLocaleString('id-ID'))
    console.log('  OriginalPrice: Rp', Number(result.originalPrice).toLocaleString('id-ID'))
    console.log('\n💰 Harga coret sekarang: ~~Rp 2.000.000~~ → Rp 1.597.000')
    console.log('  Hemat: Rp', (2000000 - Number(result.price)).toLocaleString('id-ID'))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateProduction()
EOF

echo "✅ Script created"
echo ""
echo "🔄 Running update..."
node /tmp/update-production-originalprice.js

echo ""
echo "✅ Done! Check production: https://eksporyuk.com/checkout/6bulan-ekspor"
