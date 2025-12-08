const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testMembershipAPI() {
  try {
    const slug = 'paket-lifetime'
    
    console.log(`\n🔍 Testing API for slug: ${slug}\n`)
    
    // Test 1: Find by slug
    const plan = await prisma.membership.findUnique({
      where: { slug: slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        features: true,
        isActive: true,
      }
    })

    if (!plan) {
      console.log('❌ Plan not found!')
      return
    }

    console.log('✅ Plan found:')
    console.log(`   Name: ${plan.name}`)
    console.log(`   Slug: ${plan.slug}`)
    console.log(`   Active: ${plan.isActive ? 'Yes' : 'No'}`)
    console.log(`   Description: ${plan.description?.substring(0, 50)}...`)
    
    // Test 2: Parse features (prices)
    try {
      const prices = plan.features ? JSON.parse(plan.features) : []
      console.log(`\n   Prices: ${prices.length} options found`)
      
      if (prices.length > 0) {
        console.log('\n   Price Options:')
        prices.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.label || p.duration}: Rp ${p.price?.toLocaleString('id-ID')}`)
        })
      }
    } catch (e) {
      console.log('   ⚠️ Features is not valid JSON:', plan.features)
    }

    console.log('\n✅ API Test Successful!')
    console.log(`\nCheckout URL: http://localhost:3000/checkout/${slug}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testMembershipAPI()
