const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAzizOnboardingStatus() {
  try {
    console.log('🧪 Testing azizbiasa@gmail.com onboarding status for guard...')
    
    const user = await prisma.user.findFirst({
      where: { email: 'azizbiasa@gmail.com' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        affiliateProfile: {
          select: {
            profileCompleted: true,
            onboardingCompleted: true,
            trainingCompleted: true,
            firstLinkCreated: true,
            applicationStatus: true,
            welcomeShown: true,
            bankName: true,
            bankAccountName: true,
            bankAccountNumber: true
          }
        }
      }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log(`👤 User: ${user.name} (${user.email})`)
    console.log(`🎭 Role: ${user.role}`)
    
    if (user.affiliateProfile) {
      const profile = user.affiliateProfile
      console.log('\n🎯 Affiliate Profile Status:')
      console.log(`   Application Status: ${profile.applicationStatus}`)
      console.log(`   Profile Completed: ${profile.profileCompleted}`)
      console.log(`   Onboarding Completed: ${profile.onboardingCompleted}`)
      console.log(`   Training Completed: ${profile.trainingCompleted}`)
      console.log(`   First Link Created: ${profile.firstLinkCreated}`)
      console.log(`   Welcome Shown: ${profile.welcomeShown}`)

      // Check if needs onboarding (same logic as guard)
      const needsOnboarding = !profile.profileCompleted || !profile.onboardingCompleted
      
      console.log('\n🔍 Onboarding Guard Analysis:')
      console.log(`   Needs Onboarding: ${needsOnboarding}`)
      
      if (needsOnboarding) {
        console.log('   🚫 WOULD BE REDIRECTED to /affiliate/onboarding')
      } else {
        console.log('   ✅ CAN ACCESS all affiliate features')
      }

      // Check what the API would return
      const bankInfoCompleted = !!(profile.bankName && profile.bankAccountName && profile.bankAccountNumber)
      const apiNeedsOnboarding = !profile.profileCompleted || !bankInfoCompleted
      
      console.log('\n🔗 API Onboarding Check:')
      console.log(`   Bank Name: ${profile.bankName || 'None'}`)
      console.log(`   Bank Account: ${profile.bankAccountName || 'None'}`) 
      console.log(`   Bank Number: ${profile.bankAccountNumber || 'None'}`)
      console.log(`   Bank Info Completed: ${bankInfoCompleted}`)
      console.log(`   API Needs Onboarding: ${apiNeedsOnboarding}`)
      
    } else {
      console.log('\n❌ No affiliate profile found')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAzizOnboardingStatus()
