const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testGenerate() {
  try {
    console.log('🧪 Testing direct link generation for azizbiasa@gmail.com\n')
    
    // Get user & affiliate
    const user = await prisma.user.findUnique({
      where: { email: 'azizbiasa@gmail.com' },
      include: {
        affiliateProfile: true
      }
    })
    
    if (!user || !user.affiliateProfile) {
      console.log('❌ User or affiliate not found')
      return
    }
    
    console.log('✅ User:', user.email)
    console.log('✅ Affiliate Code:', user.affiliateProfile.affiliateCode)
    console.log('✅ Status:', user.affiliateProfile.applicationStatus)
    
    // Get memberships
    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
      take: 2
    })
    
    console.log(`\n📋 Found ${memberships.length} memberships`)
    
    if (memberships.length === 0) {
      console.log('❌ No memberships available')
      return
    }
    
    const membership = memberships[0]
    console.log(`\n🎯 Testing with: ${membership.name}`)
    console.log('   Slug:', membership.slug)
    console.log('   Checkout:', membership.checkoutSlug)
    
    // Generate link code
    const linkCode = `${user.affiliateProfile.affiliateCode}-${membership.slug || membership.checkoutSlug}-${Date.now()}`
    console.log('\n🔗 Generated Code:', linkCode)
    
    // Build URLs
    const baseUrl = 'https://eksporyuk.com'
    const salesPageUrl = membership.slug 
      ? `${baseUrl}/membership/${membership.slug}?ref=${linkCode}`
      : null
    const checkoutUrl = membership.checkoutSlug
      ? `${baseUrl}/checkout/${membership.checkoutSlug}?ref=${linkCode}`
      : null
    
    console.log('\n📍 URLs to create:')
    if (salesPageUrl) console.log('   Sales:', salesPageUrl)
    if (checkoutUrl) console.log('   Checkout:', checkoutUrl)
    
    // Try to create link
    console.log('\n⚙️  Creating affiliate link in database...')
    
    const linkData = {
      id: `link_${Date.now()}`,
      userId: user.id,
      affiliateId: user.affiliateProfile.id,
      membershipId: membership.id,
      code: linkCode,
      linkType: 'SALES_PAGE',
      fullUrl: salesPageUrl || checkoutUrl,
      isActive: true,
    }
    
    console.log('\nData to insert:', JSON.stringify(linkData, null, 2))
    
    const createdLink = await prisma.affiliateLink.create({
      data: linkData
    })
    
    console.log('\n✅ LINK CREATED SUCCESSFULLY!')
    console.log('   ID:', createdLink.id)
    console.log('   Code:', createdLink.code)
    console.log('   URL:', createdLink.fullUrl)
    console.log('   Type:', createdLink.linkType)
    
    console.log('\n🎉 TEST PASSED - Link generation works in database!')
    console.log('   Problem might be in the API endpoint or UI')
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error('\nStack:', error.stack)
    
    if (error.code) {
      console.error('\nError Code:', error.code)
    }
    if (error.meta) {
      console.error('\nError Meta:', JSON.stringify(error.meta, null, 2))
    }
  } finally {
    await prisma.$disconnect()
  }
}

testGenerate()
