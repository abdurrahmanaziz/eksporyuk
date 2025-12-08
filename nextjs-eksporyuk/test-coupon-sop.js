const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCouponSOP() {
  console.log('========================================')
  console.log('🧪 TESTING COUPON SOP')
  console.log('========================================\n')

  // Get all affiliate links with couponCode
  const links = await prisma.affiliateLink.findMany({
    where: {
      isActive: true,
      isArchived: false,
      couponCode: { not: null }
    },
    include: {
      membership: {
        select: { name: true, slug: true }
      }
    }
  })

  console.log(`📦 Found ${links.length} affiliate links with couponCode\n`)

  for (const link of links) {
    console.log(`\n🔗 Link: ${link.membership?.name || 'Unknown'}`)
    console.log(`   Code: ${link.code}`)
    console.log(`   Short: ${link.shortCode}`)
    console.log(`   CouponCode in Link: ${link.couponCode}`)

    // Check if coupon exists in Coupon table
    const coupon = await prisma.coupon.findUnique({
      where: { code: link.couponCode }
    })

    if (coupon) {
      console.log(`   ✅ COUPON EXISTS IN DATABASE`)
      console.log(`      Type: ${coupon.discountType}`)
      console.log(`      Value: ${coupon.discountValue}`)
      console.log(`      Active: ${coupon.isActive}`)
      console.log(`   ✅ SOP: Will auto-apply`)
    } else {
      console.log(`   ❌ COUPON NOT GENERATED YET`)
      console.log(`   ❌ SOP: Field stays empty, no discount`)
    }

    // Show URL
    const url = `http://localhost:3000/go/${link.shortCode}/checkout`
    console.log(`   URL: ${url}`)
  }

  console.log('\n========================================')
  console.log('📋 SOP SUMMARY')
  console.log('========================================')
  console.log('1. Affiliate link CAN have couponCode (future plan)')
  console.log('2. Coupon ONLY applied if EXISTS in Coupon table')
  console.log('3. If NOT generated → Field EMPTY, no discount')
  console.log('4. If IS generated → Auto-fill + auto-apply')
  console.log('========================================\n')

  await prisma.$disconnect()
}

testCouponSOP().catch(console.error)
