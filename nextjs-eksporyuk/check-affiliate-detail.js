const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  // Get affiliate user
  const user = await prisma.user.findFirst({
    where: { email: 'azizbiasa@gmail.com' }
  })
  
  if (!user) {
    console.log('User not found')
    return
  }
  
  console.log('User ID:', user.id)
  console.log('User role:', user.role)
  
  // Get affiliate profile
  const affiliate = await prisma.affiliateProfile.findUnique({
    where: { userId: user.id }
  })
  
  if (!affiliate) {
    console.log('No affiliate profile')
    return
  }
  
  console.log('\n=== Affiliate Profile ===')
  console.log('Affiliate ID:', affiliate.id)
  console.log('Affiliate Code:', affiliate.affiliateCode)
  console.log('Is Active:', affiliate.isActive)
  
  // Check AffiliateConversion
  console.log('\n=== AffiliateConversion (by affiliateId) ===')
  const conversionsByAffiliateId = await prisma.affiliateConversion.findMany({
    where: { affiliateId: affiliate.id }
  })
  console.log('Count:', conversionsByAffiliateId.length)
  if (conversionsByAffiliateId.length > 0) {
    console.log('Sample:', JSON.stringify(conversionsByAffiliateId[0], null, 2))
  }
  
  // Check AffiliateConversion by userId
  console.log('\n=== AffiliateConversion (by userId) ===')
  const conversionsByUserId = await prisma.affiliateConversion.findMany({
    where: { userId: user.id }
  })
  console.log('Count:', conversionsByUserId.length)
  
  // Check Transaction with affiliateId
  console.log('\n=== Transaction (where affiliateId = affiliate.id) ===')
  const txByAffiliateId = await prisma.transaction.findMany({
    where: { affiliateId: affiliate.id },
    take: 5
  })
  console.log('Count:', txByAffiliateId.length)
  
  // Check Transaction with affiliateCode
  console.log('\n=== Transaction (where affiliateCode = affiliate.affiliateCode) ===')
  const txByCode = await prisma.transaction.findMany({
    where: { affiliateCode: affiliate.affiliateCode },
    take: 5
  })
  console.log('Count:', txByCode.length)
  if (txByCode.length > 0) {
    console.log('Sample:', JSON.stringify(txByCode[0], null, 2))
  }
  
  // Check all AffiliateConversions
  console.log('\n=== All AffiliateConversions in DB ===')
  const allConversions = await prisma.affiliateConversion.findMany({
    take: 10
  })
  console.log('Total count:', allConversions.length)
  if (allConversions.length > 0) {
    console.log('Unique affiliateIds:', [...new Set(allConversions.map(c => c.affiliateId))])
  }
  
  // Check schema - what fields does AffiliateConversion have?
  console.log('\n=== AffiliateConversion Sample Structure ===')
  const sampleConv = await prisma.affiliateConversion.findFirst()
  if (sampleConv) {
    console.log('Fields:', Object.keys(sampleConv))
  }
  
  await prisma.$disconnect()
}

check().catch(console.error)
