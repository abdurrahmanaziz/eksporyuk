const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkGoLinks() {
  console.log('\n=== Checking /go/ Link System ===\n')
  
  // Check memberships with slugs
  const memberships = await prisma.membership.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      salesPageUrl: true,
      isActive: true
    }
  })
  
  console.log('📦 Active Memberships:')
  memberships.forEach(m => {
    console.log(`  - ${m.name}`)
    console.log(`    Slug: ${m.slug || 'NULL'}`)
    console.log(`    Sales URL: ${m.salesPageUrl || 'NULL'}`)
    console.log(`    Link: /go/${m.slug || '[NO-SLUG]'}`)
    console.log('')
  })
  
  // Check affiliate links
  const affiliateLinks = await prisma.affiliateLink.findMany({
    where: { isActive: true },
    include: {
      membership: true,
      product: true
    }
  })
  
  console.log('\n🔗 Active Affiliate Links:')
  if (affiliateLinks.length === 0) {
    console.log('  No affiliate links found!')
  } else {
    affiliateLinks.forEach(link => {
      console.log(`  - Code: ${link.code || link.shortCode}`)
      console.log(`    Type: ${link.linkType}`)
      console.log(`    Membership: ${link.membership?.name || 'N/A'}`)
      console.log(`    Product: ${link.product?.name || 'N/A'}`)
      console.log(`    Link: /go/${link.code || link.shortCode}`)
      console.log('')
    })
  }
  
  await prisma.$disconnect()
}

checkGoLinks().catch(console.error)
