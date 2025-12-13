/**
 * Debug coupon generation API with detailed error logging
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCouponGeneration() {
  try {
    console.log('🔍 Testing coupon generation with real data...')
    
    // Get real template ID
    const template = await prisma.coupon.findFirst({
      where: {
        isAffiliateEnabled: true,
        isActive: true
      }
    })
    
    if (!template) {
      console.log('❌ No template found')
      return
    }
    
    console.log('📋 Found template:', template.code, 'ID:', template.id)
    
    // Get real user ID with AFFILIATE role
    const affiliateUser = await prisma.user.findFirst({
      where: {
        role: 'AFFILIATE'
      },
      include: {
        affiliateProfile: true
      }
    })
    
    if (!affiliateUser) {
      console.log('❌ No affiliate user found')
      return
    }
    
    console.log('👤 Found affiliate:', affiliateUser.name, 'ID:', affiliateUser.id)
    
    // Test the exact API logic
    console.log('\n🧪 Testing API logic...')
    
    const customCode = 'TESTAPI' + Date.now().toString().slice(-4)
    console.log('🆔 Generated code:', customCode)
    
    // Check if custom code already exists (should not)
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: customCode.toUpperCase() }
    })
    
    if (existingCoupon) {
      console.log('⚠️  Code already exists')
      return
    }
    
    // Check affiliate generation limit
    if (template.maxGeneratePerAffiliate) {
      const affiliateGeneratedCount = await prisma.coupon.count({
        where: {
          createdBy: affiliateUser.id,
          basedOnCouponId: template.id,
        },
      })
      
      console.log(`📊 Affiliate generated count: ${affiliateGeneratedCount}/${template.maxGeneratePerAffiliate}`)
      
      if (affiliateGeneratedCount >= template.maxGeneratePerAffiliate) {
        console.log('⚠️  Generation limit reached')
        return
      }
    }
    
    // Create new coupon
    console.log('\n🚀 Creating coupon...')
    const newCoupon = await prisma.coupon.create({
      data: {
        code: customCode.toUpperCase(),
        description: template.description || `Kupon diskon ${template.discountValue}${template.discountType === 'PERCENTAGE' ? '%' : 'K'}`,
        discountType: template.discountType,
        discountValue: Number(template.discountValue), // Convert to number
        usageLimit: template.maxUsagePerCoupon || undefined,
        usageCount: 0,
        validUntil: template.validUntil || undefined,
        expiresAt: template.expiresAt || undefined,
        isActive: true,
        minPurchase: template.minPurchase || undefined,
        productIds: template.productIds || undefined, // Use undefined instead of null
        membershipIds: template.membershipIds || undefined, // Use undefined instead of null
        courseIds: template.courseIds || undefined, // Use undefined instead of null
        isAffiliateEnabled: false,
        maxGeneratePerAffiliate: undefined,
        maxUsagePerCoupon: undefined,
        basedOnCouponId: template.id,
        createdBy: affiliateUser.id,
      },
      include: {
        basedOnCoupon: {
          select: {
            code: true,
          }
        }
      }
    })
    
    console.log('✅ Coupon created successfully!')
    console.log(`🎫 New coupon: ${newCoupon.code}`)
    console.log(`🏷️  Based on: ${newCoupon.basedOnCoupon?.code}`)
    
  } catch (error) {
    console.error('❌ Error during test:', error)
    console.error('Error details:', error.message)
    
    // Check if it's a Prisma error
    if (error.code) {
      console.error('Prisma error code:', error.code)
    }
    
    if (error.meta) {
      console.error('Error meta:', error.meta)
    }
  } finally {
    await prisma.$disconnect()
  }
}

testCouponGeneration()