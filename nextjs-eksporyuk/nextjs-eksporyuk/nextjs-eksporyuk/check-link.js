const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAffiliateLink() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        role: 'AFFILIATE',
        affiliateProfile: { isNot: null }
      },
      include: {
        affiliateProfile: true
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!user) {
      console.log('❌ No affiliate found')
      return
    }

    console.log('\n📊 CURRENT DATA:')
    console.log('- Name:', user.name)
    console.log('- Email:', user.email)
    console.log('- Username:', user.username || '❌ NULL')
    console.log('- Affiliate Code:', user.affiliateProfile.affiliateCode)
    console.log('- Short Link (DB):', user.affiliateProfile.shortLink)
    console.log('- Short Link Username:', user.affiliateProfile.shortLinkUsername || '❌ NULL')

    const displayUsername = user.username || user.affiliateProfile.shortLinkUsername || user.affiliateProfile.affiliateCode
    console.log('\n✅ EXPECTED LINK (New Logic):', `https://eksporyuk.app/${displayUsername}`)
    
    console.log('\n💡 STATUS:')
    if (!user.username) {
      console.log('⚠️  Username NULL - using fallback:', displayUsername)
    } else {
      console.log('✅ Using username:', user.username)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAffiliateLink()
