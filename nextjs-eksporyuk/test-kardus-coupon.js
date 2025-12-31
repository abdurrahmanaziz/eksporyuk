const { PrismaClient, Prisma } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCouponGeneration() {
  try {
    console.log('🔍 Testing Coupon Generation System\n')
    
    // Step 1: Find KARDUS template
    console.log('📋 Step 1: Looking for KARDUS template...')
    const kardusTemplate = await prisma.coupon.findFirst({
      where: {
        code: { contains: 'KARDUS', mode: 'insensitive' },
        basedOnCouponId: null,
        isAffiliateEnabled: true,
        isActive: true
      }
    })
    
    if (!kardusTemplate) {
      console.log('❌ KARDUS template not found. Available templates:')
      const allTemplates = await prisma.coupon.findMany({
        where: {
          basedOnCouponId: null,
          isAffiliateEnabled: true,
          isActive: true
        },
        select: { id: true, code: true, discountValue: true, discountType: true }
      })
      allTemplates.forEach(t => {
        console.log(`   - ${t.code}: ${t.discountValue}${t.discountType === 'PERCENTAGE' ? '%' : ' IDR'} (ID: ${t.id})`)
      })
      process.exit(1)
    }
    
    console.log(`✅ Found KARDUS template: ${kardusTemplate.code}`)
    console.log(`   Discount: ${kardusTemplate.discountValue}${kardusTemplate.discountType === 'PERCENTAGE' ? '%' : ' IDR'}`)
    console.log(`   ID: ${kardusTemplate.id}\n`)
    
    // Step 2: Generate coupon
    console.log('🚀 Step 2: Generating coupon from template...')
    
    const newCouponId = `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const newCode = `KARDUS${Date.now().toString().slice(-6)}`
    
    console.log(`   Creating coupon:`)
    console.log(`   - ID: ${newCouponId}`)
    console.log(`   - Code: ${newCode}`)
    console.log(`   - BasedOn: ${kardusTemplate.id}\n`)
    
    const newCoupon = await prisma.coupon.create({
      data: {
        id: newCouponId,
        code: newCode,
        description: `Kupon ${kardusTemplate.code} - ${kardusTemplate.discountValue}${kardusTemplate.discountType === 'PERCENTAGE' ? '%' : ' IDR'}`,
        discountType: kardusTemplate.discountType,
        discountValue: kardusTemplate.discountValue,
        isActive: true,
        basedOnCouponId: kardusTemplate.id,
        createdBy: 'azizbiasa@gmail.com', // Simulate logged-in user ID
      }
    })
    
    console.log(`✅ Coupon created successfully!`)
    console.log(`   - ID: ${newCoupon.id}`)
    console.log(`   - Code: ${newCoupon.code}`)
    console.log(`   - CreatedAt: ${newCoupon.createdAt}`)
    console.log(`   - UpdatedAt: ${newCoupon.updatedAt}\n`)
    
    // Step 3: Verify it exists
    console.log('🔍 Step 3: Verifying coupon in database...')
    const verify = await prisma.coupon.findUnique({
      where: { id: newCouponId }
    })
    
    if (verify) {
      console.log(`✅ VERIFIED: Coupon exists in database!`)
      console.log(`   Code: ${verify.code}`)
      console.log(`   BasedOn: ${verify.basedOnCouponId}\n`)
    } else {
      console.log(`❌ FAILED: Coupon not found in database\n`)
    }
    
    // Step 4: List all generated coupons
    console.log('📊 Step 4: Generated coupons by user...')
    const userCoupons = await prisma.coupon.count({
      where: {
        createdBy: 'azizbiasa@gmail.com',
        basedOnCouponId: { not: null }
      }
    })
    console.log(`   Total: ${userCoupons} coupons\n`)
    
    // Step 5: Count all generated coupons
    console.log('📊 Step 5: Total generated coupons in system...')
    const totalGenerated = await prisma.coupon.count({
      where: { basedOnCouponId: { not: null } }
    })
    console.log(`   Total: ${totalGenerated} generated coupons\n`)
    
    console.log('✅ Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.meta) {
      console.error('Details:', error.meta)
    }
    if (error.code === 'P2002') {
      console.error('Error: Unique constraint failed (code already exists)')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testCouponGeneration()
