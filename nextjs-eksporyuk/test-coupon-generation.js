const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    console.log('🔍 Testing coupon generation fix...\n')
    
    // Get a template
    const template = await prisma.coupon.findFirst({
      where: { basedOnCouponId: null, isAffiliateEnabled: true, isActive: true }
    })
    
    if (!template) {
      console.log('❌ No template found')
      return
    }
    
    console.log(`✅ Using template: ${template.code} (ID: ${template.id})`)
    console.log(`   Discount: ${template.discountValue}${template.discountType === 'PERCENTAGE' ? '%' : ' IDR'}\n`)
    
    // Simulate coupon generation
    const newId = `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const newCode = `TEST${Date.now().toString().slice(-6)}`
    
    console.log(`📝 Creating test coupon:`)
    console.log(`   ID: ${newId}`)
    console.log(`   Code: ${newCode}`)
    console.log(`   BasedOn: ${template.id}\n`)
    
    const newCoupon = await prisma.coupon.create({
      data: {
        id: newId,
        code: newCode,
        description: `Test coupon from ${template.code}`,
        discountType: template.discountType,
        discountValue: template.discountValue,
        isActive: true,
        basedOnCouponId: template.id,
        createdBy: 'test-user',
      }
    })
    
    console.log(`✅ Coupon created successfully!`)
    console.log(`   ID: ${newCoupon.id}`)
    console.log(`   Code: ${newCoupon.code}`)
    console.log(`   CreatedAt: ${newCoupon.createdAt}`)
    console.log(`   UpdatedAt: ${newCoupon.updatedAt}\n`)
    
    // Verify it exists
    const verify = await prisma.coupon.findUnique({
      where: { id: newId }
    })
    
    if (verify) {
      console.log(`✅ Verification: Coupon exists in database!`)
    } else {
      console.log(`❌ Verification failed: Coupon not found`)
    }
    
    // Count total generated coupons
    const totalGenerated = await prisma.coupon.count({
      where: { basedOnCouponId: { not: null } }
    })
    console.log(`\n📊 Total generated coupons: ${totalGenerated}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.meta) console.error('Details:', error.meta)
  } finally {
    await prisma.$disconnect()
  }
}

test()
