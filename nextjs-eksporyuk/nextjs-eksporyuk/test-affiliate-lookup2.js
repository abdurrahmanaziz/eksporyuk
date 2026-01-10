const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  const code = 'abdurrahmanaziz-4BJ0R8'
  
  console.log('Looking for affiliate link with code:', code)
  
  // Check AffiliateLink table with correct field name
  const link = await prisma.affiliateLink.findFirst({
    where: { code: code },
    include: { 
      affiliate: { 
        include: { user: { select: { name: true, username: true } } } 
      } 
    }
  })
  
  console.log('AffiliateLink result:', JSON.stringify(link, null, 2))
  
  // Show sample AffiliateProfile affiliateCodes
  const profiles = await prisma.affiliateProfile.findMany({
    take: 3,
    select: { affiliateCode: true, user: { select: { name: true, username: true } } }
  })
  console.log('\nSample AffiliateProfile codes:', JSON.stringify(profiles, null, 2))
}

test().then(() => prisma.$disconnect())
