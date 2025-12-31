const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    console.log('🧪 TESTING COUPON GENERATION FROM EKSPORYUK TEMPLATE\n')
    
    // 1. Get EKSPORYUK template
    const template = await prisma.coupon.findUnique({
      where: { code: 'EKSPORYUK' }
    })
    
    if (!template) {
      console.log('❌ Template EKSPORYUK not found')
      return
    }
    
    console.log('✅ Template found:')
    console.log('   Code: ' + template.code)
    console.log('   Discount: ' + template.discountValue + '%')
    console.log('   Affiliate Enabled: ' + template.isAffiliateEnabled)
    console.log('   ID: ' + template.id + '\n')
    
    // 2. Create generated coupon (simulating affiliate azizbiasa@gmail.com)
    const userId = 'cmjmtotzh001eitz0kq029lk5' // azizbiasa@gmail.com
    const customCode = 'EKSPORYUK-AZIZ-TEST-' + Date.now().toString().slice(-6)
    
    console.log('📝 Creating coupon from template:')
    console.log('   Code: ' + customCode)
    console.log('   User ID: ' + userId)
    console.log('   Based On: ' + template.id + '\n')
    
    const newCoupon = await prisma.coupon.create({
      data: {
        id: 'coupon-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
        code: customCode,
        description: 'Generated from ' + template.code + ' for affiliate',
        discountType: template.discountType,
        discountValue: template.discountValue,
        isActive: true,
        basedOnCouponId: template.id,
        createdBy: userId,
      }
    })
    
    console.log('✅ Coupon created successfully!')
    console.log('   ID: ' + newCoupon.id)
    console.log('   Code: ' + newCoupon.code)
    console.log('   CreatedAt: ' + newCoupon.createdAt)
    console.log('   UpdatedAt: ' + newCoupon.updatedAt + '\n')
    
    // 3. Verify it exists
    console.log('🔍 Verifying in database...\n')
    const verify = await prisma.coupon.findUnique({
      where: { id: newCoupon.id }
    })
    
    if (verify) {
      console.log('✅ VERIFIED: Coupon exists in database!')
      console.log('   Code: ' + verify.code)
      console.log('   CreatedBy: ' + verify.createdBy)
      console.log('   BasedOn: ' + verify.basedOnCouponId)
    } else {
      console.log('❌ FAILED: Coupon not found in database!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.meta) console.error('Details:', error.meta)
  } finally {
    await prisma.$disconnect()
  }
}

test()
