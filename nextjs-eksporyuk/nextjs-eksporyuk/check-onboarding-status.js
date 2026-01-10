const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkOnboardingStatus() {
  try {
    const email = 'azizbiasa@gmail.com'
    
    console.log(`Checking onboarding status for ${email}...\n`)
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        profileCompleted: true,
        emailVerified: true
      }
    })
    
    if (!user) {
      console.error('❌ User not found')
      return
    }
    
    console.log('👤 USER INFO:')
    console.log('  ID:', user.id)
    console.log('  Name:', user.name || 'NOT SET')
    console.log('  Email:', user.email)
    console.log('  Phone:', user.phone || 'NOT SET')
    console.log('  WhatsApp:', user.whatsapp || 'NOT SET')
    console.log('  Profile Completed:', user.profileCompleted ? '✅ YES' : '❌ NO')
    console.log('  Email Verified:', user.emailVerified ? '✅ YES' : '❌ NO')
    
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })
    
    if (!affiliate) {
      console.error('\n❌ Affiliate profile not found')
      return
    }
    
    console.log('\n🎯 AFFILIATE PROFILE:')
    console.log('  ID:', affiliate.id)
    console.log('  Code:', affiliate.affiliateCode)
    console.log('  Status:', affiliate.applicationStatus)
    console.log('  Active:', affiliate.isActive ? '✅ YES' : '❌ NO')
    console.log('  Profile Completed (affiliate):', affiliate.profileCompleted ? '✅ YES' : '❌ NO')
    console.log('  Training Completed:', affiliate.trainingCompleted ? '✅ YES' : '❌ NO')
    console.log('  First Link Created:', affiliate.firstLinkCreated ? '✅ YES' : '❌ NO')
    console.log('  Bank Info Completed:', affiliate.bankInfoCompleted ? '✅ YES' : '❌ NO')
    console.log('  Onboarding Completed:', affiliate.onboardingCompleted ? '✅ YES' : '❌ NO')
    console.log('  Welcome Shown:', affiliate.welcomeShown ? '✅ YES' : '❌ NO')
    
    const linkCount = await prisma.affiliateLink.count({
      where: { affiliateId: affiliate.id }
    })
    
    console.log('\n📊 STATS:')
    console.log('  Total Links:', linkCount)
    
    console.log('\n🔍 DIAGNOSIS:')
    
    const needsProfile = !user.profileCompleted && !affiliate.profileCompleted
    const needsTraining = !affiliate.trainingCompleted
    const needsWelcome = affiliate.applicationStatus === 'APPROVED' && !affiliate.welcomeShown
    
    if (needsWelcome) {
      console.log('  ⚠️  Should redirect to /affiliate/welcome first')
    }
    
    if (needsProfile) {
      console.log('  ⚠️  Needs to complete profile (missing name/phone/whatsapp)')
      console.log('      → Will redirect to /affiliate/onboarding')
    }
    
    if (needsTraining) {
      console.log('  ⚠️  Needs to complete training')
    }
    
    if (linkCount === 0) {
      console.log('  ⚠️  No links generated yet')
    } else {
      console.log(`  ✅ Has ${linkCount} links`)
    }
    
    if (!needsProfile && !needsWelcome && linkCount > 0) {
      console.log('\n✅ User should be able to access /affiliate/links page')
    } else {
      console.log('\n❌ User will be redirected from /affiliate/links')
      console.log('   Reason:', needsWelcome ? 'Needs welcome' : needsProfile ? 'Profile incomplete' : 'Unknown')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkOnboardingStatus()
