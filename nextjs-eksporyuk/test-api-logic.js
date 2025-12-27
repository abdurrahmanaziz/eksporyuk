const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAPI() {
  try {
    console.log('🧪 Testing API Logic for /checkout/pro (General Checkout)\n')
    
    // Simulate what API does
    const slug = 'pro'
    
    const plan = await prisma.membership.findFirst({
      where: { 
        OR: [
          { checkoutSlug: slug },
          { slug: slug }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        features: true,
        price: true,
        originalPrice: true,
        duration: true,
        showInGeneralCheckout: true
      }
    })
    
    if (!plan) {
      console.log('❌ Plan "pro" not found!')
      return
    }
    
    console.log('📦 Plan found:', plan.name)
    console.log('   checkoutSlug:', plan.checkoutSlug)
    console.log('   features:', plan.features)
    console.log('')
    
    // Check if this triggers general checkout
    const isSingleCheckout = (plan.checkoutSlug === slug || plan.slug === slug) && 
                             plan.checkoutSlug !== 'pro' && 
                             plan.slug !== 'pro'
    
    console.log('🎯 Checkout type:', isSingleCheckout ? 'SINGLE' : 'GENERAL')
    console.log('')
    
    if (!isSingleCheckout) {
      console.log('✅ Fetching ALL memberships for general checkout...\n')
      
      const allMemberships = await prisma.membership.findMany({
        where: {
          isActive: true,
          slug: { not: slug }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          checkoutSlug: true,
          price: true,
          originalPrice: true,
          duration: true
        }
      })
      
      console.log(`📊 Found ${allMemberships.length} active memberships:\n`)
      
      allMemberships.forEach(m => {
        const basePrice = parseFloat(m.price?.toString() || '0')
        const originalPrice = m.originalPrice ? parseFloat(m.originalPrice.toString()) : null
        
        console.log(`📦 ${m.name}`)
        console.log(`   Slug: ${m.checkoutSlug || m.slug}`)
        console.log(`   Price: Rp ${basePrice.toLocaleString('id-ID')}`)
        console.log(`   OriginalPrice (DB): ${m.originalPrice ? 'Rp ' + Number(m.originalPrice).toLocaleString('id-ID') : 'null'}`)
        console.log(`   OriginalPrice (processed): ${originalPrice ? 'Rp ' + originalPrice.toLocaleString('id-ID') : 'null'}`)
        console.log(`   MarketingPrice yang akan dikirim: ${originalPrice ? 'Rp ' + originalPrice.toLocaleString('id-ID') : 'null'}`)
        console.log('')
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAPI()
