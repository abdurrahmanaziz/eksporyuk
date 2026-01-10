const { PrismaClient } = require('./nextjs-eksporyuk/node_modules/@prisma/client')
const prisma = new PrismaClient()

async function checkAffiliateLink() {
  try {
    // Get user with affiliate profile
    const user = await prisma.user.findFirst({
      where: {
        role: 'AFFILIATE',
        affiliateProfile: {
          isNot: null
        }
      },
      include: {
        affiliateProfile: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!user) {
      console.log('❌ No affiliate user found')
      return
    }

    console.log('\n📊 AFFILIATE LINK CHECK')
    console.log('========================')
    console.log('\n👤 USER DATA:')
    console.log('- ID:', user.id)
    console.log('- Name:', user.name)
    console.log('- Email:', user.email)
    console.log('- Username:', user.username || '❌ NULL')
    console.log('- Role:', user.role)

    console.log('\n🔗 AFFILIATE PROFILE:')
    console.log('- Affiliate Code:', user.affiliateProfile.affiliateCode)
    console.log('- Short Link:', user.affiliateProfile.shortLink)
    console.log('- Short Link Username:', user.affiliateProfile.shortLinkUsername || '❌ NULL')

    console.log('\n✅ EXPECTED LINK (based on new logic):')
    const displayUsername = user.username || user.affiliateProfile.shortLinkUsername || user.affiliateProfile.affiliateCode
    console.log(`https://eksporyuk.app/${displayUsername}`)

    console.log('\n💡 RECOMMENDATION:')
    if (!user.username) {
      console.log('⚠️  User.username is NULL - will use shortLinkUsername or affiliateCode as fallback')
      console.log('   To fix: User should set username in profile settings')
    } else {
      console.log('✅ User has username - link should show: https://eksporyuk.app/' + user.username)
    }

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAffiliateLink()
