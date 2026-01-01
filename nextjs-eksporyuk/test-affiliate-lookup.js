const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  // Test lookup with full code
  const code = 'abdurrahmanaziz-4BJ0R8'
  
  console.log('Looking for affiliate with code:', code)
  
  // Check AffiliateProfile table
  const profile = await prisma.affiliateProfile.findFirst({
    where: { affiliateCode: code },
    include: { user: { select: { name: true, username: true } } }
  })
  
  console.log('AffiliateProfile result:', profile)
  
  // Also check AffiliateLink table (maybe code is stored there)
  const link = await prisma.affiliateLink.findFirst({
    where: { uniqueCode: code },
    include: { 
      affiliate: { 
        include: { user: { select: { name: true, username: true } } } 
      } 
    }
  })
  
  console.log('AffiliateLink result:', link)
  
  // List some affiliate profiles
  const profiles = await prisma.affiliateProfile.findMany({
    take: 5,
    select: { affiliateCode: true, user: { select: { username: true } } }
  })
  console.log('Sample affiliate profiles:', profiles)
  
  // List some affiliate links
  const links = await prisma.affiliateLink.findMany({
    take: 5,
    select: { uniqueCode: true, affiliate: { select: { affiliateCode: true } } }
  })
  console.log('Sample affiliate links:', links)
}

test().then(() => prisma.$disconnect())
