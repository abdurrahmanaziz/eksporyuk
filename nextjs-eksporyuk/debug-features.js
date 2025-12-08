const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkFeaturesStructure() {
  try {
    const memberships = await prisma.membership.findMany({
      where: {
        slug: {
          in: ['paket-lifetime', 'paket-1-bulan', 'paket-3-bulan']
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        features: true,
        price: true,
        originalPrice: true
      }
    })
    
    console.log('\n=== CHECKING FEATURES STRUCTURE ===\n')
    
    memberships.forEach(m => {
      console.log(`📦 ${m.name} (${m.slug})`)
      console.log(`   Price: ${m.price}`)
      console.log(`   Original Price: ${m.originalPrice}`)
      console.log(`   Features type: ${typeof m.features}`)
      
      if (typeof m.features === 'string') {
        console.log(`   Features (string): ${m.features.substring(0, 150)}...`)
      } else if (Array.isArray(m.features)) {
        console.log(`   Features (array): ${m.features.length} items`)
        console.log(`   First item:`, JSON.stringify(m.features[0], null, 2))
      } else if (m.features && typeof m.features === 'object') {
        console.log(`   Features (object):`, JSON.stringify(m.features, null, 2))
      } else {
        console.log(`   Features: null/undefined`)
      }
      console.log('')
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkFeaturesStructure()
