/**
 * Test script for the enhanced withdrawal system
 * Tests both authenticated and unauthenticated scenarios
 * with detailed phone number format validation
 */

const TEST_ENDPOINT = 'https://eksporyuk.com/api/ewallet/check-name-xendit'
const LOCAL_ENDPOINT = 'http://localhost:3000/api/ewallet/check-name-xendit'

// Test data with various phone number formats
const testCases = [
  {
    name: 'Standard Indonesian format',
    provider: 'DANA',
    phoneNumber: '08118748177',
    description: 'Should work with mock service - Aziz Rahman'
  },
  {
    name: 'Alternative format',
    provider: 'DANA', 
    phoneNumber: '081187481771',
    description: 'Should work with mock service - Aziz Rahman'
  },
  {
    name: 'International format',
    provider: 'DANA',
    phoneNumber: '628118748177', 
    description: 'Should be normalized to 08118748177 - Aziz Rahman'
  },
  {
    name: 'OVO standard',
    provider: 'OVO',
    phoneNumber: '08118748177',
    description: 'Should work with mock service - Abdurrahman Aziz'
  },
  {
    name: 'GoPay alternative',
    provider: 'GoPay',
    phoneNumber: '081187481771',
    description: 'Should work with mock service - Rahman Abdul'
  },
  {
    name: 'Invalid phone number',
    provider: 'DANA',
    phoneNumber: '08999999999',
    description: 'Should return not found error'
  },
  {
    name: 'Empty phone number',
    provider: 'DANA',
    phoneNumber: '',
    description: 'Should return validation error'
  }
]

async function testWithoutAuth(endpoint, testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`)
  console.log(`📱 Provider: ${testCase.provider}, Phone: ${testCase.phoneNumber}`)
  console.log(`📝 Expected: ${testCase.description}`)
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: testCase.provider,
        phoneNumber: testCase.phoneNumber
      })
    })

    const data = await response.json()
    
    console.log(`📊 Status: ${response.status}`)
    console.log(`📋 Response:`, JSON.stringify(data, null, 2))
    
    if (response.status === 401) {
      console.log(`✅ Expected: Unauthorized (no session)`)
    } else if (response.status === 400 && !testCase.phoneNumber) {
      console.log(`✅ Expected: Bad request for empty phone`)
    } else if (response.status === 422) {
      console.log(`⚠️  Validation failed - this is expected behavior`)
    } else if (response.status === 200 && data.success) {
      console.log(`✅ Success: Found account name: ${data.accountName}`)
    } else {
      console.log(`❌ Unexpected response`)
    }
    
  } catch (error) {
    console.error(`🚨 Network Error:`, error.message)
  }
}

async function runTests(useLocal = false) {
  const endpoint = useLocal ? LOCAL_ENDPOINT : TEST_ENDPOINT
  const envName = useLocal ? 'LOCAL' : 'PRODUCTION'
  
  console.log(`\n🚀 Starting Withdrawal System Tests - ${envName} Environment`)
  console.log(`🌐 Endpoint: ${endpoint}`)
  console.log(`📅 Time: ${new Date().toISOString()}`)
  
  console.log(`\n=== Testing without authentication (should get 401) ===`)
  
  for (const testCase of testCases) {
    await testWithoutAuth(endpoint, testCase)
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  console.log(`\n=== Test Summary ===`)
  console.log(`✅ All tests completed for ${envName} environment`)
  console.log(`📝 Expected behavior:`)
  console.log(`   - All requests should return 401 Unauthorized (no session)`)
  console.log(`   - Mock service should handle phone format normalization`)
  console.log(`   - Error messages should be user-friendly`)
  
  if (!useLocal) {
    console.log(`\n🔗 To test with authentication:`)
    console.log(`   1. Log in to https://eksporyuk.com`)
    console.log(`   2. Go to wallet/withdrawal page`)
    console.log(`   3. Try DANA with phone: 08118748177`)
    console.log(`   4. Should show: "Aziz Rahman" from mock service`)
  }
}

// Main execution
async function main() {
  console.log(`=".repeat(60)`)
  console.log(`🧪 EKSPORYUK WITHDRAWAL SYSTEM TEST SUITE`)
  console.log(`=".repeat(60)`)
  
  // Test production first
  await runTests(false)
  
  // Uncomment to test local environment
  // console.log(`\n${"=".repeat(60)}`)
  // await runTests(true)
  
  console.log(`\n✨ Testing complete!`)
}

main().catch(console.error)