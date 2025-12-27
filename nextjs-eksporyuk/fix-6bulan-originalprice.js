const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixOriginalPrice() {
  try {
    console.log('🔧 Fixing 6 Bulan originalPrice...\n')
    
    // Update paket 6 bulan - originalPrice harus lebih besar dari price
    // Price: 1.597.000, set originalPrice: 2.000.000 (lebih masuk akal)
    const result = await prisma.membership.update({
      where: {
        checkoutSlug: '6bulan-ekspor'
      },
      data: {
        originalPrice: 2000000 // Rp 2.000.000 (harga coret yang benar)
      }
    })
    
    console.log('✅ Updated!')
    console.log('  Name:', result.name)
    console.log('  Price: Rp', Number(result.price).toLocaleString('id-ID'))
    console.log('  Original Price: Rp', Number(result.originalPrice).toLocaleString('id-ID'))
    console.log('')
    console.log('💰 Discount display:')
    console.log('  ~~Rp 2.000.000~~ → Rp 1.597.000')
    console.log('  Hemat: Rp', (2000000 - 1597000).toLocaleString('id-ID'))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixOriginalPrice()
