require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  // Find affiliate user
  const affiliate = await prisma.affiliateProfile.findFirst({
    include: { user: true }
  })
  
  if (!affiliate) {
    console.log('No affiliate found')
    process.exit(1)
  }
  
  console.log('Found affiliate:', affiliate.user.email)
  
  // Make checkout request using fetch
  const response = await fetch('http://localhost:3000/api/affiliate/credits/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Would need session cookie for real auth
    },
    body: JSON.stringify({
      packageId: 'basic',
      credits: 50,
      price: 50000
    })
  })
  
  console.log('Response status:', response.status)
  const data = await response.json()
  console.log('Response:', JSON.stringify(data, null, 2))
}

test().catch(console.error).finally(() => prisma.$disconnect())
