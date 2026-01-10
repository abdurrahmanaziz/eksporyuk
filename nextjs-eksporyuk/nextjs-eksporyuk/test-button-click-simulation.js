const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function simulateButtonClick() {
  try {
    const userId = 'cmjmtotzh001eitz0kq029lk5'
    const templateCode = 'EKSPORYUK'
    const customCode = 'MENTOR50' // Like user typed in form
    
    console.log('🧪 SIMULATING BUTTON CLICK - "Buat Kupon"\n')
    
    // 1. Get template
    console.log('1️⃣ Finding template...')
    const template = await prisma.coupon.findUnique({
      where: { code: templateCode }
    })
    
    if (!template) {
      console.log('   ❌ Template not found')
      return
    }
    console.log(`   ✅ Found: ${template.code}\n`)
    
    // 2. Validate like endpoint would
    console.log('2️⃣ Validating like /api/affiliate/coupons/generate would...')
    
    // Check user session
    console.log('   - User session: ' + userId)
    
    // Check template active & affiliate enabled
    if (!template.isActive || !template.isAffiliateEnabled) {
      console.log('   ❌ Template not available')
      return
    }
    console.log('   ✅ Template active & affiliate enabled')
    
    // Check generation limit
    const alreadyGenerated = await prisma.coupon.count({
      where: { basedOnCouponId: template.id, createdBy: userId }
    })
    
    console.log('   ✅ Already generated: ' + alreadyGenerated + '/' + template.maxGeneratePerAffiliate)
    
    if (alreadyGenerated >= template.maxGeneratePerAffiliate) {
      console.log('   ❌ Generation limit reached')
      return
    }
    
    // Check code uniqueness
    console.log('   - Custom code: ' + customCode)
    const existingCode = await prisma.coupon.findUnique({
      where: { code: customCode }
    })
    
    if (existingCode) {
      console.log('   ❌ Code already exists: ' + customCode)
      return
    }
    console.log('   ✅ Code is unique\n')
    
    // 3. Create coupon (like endpoint POST handler)
    console.log('3️⃣ Creating coupon in database...')
    const newCoupon = await prisma.coupon.create({
      data: {
        id: `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        code: customCode,
        description: `Generated from ${template.code} template`,
        discountType: template.discountType,
        discountValue: template.discountValue,
        isActive: true,
        basedOnCouponId: template.id,
        createdBy: userId,
      }
    })
    
    console.log(`   ✅ Created: ${newCoupon.code}`)
    console.log(`   ID: ${newCoupon.id}`)
    console.log(`   CreatedAt: ${newCoupon.createdAt}\n`)
    
    // 4. Verify
    console.log('4️⃣ Verifying persistence...')
    const verify = await prisma.coupon.findUnique({
      where: { id: newCoupon.id }
    })
    
    if (verify) {
      console.log(`   ✅ VERIFIED in database`)
      console.log(`   Code: ${verify.code}`)
      console.log(`   BasedOn: ${verify.basedOnCouponId}`)
      console.log(`   CreatedBy: ${verify.createdBy}\n`)
    } else {
      console.log(`   ❌ NOT FOUND in database\n`)
      return
    }
    
    // 5. Check updated count
    console.log('5️⃣ Updated generation count:')
    const newCount = await prisma.coupon.count({
      where: { basedOnCouponId: template.id, createdBy: userId }
    })
    console.log(`   Before: ${alreadyGenerated}/${template.maxGeneratePerAffiliate}`)
    console.log(`   After:  ${newCount}/${template.maxGeneratePerAffiliate}`)
    console.log(`   Change: ${alreadyGenerated} → ${newCount}\n`)
    
    // 6. List all user coupons
    console.log('6️⃣ All coupons by user:')
    const allCoupons = await prisma.coupon.findMany({
      where: { createdBy: userId, basedOnCouponId: { not: null } },
      select: { code: true, basedOnCouponId: true }
    })
    
    allCoupons.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.code}`)
    })
    console.log(`   Total: ${allCoupons.length}\n`)
    
    console.log('✅ BUTTON CLICK SIMULATION COMPLETE - SYSTEM WORKING')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

simulateButtonClick()
