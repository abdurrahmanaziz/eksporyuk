const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAllMemberships() {
  try {
    console.log('🔍 Checking ALL memberships originalPrice...\n')
    
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        duration: true,
        price: true,
        originalPrice: true,
        discount: true,
        isActive: true
      },
      orderBy: {
        price: 'asc'
      }
    })
    
    console.log('📊 Found', memberships.length, 'memberships:\n')
    
    memberships.forEach(m => {
      const price = Number(m.price)
      const original = m.originalPrice ? Number(m.originalPrice) : null
      
      console.log(`📦 ${m.name}`)
      console.log(`   Slug: ${m.checkoutSlug || m.slug}`)
      console.log(`   Price: Rp ${price.toLocaleString('id-ID')}`)
      console.log(`   Original Price: ${original ? 'Rp ' + original.toLocaleString('id-ID') : 'null'}`)
      console.log(`   Discount: ${m.discount}%`)
      console.log(`   Active: ${m.isActive}`)
      
      // Check if originalPrice makes sense
      if (original && original < price) {
        console.log(`   ⚠️  WARNING: Original price LOWER than price!`)
      }
      
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllMemberships()
