const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testGenerateLink() {
  try {
    console.log('🧪 Testing link generation logic...\n')
    
    // Get first affiliate
    const affiliate = await prisma.affiliateProfile.findFirst({
      where: { isActive: true },
      include: { user: true }
    })
    
    if (!affiliate) {
      console.log('❌ No active affiliate found')
      return
    }
    
    console.log(`✅ Found affiliate: ${affiliate.user.name} (${affiliate.affiliateCode})`)
    
    // Get first active membership
    const membership = await prisma.membership.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        price: true,
        affiliateCommissionRate: true,
      }
    })
    
    if (!membership) {
      console.log('❌ No active membership found')
      return
    }
    
    console.log(`✅ Found membership: ${membership.name}`)
    console.log(`   Slug: ${membership.slug}`)
    console.log(`   Checkout Slug: ${membership.checkoutSlug}`)
    console.log(`   Commission: ${membership.affiliateCommissionRate}%`)
    
    // Simulate link generation
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.NEXTAUTH_URL ||
                    'https://eksporyuk.com').trim().replace(/\/+$/, '')
    
    console.log(`\n🔗 Base URL: ${baseUrl}`)
    
    // Generate test links
    const linkCode = `${affiliate.affiliateCode}-TEST123`
    
    const salesPageUrl = `${baseUrl}/membership/${membership.slug || membership.checkoutSlug}?ref=${linkCode}`
    const checkoutUrl = `${baseUrl}/checkout/${membership.checkoutSlug || membership.slug}?ref=${linkCode}`
    const checkoutProUrl = `${baseUrl}/checkout/pro?ref=${linkCode}`
    
    console.log(`\n📋 Generated URLs:`)
    console.log(`   1. Sales Page: ${salesPageUrl}`)
    console.log(`   2. Checkout: ${checkoutUrl}`)
    console.log(`   3. Checkout Pro: ${checkoutProUrl}`)
    
    // Check for issues
    const hasNewline = salesPageUrl.includes('\n') || checkoutUrl.includes('\n')
    const hasDoubleSlash = salesPageUrl.includes('//m') || checkoutUrl.includes('//c')
    
    console.log(`\n✅ URL Validation:`)
    console.log(`   Newlines: ${hasNewline ? '❌ FOUND' : '✅ NONE'}`)
    console.log(`   Double slashes: ${hasDoubleSlash ? '❌ FOUND' : '✅ NONE'}`)
    
    // Check existing links count
    const existingLinksCount = await prisma.affiliateLink.count({
      where: {
        affiliateId: affiliate.id,
        membershipId: membership.id
      }
    })
    
    console.log(`\n📊 Existing links for this membership: ${existingLinksCount}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testGenerateLink()
