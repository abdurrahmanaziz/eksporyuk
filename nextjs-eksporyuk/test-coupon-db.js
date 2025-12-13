/**
 * Test database connection and coupon generation functionality
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check for admin/template coupons
    const templates = await prisma.coupon.findMany({
      where: {
        isAffiliateEnabled: true,
        isActive: true
      }
    })
    
    console.log(`📋 Found ${templates.length} template coupons:`)
    for (const template of templates) {
      console.log(`  - ${template.code}: ${template.description}`)
      console.log(`    Type: ${template.discountType}, Value: ${template.discountValue}`)
      console.log(`    Max generate: ${template.maxGeneratePerAffiliate || 'unlimited'}`)
    }
    
    // Check affiliate profiles
    const affiliateProfiles = await prisma.affiliateProfile.findMany({
      include: {
        user: {
          select: { name: true, role: true }
        }
      }
    })
    
    console.log(`\n👥 Found ${affiliateProfiles.length} affiliate profiles:`)
    for (const profile of affiliateProfiles) {
      console.log(`  - ${profile.user.name} (${profile.user.role}): ${profile.affiliateCode}`)
    }
    
    // Check generated coupons by affiliates
    const affiliateCoupons = await prisma.coupon.findMany({
      where: {
        createdBy: { not: null },
        basedOnCouponId: { not: null }
      },
      include: {
        basedOnCoupon: { select: { code: true } }
      }
    })
    
    console.log(`\n🎫 Found ${affiliateCoupons.length} affiliate-generated coupons:`)
    for (const coupon of affiliateCoupons) {
      console.log(`  - ${coupon.code} (from template: ${coupon.basedOnCoupon?.code})`)
      console.log(`    Usage: ${coupon.usageCount}/${coupon.usageLimit || '∞'}`)
      console.log(`    Active: ${coupon.isActive}`)
    }
    
    if (templates.length === 0) {
      console.log('\n⚠️  No template coupons found. Creating test template...')
      
      // Create a test template
      const testTemplate = await prisma.coupon.create({
        data: {
          code: 'TEMPLATE_DISKON10',
          description: 'Template diskon 10% untuk affiliate',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          isActive: true,
          isAffiliateEnabled: true,
          maxGeneratePerAffiliate: 5,
          maxUsagePerCoupon: 100,
          createdBy: null // Admin template
        }
      })
      
      console.log(`✅ Created test template: ${testTemplate.code}`)
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()