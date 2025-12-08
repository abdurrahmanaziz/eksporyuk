const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function removeAllCoupons() {
  console.log('\n========================================')
  console.log('🧹 REMOVING ALL COUPONS FROM LINKS')
  console.log('========================================\n')

  try {
    // Update all affiliate links to remove couponCode
    const result = await prisma.affiliateLink.updateMany({
      where: {
        couponCode: { not: null }
      },
      data: {
        couponCode: null
      }
    })

    console.log(`✅ DONE!`)
    console.log(`   ${result.count} link(s) cleaned`)
    console.log(`   All couponCode fields set to NULL`)
    console.log('')
    console.log('🎉 Sistem sekarang simpel:')
    console.log('   - Link hanya untuk tracking (ref parameter)')
    console.log('   - Tidak ada auto-apply coupon')
    console.log('   - User bisa input coupon manual jika mau')
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeAllCoupons()
