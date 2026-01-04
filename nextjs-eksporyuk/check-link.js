const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAffiliateLink() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: 'abdurrahmanaziz@gmail.com'
      },
      include: {
        affiliateProfile: true
      }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('\n📊 CURRENT DATA:')
    console.log('- Username:', user.username || '❌ NULL')
    console.log('- Affiliate Code:', user.affiliateProfile?.affiliateCode || 'N/A')
    console.log('- Short Link:', user.affiliateProfile?.shortLink || 'N/A')
    console.log('- Short Link Username:', user.affiliateProfile?.shortLinkUsername || '❌ NULL')

    const displayUsername = user.username || user.affiliateProfile?.shortLinkUsername || user.affiliateProfile?.affiliateCode
    console.log('\n✅ EXPECTED LINK:', `https://eksporyuk.app/${displayUsername}`)

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAffiliateLink()
