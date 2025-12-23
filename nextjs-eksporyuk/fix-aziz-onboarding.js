const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixUser() {
  const email = 'azizbiasa@gmail.com'
  
  // Find user
  const user = await prisma.user.findFirst({
    where: { email }
  })
  
  if (!user) {
    console.log('User not found')
    return
  }
  
  console.log('Found user:', user.name, '(' + user.email + ')')
  
  // Update user whatsapp if empty (needed for profile completion)
  if (!user.whatsapp) {
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        whatsapp: '628123456789',  // Placeholder - user should update later
        emailVerified: true
      }
    })
    console.log('✅ Updated user WhatsApp (placeholder)')
  }
  
  // Update affiliate profile onboarding status
  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId: user.id }
  })
  
  if (profile) {
    await prisma.affiliateProfile.update({
      where: { userId: user.id },
      data: {
        profileCompleted: true,
        profileCompletedAt: new Date(),
        trainingCompleted: true,
        trainingCompletedAt: new Date(),
        firstLinkCreated: true,
        firstLinkCreatedAt: new Date(),
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        welcomeShown: true
      }
    })
    console.log('✅ Updated affiliate onboarding status to COMPLETED')
    
    // Verify changes
    const updated = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })
    
    console.log('\n=== UPDATED STATUS ===')
    console.log('profileCompleted:', updated.profileCompleted)
    console.log('trainingCompleted:', updated.trainingCompleted)
    console.log('firstLinkCreated:', updated.firstLinkCreated)
    console.log('onboardingCompleted:', updated.onboardingCompleted)
  } else {
    console.log('❌ No affiliate profile found')
  }
  
  await prisma.$disconnect()
  console.log('\n✅ DONE! User can now access all affiliate features.')
}

fixUser().catch(e => {
  console.error(e)
  process.exit(1)
})
