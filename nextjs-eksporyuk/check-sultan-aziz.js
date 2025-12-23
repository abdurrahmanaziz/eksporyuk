const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkSultanAzizUser() {
  try {
    console.log('🔍 Searching for Sultan Aziz user...')
    
    // Search by name variations
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'Sultan', mode: 'insensitive' } },
          { name: { contains: 'Aziz', mode: 'insensitive' } },
          { email: { contains: 'sultan', mode: 'insensitive' } },
          { email: { contains: 'aziz', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        affiliateProfile: {
          select: {
            id: true,
            affiliateCode: true,
            applicationStatus: true,
            profileCompleted: true,
            onboardingCompleted: true,
            welcomeShown: true,
            createdAt: true,
            approvedAt: true
          }
        }
      }
    })

    console.log(`📊 Found ${users.length} users matching Sultan/Aziz:`)
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Created: ${user.createdAt}`)
      
      console.log(`🎯 Affiliate Profile:`)
      if (user.affiliateProfile) {
        console.log(`   Code: ${user.affiliateProfile.affiliateCode}`)
        console.log(`   Status: ${user.affiliateProfile.applicationStatus}`)
        console.log(`   Profile Complete: ${user.affiliateProfile.profileCompleted}`)
        console.log(`   Onboarding Complete: ${user.affiliateProfile.onboardingCompleted}`)
        console.log(`   Welcome Shown: ${user.affiliateProfile.welcomeShown}`)
        console.log(`   Approved: ${user.affiliateProfile.approvedAt}`)
      } else {
        console.log('   ❌ No affiliate profile found')
      }
      console.log('---')
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSultanAzizUser()
