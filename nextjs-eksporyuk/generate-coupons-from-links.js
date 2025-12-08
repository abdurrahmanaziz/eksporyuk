const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function generateCouponsFromLinks() {
  console.log('\n========================================')
  console.log('🎫 GENERATE COUPONS FROM AFFILIATE LINKS')
  console.log('========================================\n')

  try {
    // Find all active affiliate links with couponCode
    const links = await prisma.affiliateLink.findMany({
      where: {
        couponCode: { not: null },
        isActive: true,
        isArchived: false,
      },
      include: {
        membership: {
          select: {
            name: true,
            price: true,
          }
        }
      }
    })

    console.log(`Found ${links.length} affiliate links with couponCode\n`)

    if (links.length === 0) {
      console.log('✅ No coupon codes to generate\n')
      return
    }

    let generated = 0
    let skipped = 0
    let errors = 0

    for (const link of links) {
      const couponCode = link.couponCode

      // Check if coupon already exists
      const existing = await prisma.coupon.findUnique({
        where: { code: couponCode }
      })

      if (existing) {
        console.log(`⏭️  SKIP: ${couponCode}`)
        console.log(`   Already exists in Coupon table`)
        console.log(`   Status: ${existing.isActive ? 'Active' : 'Inactive'}`)
        console.log('')
        skipped++
        continue
      }

      try {
        // Create coupon with default settings
        const newCoupon = await prisma.coupon.create({
          data: {
            code: couponCode,
            discountType: 'PERCENTAGE',
            discountValue: 10, // 10% default discount
            isActive: true,
            maxUses: 100, // Max 100 uses per coupon
            // No expiry date (valid forever until deactivated)
          }
        })

        console.log(`✅ CREATED: ${couponCode}`)
        console.log(`   Type: ${newCoupon.discountType}`)
        console.log(`   Value: ${newCoupon.discountValue}%`)
        console.log(`   Max Uses: ${newCoupon.maxUses}`)
        console.log(`   Package: ${link.membership?.name || 'Unknown'}`)
        console.log(`   Test URL: http://localhost:3000/go/${link.shortCode}/checkout`)
        console.log('')
        generated++
      } catch (error) {
        console.error(`❌ ERROR: ${couponCode}`)
        console.error(`   ${error.message}`)
        console.log('')
        errors++
      }
    }

    console.log('========================================')
    console.log('📊 SUMMARY')
    console.log('========================================')
    console.log(`Total links processed: ${links.length}`)
    console.log(`✅ Coupons created: ${generated}`)
    console.log(`⏭️  Coupons skipped (already exist): ${skipped}`)
    console.log(`❌ Errors: ${errors}`)
    console.log('')

    if (generated > 0) {
      console.log('🎉 SUCCESS!')
      console.log(`   ${generated} coupon(s) generated and activated`)
      console.log('   These coupons will now auto-apply at checkout')
      console.log('')
      console.log('🧪 TESTING:')
      console.log('   1. Clear browser cache & cookies')
      console.log('   2. Visit test URLs above')
      console.log('   3. Verify coupon field auto-fills')
      console.log('   4. Check discount is applied')
      console.log('')
    }

    if (skipped > 0) {
      console.log('ℹ️  NOTE:')
      console.log(`   ${skipped} coupon(s) already exist`)
      console.log('   No changes made to existing coupons')
      console.log('')
    }

    if (errors > 0) {
      console.log('⚠️  WARNING:')
      console.log(`   ${errors} coupon(s) failed to create`)
      console.log('   Check error messages above')
      console.log('')
    }

    console.log('========================================\n')

  } catch (error) {
    console.error('❌ Fatal error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  generateCouponsFromLinks()
}

module.exports = { generateCouponsFromLinks }
