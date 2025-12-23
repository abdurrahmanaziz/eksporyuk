const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Generate random affiliate code
function generateAffiliateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function fixSultanAzizAffiliate() {
  try {
    console.log('🔧 Fixing Sultan Aziz affiliate activation...')
    
    // Find Sultan Aziz user
    const sultanUser = await prisma.user.findFirst({
      where: {
        email: 'azizbiasa@gmail.com'
      }
    })

    if (!sultanUser) {
      console.log('❌ Sultan Aziz user not found')
      return
    }

    console.log(`✅ Found user: ${sultanUser.name} (${sultanUser.email})`)

    // Check if affiliate profile already exists
    const existingProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: sultanUser.id }
    })

    if (existingProfile) {
      console.log('⚠️  Affiliate profile already exists!')
      console.log('   Code:', existingProfile.affiliateCode)
      console.log('   Status:', existingProfile.applicationStatus)
      return
    }

    // Generate unique affiliate code
    let affiliateCode
    let isUnique = false
    while (!isUnique) {
      affiliateCode = generateAffiliateCode()
      const existing = await prisma.affiliateProfile.findFirst({
        where: { affiliateCode }
      })
      if (!existing) isUnique = true
    }

    // Create affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.create({
      data: {
        userId: sultanUser.id,
        affiliateCode: affiliateCode,
        shortLink: `https://eksporyuk.com/r/${affiliateCode}`,
        applicationStatus: 'APPROVED', // Directly approve
        approvedAt: new Date(),
        isActive: true,
        profileCompleted: false, // Will be completed through onboarding
        onboardingCompleted: false,
        trainingCompleted: false,
        firstLinkCreated: false,
        welcomeShown: false
      }
    })

    console.log('✅ Affiliate profile created successfully!')
    console.log('   Code:', affiliateProfile.affiliateCode)
    console.log('   Short Link:', affiliateProfile.shortLink)

    // Create wallet if doesn't exist
    let wallet = await prisma.wallet.findUnique({
      where: { userId: sultanUser.id }
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: sultanUser.id,
          balance: 0,
          balancePending: 0,
          totalEarnings: 0,
          totalWithdrawn: 0
        }
      })
      console.log('✅ Wallet created')
    } else {
      console.log('✅ Wallet already exists')
    }

    console.log('')
    console.log('🎉 Sultan Aziz is now ready for affiliate onboarding!')
    console.log('   Next: User needs to complete mandatory onboarding at /affiliate/onboarding')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSultanAzizAffiliate()
