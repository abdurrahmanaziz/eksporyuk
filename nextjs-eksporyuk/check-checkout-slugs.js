const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCheckoutSlugs() {
  console.log('🔍 Checking Membership Checkout Slugs...\n')
  
  try {
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        checkoutTemplate: true,
        duration: true,
        isActive: true
      },
      orderBy: { price: 'desc' }
    })
    
    console.log(`📦 Found ${memberships.length} memberships:\n`)
    
    memberships.forEach((m, i) => {
      console.log(`${i + 1}. ${m.name}`)
      console.log(`   Slug: ${m.slug || '❌ NOT SET'}`)
      console.log(`   Checkout Slug: ${m.checkoutSlug || '❌ NOT SET'}`)
      console.log(`   Checkout Template: ${m.checkoutTemplate || '❌ NOT SET'}`)
      console.log(`   Duration: ${m.duration}`)
      console.log(`   Active: ${m.isActive ? '✅' : '❌'}`)
      console.log()
    })
    
    const missingCheckoutSlug = memberships.filter(m => !m.checkoutSlug)
    
    if (missingCheckoutSlug.length > 0) {
      console.log(`⚠️  WARNING: ${missingCheckoutSlug.length} memberships missing checkoutSlug:`)
      missingCheckoutSlug.forEach(m => {
        console.log(`   - ${m.name} (${m.slug})`)
      })
    } else {
      console.log('✅ All memberships have checkoutSlug set')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCheckoutSlugs()
