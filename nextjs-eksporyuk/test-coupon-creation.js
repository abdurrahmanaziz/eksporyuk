const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCouponCreation() {
  try {
    console.log('🧪 Testing affiliate coupon creation...\n')
    
    // Find an affiliate user
    const affiliate = await prisma.user.findFirst({
      where: { role: 'AFFILIATE' },
      include: { affiliateProfile: true }
    })
    
    if (!affiliate) {
      console.log('❌ No affiliate found in database')
      return
    }
    
    console.log(`👤 Found affiliate: ${affiliate.name} (${affiliate.email})`)
    console.log(`   Has profile: ${!!affiliate.affiliateProfile}`)
    
    if (!affiliate.affiliateProfile) {
      console.log('⚠️  Affiliate has no profile, creating one...')
      await prisma.affiliateProfile.create({
        data: {
          userId: affiliate.id,
          affiliateCode: `AFF${Date.now()}`,
          totalClicks: 0,
          totalConversions: 0,
          totalEarnings: 0
        }
      })
    }
    
    // Test 1: Custom coupon creation (what the frontend is trying to do)
    console.log('\n🔧 Testing custom coupon creation...')
    
    const testCode = `TEST${Date.now()}`
    
    try {
      const customCoupon = await prisma.coupon.create({
        data: {
          code: testCode,
          description: 'Test coupon affiliate 10% off',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          usageLimit: 100,
          usageCount: 0,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          isActive: true,
          productIds: [], // For 'all' type
          membershipIds: [], // For 'all' type
          minPurchase: null,
          validFrom: new Date(),
          basedOnCouponId: null,
          createdBy: affiliate.id,
          isAffiliateEnabled: false
        }
      })
      
      console.log('✅ Custom coupon created successfully!')
      console.log(`   ID: ${customCoupon.id}`)
      console.log(`   Code: ${customCoupon.code}`)
      console.log(`   Discount: ${customCoupon.discountValue}${customCoupon.discountType === 'PERCENTAGE' ? '%' : 'K'}`)
      
    } catch (customError) {
      console.log('❌ Custom coupon creation failed:')
      console.error(customError)
    }
    
    // Test 2: Check if there are admin coupons for template generation
    console.log('\n🔧 Checking admin coupons for templates...')
    
    const adminCoupons = await prisma.coupon.findMany({
      where: {
        createdBy: null,
        isAffiliateEnabled: true,
        isActive: true
      },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        maxGeneratePerAffiliate: true
      }
    })
    
    if (adminCoupons.length === 0) {
      console.log('⚠️  No admin coupons available for affiliate generation')
    } else {
      console.log(`✅ Found ${adminCoupons.length} admin template coupons:`)
      adminCoupons.forEach(coupon => {
        console.log(`   - ${coupon.code}: ${coupon.discountValue}${coupon.discountType === 'PERCENTAGE' ? '%' : 'K'} off`)
      })
      
      // Test template-based creation
      const firstTemplate = adminCoupons[0]
      const templateCode = `${affiliate.name?.toUpperCase().slice(0, 4) || 'TEST'}${Date.now().toString().slice(-3)}`
      
      try {
        const templateCoupon = await prisma.coupon.create({
          data: {
            code: templateCode,
            description: firstTemplate.description,
            discountType: firstTemplate.discountType,
            discountValue: firstTemplate.discountValue,
            usageLimit: firstTemplate.maxGeneratePerAffiliate || null,
            usageCount: 0,
            validUntil: firstTemplate.validUntil,
            isActive: true,
            productIds: firstTemplate.productIds,
            membershipIds: firstTemplate.membershipIds,
            minPurchase: firstTemplate.minPurchase,
            validFrom: firstTemplate.validFrom,
            basedOnCouponId: firstTemplate.id,
            createdBy: affiliate.id,
            isAffiliateEnabled: false
          }
        })
        
        console.log('✅ Template-based coupon created successfully!')
        console.log(`   ID: ${templateCoupon.id}`)
        console.log(`   Code: ${templateCoupon.code}`)
        console.log(`   Based on: ${firstTemplate.code}`)
        
      } catch (templateError) {
        console.log('❌ Template-based coupon creation failed:')
        console.error(templateError)
      }
    }
    
    // Test 3: Check user data integrity
    console.log('\n🔧 Checking user data integrity...')
    const userCheck = await prisma.user.findUnique({
      where: { id: affiliate.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    
    if (userCheck) {
      console.log('✅ User data is intact')
    } else {
      console.log('❌ User data missing - this could cause issues')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCouponCreation()