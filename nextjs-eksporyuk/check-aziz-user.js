const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  // Find user
  const user = await prisma.user.findFirst({
    where: { email: 'azizbiasa@gmail.com' }
  })
  
  if (!user) {
    console.log('User not found')
    return
  }
  
  console.log('\n=== USER INFO ===')
  console.log('ID:', user.id)
  console.log('Email:', user.email)
  console.log('Role:', user.role)
  console.log('Username:', user.username)
  console.log('Name:', user.name)
  console.log('WhatsApp:', user.whatsapp)
  console.log('Avatar:', user.avatar ? 'Yes' : 'No')
  console.log('Email Verified:', user.emailVerified)
  
  // Get memberships
  const memberships = await prisma.userMembership.findMany({
    where: { userId: user.id },
    include: { membership: true }
  })
  
  console.log('\n=== MEMBERSHIPS ===')
  if (memberships.length === 0) {
    console.log('No memberships')
  } else {
    memberships.forEach(m => {
      console.log('- ' + m.membership.name + ' (' + m.status + ') - Tier: ' + m.membership.tier)
    })
  }
  
  // Check affiliate profile (contains onboarding status)
  const affiliateProfile = await prisma.affiliateProfile.findUnique({
    where: { userId: user.id }
  })
  
  console.log('\n=== AFFILIATE PROFILE & ONBOARDING STATUS ===')
  if (!affiliateProfile) {
    console.log('❌ NO AFFILIATE PROFILE FOUND - This is the problem!')
    console.log('User needs an AffiliateProfile record to access affiliate features')
  } else {
    console.log('✅ Has Affiliate Profile')
    console.log('Affiliate Code:', affiliateProfile.affiliateCode)
    console.log('Short Link:', affiliateProfile.shortLink)
    console.log('Tier:', affiliateProfile.tier)
    console.log('Is Active:', affiliateProfile.isActive)
    console.log('Application Status:', affiliateProfile.applicationStatus)
    console.log('')
    console.log('--- Onboarding Status ---')
    console.log('profileCompleted:', affiliateProfile.profileCompleted)
    console.log('trainingCompleted:', affiliateProfile.trainingCompleted)
    console.log('firstLinkCreated:', affiliateProfile.firstLinkCreated)
    console.log('onboardingCompleted:', affiliateProfile.onboardingCompleted)
    console.log('Bank Info:', affiliateProfile.bankName ? 'Yes' : 'No')
  }
  
  // Check affiliate links
  const links = await prisma.affiliateLink.findMany({
    where: { affiliateId: user.id },
    take: 5
  })
  
  console.log('\n=== AFFILIATE LINKS ===')
  console.log('Total links:', links.length)
  if (links.length > 0) {
    links.forEach(l => {
      console.log('- Code:', l.code, '| Clicks:', l.clicks)
    })
  }
  
  await prisma.$disconnect()
}

check().catch(e => {
  console.error(e)
  process.exit(1)
})
