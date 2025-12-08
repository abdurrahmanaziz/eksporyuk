const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCreateCoupon() {
  try {
    // Get admin coupon EKSPOR10
    const adminCoupon = await prisma.coupon.findFirst({
      where: {
        code: 'EKSPOR10',
        createdBy: null,
      }
    })
    
    if (!adminCoupon) {
      console.log('❌ Admin coupon EKSPOR10 not found')
      return
    }
    
    console.log('✅ Admin coupon found:', adminCoupon.id)
    console.log('   Code:', adminCoupon.code)
    console.log('   Discount:', adminCoupon.discountType, adminCoupon.discountValue)
    console.log('   isAffiliateEnabled:', adminCoupon.isAffiliateEnabled)
    
    // Try to create affiliate coupon
    console.log('\n🔄 Creating affiliate coupon RINA...')
    
    const newCoupon = await prisma.coupon.create({
      data: {
        code: 'RINA',
        description: adminCoupon.description,
        discountType: adminCoupon.discountType,
        discountValue: adminCoupon.discountValue,
        usageLimit: adminCoupon.maxUsagePerCoupon || null,
        usageCount: 0,
        validUntil: adminCoupon.validUntil,
        isActive: true,
        productIds: adminCoupon.productIds,
        membershipIds: adminCoupon.membershipIds,
        minPurchase: adminCoupon.minPurchase,
        validFrom: adminCoupon.validFrom,
        basedOnCouponId: adminCoupon.id,
        createdBy: 'test-user-id', // Dummy user ID for testing
        isAffiliateEnabled: false,
      },
    })
    
    console.log('✅ Coupon created successfully!')
    console.log('   ID:', newCoupon.id)
    console.log('   Code:', newCoupon.code)
    console.log('   CreatedBy:', newCoupon.createdBy)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCreateCoupon()
