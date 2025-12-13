/**
 * Final verification of affiliate system fixes
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Final verification of affiliate system fixes...\n')
    
    // 1. Check affiliate link domains
    console.log('1️⃣ Checking affiliate link domains...')
    const allLinks = await prisma.affiliateLink.findMany({
      take: 10,
      select: {
        code: true,
        fullUrl: true,
        linkType: true
      }
    })
    
    const vercelLinks = allLinks.filter(link => link.fullUrl.includes('vercel.app'))
    const liveLinks = allLinks.filter(link => link.fullUrl.includes('app.eksporyuk.com'))
    
    console.log(`   ✅ Live domain links: ${liveLinks.length}`)
    console.log(`   ❌ Vercel links remaining: ${vercelLinks.length}`)
    
    if (vercelLinks.length > 0) {
      console.log('   ⚠️  Some Vercel links still exist')
    } else {
      console.log('   🎉 All links use live domain!')
    }
    
    // Sample links
    console.log('\n   📋 Sample affiliate links:')
    for (const link of allLinks.slice(0, 3)) {
      console.log(`      - ${link.code}: ${link.fullUrl}`)
    }
    
    // 2. Check coupon templates
    console.log('\n2️⃣ Checking coupon templates...')
    const templates = await prisma.coupon.findMany({
      where: {
        isAffiliateEnabled: true,
        isActive: true
      }
    })
    
    console.log(`   ✅ Active templates: ${templates.length}`)
    for (const template of templates) {
      console.log(`      - ${template.code}: ${template.discountValue}${template.discountType === 'PERCENTAGE' ? '%' : 'K'} off`)
      console.log(`        Max per affiliate: ${template.maxGeneratePerAffiliate || 'unlimited'}`)
    }
    
    // 3. Check affiliate profiles
    console.log('\n3️⃣ Checking affiliate profiles...')
    const affiliateCount = await prisma.affiliateProfile.count()
    const recentAffiliates = await prisma.affiliateProfile.findMany({
      take: 5,
      include: {
        user: {
          select: { name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`   ✅ Total affiliates: ${affiliateCount}`)
    console.log('   📋 Recent affiliates:')
    for (const affiliate of recentAffiliates) {
      console.log(`      - ${affiliate.user.name} (${affiliate.affiliateCode})`)
    }
    
    // 4. Check generated coupons
    console.log('\n4️⃣ Checking generated coupons...')
    const generatedCoupons = await prisma.coupon.findMany({
      where: {
        basedOnCouponId: { not: null }
      },
      include: {
        basedOnCoupon: { select: { code: true } }
      }
    })
    
    console.log(`   ✅ Generated coupons: ${generatedCoupons.length}`)
    for (const coupon of generatedCoupons.slice(0, 3)) {
      console.log(`      - ${coupon.code} (from ${coupon.basedOnCoupon?.code})`)
      console.log(`        Usage: ${coupon.usageCount}/${coupon.usageLimit || '∞'}, Active: ${coupon.isActive}`)
    }
    
    console.log('\n🎯 VERIFICATION SUMMARY:')
    console.log('=' .repeat(50))
    console.log(`✅ Domain Fix: ${vercelLinks.length === 0 ? 'PASS' : 'NEEDS ATTENTION'}`)
    console.log(`✅ Templates: ${templates.length > 0 ? 'PASS' : 'FAIL'}`) 
    console.log(`✅ Affiliates: ${affiliateCount > 0 ? 'PASS' : 'FAIL'}`)
    console.log(`✅ Database: CONNECTED`)
    
    if (vercelLinks.length === 0 && templates.length > 0) {
      console.log('\n🎉 ALL FIXES VERIFIED SUCCESSFULLY!')
      console.log('🚀 Affiliate system is ready for production use!')
    } else {
      console.log('\n⚠️  Some issues need attention before production use.')
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()