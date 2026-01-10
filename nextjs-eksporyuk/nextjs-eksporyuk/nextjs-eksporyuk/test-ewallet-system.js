const { prisma } = require('./src/lib/prisma')

async function testEWalletSystem() {
  console.log('🔍 Testing E-Wallet Account System...\n')

  try {
    // Test phone numbers
    const testData = [
      { provider: 'OVO', phoneNumber: '08118748177' },
      { provider: 'GoPay', phoneNumber: '628123456789' },
      { provider: 'DANA', phoneNumber: '+628987654321' },
      { provider: 'LinkAja', phoneNumber: '08111222333' },
      { provider: 'ShopeePay', phoneNumber: '62811999888' }
    ]

    console.log('📱 Test Data:')
    testData.forEach(data => {
      console.log(`  ${data.provider}: ${data.phoneNumber}`)
    })
    console.log()

    // Test API calls
    console.log('🌐 Testing API calls...')
    for (const data of testData) {
      try {
        const response = await fetch('http://localhost:3000/api/ewallet/check-name', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token' // You'll need a real session
          },
          body: JSON.stringify({
            phoneNumber: data.phoneNumber,
            provider: data.provider,
            useCache: false // Force fresh check first time
          })
        })

        const result = await response.json()
        console.log(`  ✅ ${data.provider} (${data.phoneNumber}):`)
        console.log(`     Success: ${result.success}`)
        console.log(`     Name: ${result.accountName || 'Not found'}`)
        console.log(`     Message: ${result.message}`)
        console.log(`     Cached: ${result.cached}`)
        console.log()

      } catch (error) {
        console.log(`  ❌ ${data.provider}: API Error - ${error.message}`)
      }
    }

    // Check database cache
    console.log('🗄️  Checking database cache...')
    const cachedAccounts = await prisma.eWalletAccount.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    console.log(`Found ${cachedAccounts.length} cached accounts:`)
    cachedAccounts.forEach(account => {
      console.log(`  ${account.provider}: ${account.phoneNumber} → ${account.accountName}`)
      console.log(`    Verified: ${account.isVerified}, Last checked: ${account.lastChecked}`)
    })
    console.log()

    // Test cache performance
    console.log('⚡ Testing cache performance...')
    const startTime = Date.now()
    
    // First call (should hit database cache)
    await fetch('http://localhost:3000/api/ewallet/check-name', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        phoneNumber: '08118748177',
        provider: 'OVO',
        useCache: true
      })
    })

    const cachedTime = Date.now() - startTime
    console.log(`  Cache lookup took: ${cachedTime}ms`)

    // Provider configuration check
    console.log('⚙️  Provider configuration:')
    const providers = ['OVO', 'GoPay', 'DANA', 'LinkAja', 'ShopeePay']
    providers.forEach(provider => {
      const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`]
      const endpoint = process.env[`${provider.toUpperCase()}_API_ENDPOINT`]
      console.log(`  ${provider}:`)
      console.log(`    API Key: ${apiKey ? '✅ Configured' : '❌ Missing'}`)
      console.log(`    Endpoint: ${endpoint ? '✅ Set' : '❌ Not set'}`)
    })

    console.log('\n✅ E-Wallet system test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Helper function to normalize phone numbers
function normalizePhone(phone) {
  let normalized = phone.replace(/\D/g, '')
  if (normalized.startsWith('0')) {
    normalized = '62' + normalized.substring(1)
  }
  if (!normalized.startsWith('62')) {
    normalized = '62' + normalized
  }
  return normalized
}

console.log('📋 Phone Number Normalization Test:')
const testPhones = ['08118748177', '628118748177', '+628118748177', '8118748177']
testPhones.forEach(phone => {
  console.log(`  ${phone} → ${normalizePhone(phone)}`)
})
console.log()

if (require.main === module) {
  testEWalletSystem()
}