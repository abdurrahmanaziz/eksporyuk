const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkMemberships() {
  try {
    const memberships = await prisma.membership.findMany({
      orderBy: { price: 'asc' }
    })
    
    console.log('\n📦 Data Membership di Database:\n')
    
    if (memberships.length === 0) {
      console.log('❌ Tidak ada data membership')
    } else {
      memberships.forEach((m, i) => {
        console.log(`${i + 1}. ${m.name}`)
        console.log(`   Harga: Rp ${Number(m.price).toLocaleString('id-ID')}`)
        console.log(`   Harga Normal: Rp ${Number(m.originalPrice || 0).toLocaleString('id-ID')}`)
        console.log(`   Durasi: ${m.duration}`)
        console.log(`   Best Seller: ${m.isBestSeller ? '⭐ Ya' : 'Tidak'}`)
        console.log(`   Active: ${m.isActive ? '✅' : '❌'}`)
        console.log(`   Features: ${JSON.parse(m.features).length} fitur`)
        console.log(`   External URL: ${m.externalSalesUrl || 'Belum diisi'}`)
        console.log('')
      })
      console.log(`Total: ${memberships.length} paket membership\n`)
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkMemberships()
