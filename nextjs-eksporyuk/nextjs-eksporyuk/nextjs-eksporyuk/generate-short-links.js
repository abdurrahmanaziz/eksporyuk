const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Generate random short code (6 characters: letters + numbers)
function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function updateAffiliateLinks() {
  console.log('🔗 GENERATING SHORT LINKS\n')
  console.log('='.repeat(80))
  
  // Get all affiliate links without shortCode
  const links = await prisma.affiliateLink.findMany({
    where: {
      OR: [
        { shortCode: null },
        { shortCode: '' }
      ]
    },
    include: {
      user: { select: { name: true, email: true } },
      membership: { select: { name: true } },
      product: { select: { name: true } }
    }
  })
  
  console.log(`\nFound ${links.length} links without short codes\n`)
  
  for (const link of links) {
    let shortCode = generateShortCode()
    
    // Ensure uniqueness
    let exists = await prisma.affiliateLink.findUnique({
      where: { shortCode }
    })
    
    while (exists) {
      shortCode = generateShortCode()
      exists = await prisma.affiliateLink.findUnique({
        where: { shortCode }
      })
    }
    
    // Update with short code and coupon
    const updated = await prisma.affiliateLink.update({
      where: { id: link.id },
      data: {
        shortCode,
        couponCode: link.couponCode || link.code.substring(0, 10).toUpperCase() // Use first 10 chars of code as coupon
      }
    })
    
    console.log(`✅ ${link.user?.name || 'Unknown'}`)
    console.log(`   Code: ${link.code}`)
    console.log(`   Short Code: ${shortCode}`)
    console.log(`   Coupon: ${updated.couponCode}`)
    if (link.membership) {
      console.log(`   Target: ${link.membership.name}`)
    }
    console.log(`   🔗 Short URL: http://localhost:3000/go/${shortCode}`)
    console.log(`   🔗 Checkout: http://localhost:3000/go/${shortCode}/checkout`)
    console.log('')
  }
  
  // Also update links that already have shortCode but no coupon
  const linksWithoutCoupon = await prisma.affiliateLink.findMany({
    where: {
      AND: [
        { shortCode: { not: null } },
        {
          OR: [
            { couponCode: null },
            { couponCode: '' }
          ]
        }
      ]
    }
  })
  
  if (linksWithoutCoupon.length > 0) {
    console.log(`\n📝 Updating ${linksWithoutCoupon.length} links with coupon codes\n`)
    
    for (const link of linksWithoutCoupon) {
      await prisma.affiliateLink.update({
        where: { id: link.id },
        data: {
          couponCode: link.code.substring(0, 10).toUpperCase()
        }
      })
      console.log(`✅ Added coupon ${link.code.substring(0, 10).toUpperCase()} to ${link.shortCode}`)
    }
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('\n📋 SUMMARY:')
  console.log(`✅ ${links.length} new short codes generated`)
  console.log(`✅ All links now have short URLs and auto-apply coupons`)
  console.log(`✅ Format: http://localhost:3000/go/ABC123`)
  console.log(`✅ Checkout: http://localhost:3000/go/ABC123/checkout`)
  console.log(`\n🎉 Short links ready to use!`)
  
  await prisma.$disconnect()
}

updateAffiliateLinks().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})
