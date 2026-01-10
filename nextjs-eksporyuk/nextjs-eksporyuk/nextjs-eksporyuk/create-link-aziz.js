const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createLinkForAziz() {
  try {
    console.log('🔍 Creating affiliate link for azizbiasa@gmail.com...')
    
    // 1. Get user
    const user = await prisma.user.findUnique({
      where: { email: 'azizbiasa@gmail.com' },
      include: {
        affiliateProfile: true
      }
    })
    
    if (!user) {
      console.error('❌ User not found')
      return
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role
    })
    
    if (!user.affiliateProfile) {
      console.error('❌ No affiliate profile')
      return
    }
    
    console.log('✅ Affiliate Profile:', {
      id: user.affiliateProfile.id,
      code: user.affiliateProfile.affiliateCode,
      status: user.affiliateProfile.applicationStatus,
      isActive: user.affiliateProfile.isActive
    })
    
    // 2. Get active membership
    const membership = await prisma.membership.findFirst({
      where: {
        isActive: true
      }
    })
    
    if (!membership) {
      console.error('❌ No active membership found')
      return
    }
    
    console.log('✅ Membership found:', {
      id: membership.id,
      name: membership.name,
      slug: membership.slug
    })
    
    // 3. Check if link already exists
    const existingLink = await prisma.affiliateLink.findFirst({
      where: {
        affiliateId: user.affiliateProfile.id,
        membershipId: membership.id,
        linkType: 'SALESPAGE_INTERNAL'
      }
    })
    
    if (existingLink) {
      console.log('⚠️  Link already exists:', existingLink.fullUrl)
      return
    }
    
    // 4. Create the link
    const code = `${user.affiliateProfile.affiliateCode}-${membership.slug}-${Date.now()}`
    const fullUrl = `https://eksporyuk.com/membership/${membership.slug}?ref=${user.affiliateProfile.affiliateCode}`
    
    const newLink = await prisma.affiliateLink.create({
      data: {
        userId: user.id,
        affiliateId: user.affiliateProfile.id,
        membershipId: membership.id,
        code: code,
        linkType: 'SALESPAGE_INTERNAL',
        fullUrl: fullUrl,
        isActive: true,
        isArchived: false
      }
    })
    
    console.log('\n✅ SUCCESS! Link created:')
    console.log('📝 ID:', newLink.id)
    console.log('🔗 Code:', newLink.code)
    console.log('🌐 URL:', newLink.fullUrl)
    console.log('📊 Type:', newLink.linkType)
    console.log('✅ Active:', newLink.isActive)
    
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

createLinkForAziz()
