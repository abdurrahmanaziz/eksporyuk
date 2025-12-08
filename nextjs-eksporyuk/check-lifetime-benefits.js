const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLifetimeBenefits() {
  try {
    const lifetime = await prisma.membership.findUnique({
      where: { slug: 'paket-lifetime' },
      select: {
        name: true,
        slug: true,
        features: true
      }
    })
    
    if (!lifetime) {
      console.log('❌ Paket lifetime tidak ditemukan')
      return
    }
    
    console.log('\n📦 Paket Lifetime Data:\n')
    console.log('Name:', lifetime.name)
    console.log('Slug:', lifetime.slug)
    console.log('\nFeatures:')
    console.log(JSON.stringify(lifetime.features, null, 2))
    
    // Try to parse if it's an array
    if (Array.isArray(lifetime.features)) {
      console.log('\n✅ Features is an array')
      
      if (lifetime.features.length > 0) {
        const firstItem = lifetime.features[0]
        console.log('\nFirst item type:', typeof firstItem)
        console.log('First item:', JSON.stringify(firstItem, null, 2))
        
        if (typeof firstItem === 'object' && firstItem.benefits) {
          console.log('\n✅ Has benefits:', firstItem.benefits)
        } else {
          console.log('\n❌ No benefits found in first item')
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLifetimeBenefits()
