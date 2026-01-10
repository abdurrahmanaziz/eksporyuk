const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAllCoupons() {
  try {
    const allCoupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        createdBy: true,
        basedOnCouponId: true,
        isActive: true,
        discountType: true,
        discountValue: true,
      }
    })
    
    console.log(`\n=== SEMUA KUPON (${allCoupons.length} total) ===`)
    allCoupons.forEach((c, idx) => {
      const type = c.createdBy ? '🏷️ AFFILIATE' : '⭐ ADMIN'
      console.log(`${idx + 1}. ${c.code} ${type}`)
      console.log(`   Discount: ${c.discountType} ${c.discountValue}`)
      console.log(`   CreatedBy: ${c.createdBy || 'null (admin)'}`)
      console.log(`   BasedOn: ${c.basedOnCouponId || 'null'}`)
      console.log(`   Active: ${c.isActive}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllCoupons()
