const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCoupon() {
  const couponCodes = ['TEST5ENIFJ', 'TEST5ENIFZ', 'TEST5ENIG7']

  console.log('🔍 Checking coupons in database...\n')

  for (const code of couponCodes) {
    const coupon = await prisma.coupon.findUnique({
      where: { code }
    })

    if (coupon) {
      console.log(`✅ ${code}`)
      console.log(`   Type: ${coupon.discountType}`)
      console.log(`   Value: ${coupon.discountValue}`)
      console.log(`   Active: ${coupon.isActive}`)
      console.log(`   UsageCount: ${coupon.usageCount}/${coupon.usageLimit || '∞'}`)
    } else {
      console.log(`❌ ${code} - NOT FOUND`)
    }
    console.log('')
  }

  await prisma.$disconnect()
}

checkCoupon().catch(console.error)
