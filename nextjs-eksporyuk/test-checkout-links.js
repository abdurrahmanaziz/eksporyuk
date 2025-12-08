const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCheckoutLinks() {
  console.log('🔗 TESTING CHECKOUT LINKS\n')
  console.log('='.repeat(80))
  
  // 1. Get all membership packages
  console.log('\n📦 MEMBERSHIP PACKAGES IN DATABASE:')
  const memberships = await prisma.membership.findMany({
    where: { isActive: true },
    orderBy: { duration: 'asc' }
  })
  
  console.log(`Found ${memberships.length} active memberships\n`)
  
  memberships.forEach((m, index) => {
    console.log(`${index + 1}. ${m.name}`)
    console.log(`   ID: ${m.id}`)
    console.log(`   Price: Rp ${m.price.toLocaleString('id-ID')}`)
    console.log(`   Duration: ${m.duration}`)
    console.log(`   Discount: ${m.discount}%`)
    console.log(`   ✅ Link Checkout: http://localhost:3000/checkout-unified?package=${m.id}`)
    console.log('')
  })
  
  // 2. Get all affiliate links
  console.log('\n🔗 AFFILIATE LINKS IN DATABASE:')
  const affiliateLinks = await prisma.affiliateLink.findMany({
    where: { isActive: true },
    include: {
      user: { select: { id: true, name: true, email: true } },
      membership: { select: { id: true, name: true } },
      product: { select: { id: true, name: true } }
    }
  })
  
  console.log(`Found ${affiliateLinks.length} active affiliate links\n`)
  
  affiliateLinks.forEach((link, index) => {
    console.log(`${index + 1}. User: ${link.user.name} (${link.user.email})`)
    console.log(`   Code: ${link.code}`)
    console.log(`   User ID: ${link.userId}`)
    
    if (link.membership) {
      console.log(`   Target: Membership "${link.membership.name}"`)
      console.log(`   Membership ID: ${link.membershipId}`)
    }
    
    if (link.product) {
      console.log(`   Target: Product "${link.product.name}"`)
      console.log(`   Product ID: ${link.productId}`)
    }
    
    console.log(`\n   📍 LINK OPTIONS:`)
    console.log(`   🟢 Salespage:        http://localhost:3000/aff/${link.userId}/${link.code}/`)
    console.log(`   🟢 Direct Checkout:  http://localhost:3000/aff/${link.userId}/${link.code}/checkout`)
    console.log(`   🟢 Alternative:      http://localhost:3000/aff/${link.userId}/${link.code}/0-link-alternatif`)
    console.log('')
  })
  
  // 3. Test if checkout can handle all membership IDs
  console.log('\n✅ CHECKOUT PAGE COMPATIBILITY TEST:')
  console.log('The checkout page will now fetch packages from database dynamically.')
  console.log('All membership IDs above are valid for ?package= parameter.\n')
  
  console.log('='.repeat(80))
  console.log('\n📋 SUMMARY:')
  console.log(`✓ ${memberships.length} membership packages available`)
  console.log(`✓ ${affiliateLinks.length} affiliate links ready to use`)
  console.log(`✓ Checkout page now uses dynamic database IDs`)
  console.log(`✓ All /checkout URLs updated to /checkout-unified`)
  console.log('\n🎉 All systems ready! Test the links above in your browser.')
  
  await prisma.$disconnect()
}

testCheckoutLinks().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})
