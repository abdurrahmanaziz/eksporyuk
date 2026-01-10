const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setCheckoutSlugs() {
  console.log('🔧 Setting Membership Checkout Slugs...\n')
  
  try {
    const memberships = await prisma.membership.findMany({
      where: { checkoutSlug: null },
      select: { id: true, name: true, slug: true }
    })
    
    console.log(`📦 Found ${memberships.length} memberships without checkoutSlug\n`)
    
    for (const m of memberships) {
      // Generate checkoutSlug from slug (remove 'paket-' prefix if exists)
      let checkoutSlug = m.slug
      if (checkoutSlug && checkoutSlug.startsWith('paket-')) {
        checkoutSlug = checkoutSlug.replace('paket-', '')
      }
      
      console.log(`Updating: ${m.name}`)
      console.log(`  Slug: ${m.slug}`)
      console.log(`  New Checkout Slug: ${checkoutSlug}`)
      
      await prisma.membership.update({
        where: { id: m.id },
        data: { checkoutSlug }
      })
      
      console.log(`  ✅ Updated\n`)
    }
    
    console.log('✅ All memberships now have checkoutSlug')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setCheckoutSlugs()
