// Test API dengan fetch seperti yang browser lakukan

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testBrowserCall() {
  console.log('🌐 Testing Browser API Call...\n')

  // Get affiliate for session simulation
  const affiliate = await prisma.affiliateProfile.findFirst({
    include: { user: true }
  })
  
  if (!affiliate) {
    console.log('❌ No affiliate found')
    return
  }
  
  console.log('👤 Testing for:', affiliate.user.email)
  console.log('💰 Current balance before test:', affiliate.creditsBalance, 'credits\n')

  // Make API call exactly like browser would
  try {
    const response = await fetch('http://localhost:3000/api/affiliate/credits/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In real app, cookies would include session
      },
      body: JSON.stringify({
        packageId: 'Premium',
        credits: 200,
        price: 150000
      })
    })

    console.log('📊 Response status:', response.status)
    const result = await response.json()
    console.log('📦 Response data:', JSON.stringify(result, null, 2))

    if (response.status === 401) {
      console.log('🔓 Expected - API requires authentication (no session cookie)')
    } else if (result.success) {
      console.log('✅ API response structure matches membership pattern!')
      console.log('🎯 Payment URL:', result.paymentUrl)
    } else {
      console.log('❌ API error:', result.error)
    }

  } catch (error) {
    console.error('🚨 Fetch error:', error.message)
  }
}

testBrowserCall()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
