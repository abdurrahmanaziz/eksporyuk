const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixAffiliateStatus() {
  try {
    const email = 'azizbiasa@gmail.com'
    
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })
    
    const linkCount = await prisma.affiliateLink.count({
      where: { affiliateId: affiliate.id }
    })
    
    console.log(`Fixing affiliate status for ${email}...`)
    console.log(`Found ${linkCount} links\n`)
    
    const updated = await prisma.affiliateProfile.update({
      where: { id: affiliate.id },
      data: {
        firstLinkCreated: true,
        bankInfoCompleted: true, // Set to true to skip bank info step for now
        onboardingCompleted: true
      }
    })
    
    console.log('✅ Updated affiliate profile:')
    console.log('  firstLinkCreated:', updated.firstLinkCreated)
    console.log('  bankInfoCompleted:', updated.bankInfoCompleted)
    console.log('  onboardingCompleted:', updated.onboardingCompleted)
    console.log('\n✅ User should now see their links without onboarding popup!')
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixAffiliateStatus()
