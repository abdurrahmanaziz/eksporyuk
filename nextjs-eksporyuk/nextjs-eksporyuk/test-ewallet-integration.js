/**
 * Test E-wallet Check System
 * Tests both local and production e-wallet name checking
 */

const baseURLs = {
  local: 'http://localhost:3000',
  production: 'https://eksporyuk.com'
}

async function testEWalletCheck(baseURL, environment) {
  console.log(`\n🧪 Testing E-wallet Check - ${environment.toUpperCase()}`)
  console.log('='.repeat(60))

  try {
    // Test cases
    const testCases = [
      {
        name: 'DANA Valid Number',
        provider: 'DANA',
        phoneNumber: '081234567890'
      },
      {
        name: 'OVO Valid Number',
        provider: 'OVO', 
        phoneNumber: '081234567890'
      },
      {
        name: 'Invalid Phone Number',
        provider: 'DANA',
        phoneNumber: '123'
      }
    ]

    for (const testCase of testCases) {
      console.log(`\n📱 Testing: ${testCase.name}`)
      console.log(`   Provider: ${testCase.provider}`)
      console.log(`   Phone: ${testCase.phoneNumber}`)

      try {
        const response = await fetch(`${baseURL}/api/ewallet/check-name-xendit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            provider: testCase.provider,
            phoneNumber: testCase.phoneNumber
          })
        })

        const result = await response.json()
        
        console.log(`   Status: ${response.status}`)
        console.log(`   Success: ${result.success}`)
        
        if (result.success) {
          console.log(`   ✅ Account Name: ${result.accountName}`)
          console.log(`   Source: ${result.source}`)
          console.log(`   Message: ${result.message}`)
        } else {
          console.log(`   ❌ Error: ${result.error}`)
          console.log(`   Message: ${result.message}`)
        }

      } catch (error) {
        console.log(`   💥 Exception: ${error.message}`)
      }
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`)
  }
}

async function testXenditStatus(baseURL, environment) {
  console.log(`\n🔧 Testing Xendit Status - ${environment.toUpperCase()}`)
  console.log('='.repeat(60))

  try {
    const response = await fetch(`${baseURL}/api/test/xendit-status`)
    
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status}`)
      const errorText = await response.text()
      console.log(`   Response: ${errorText}`)
      return
    }

    const result = await response.json()
    
    console.log(`📊 Timestamp: ${result.timestamp}`)
    console.log(`🌍 Environment:`)
    console.log(`   Node Env: ${result.environment.nodeEnv}`)
    console.log(`   Has Xendit Key: ${result.environment.hasSecretKey}`)
    console.log(`   Key Length: ${result.environment.secretKeyLength}`)
    console.log(`   Is Placeholder: ${result.environment.isPlaceholder}`)
    
    console.log(`🔌 Xendit Status:`)
    console.log(`   Connectivity: ${result.xendit.connectivity}`)
    console.log(`   Payout Service: ${result.xendit.payoutService}`)
    console.log(`   Bank Service: ${result.xendit.bankService}`)
    
    if (result.xendit.error) {
      console.log(`   Error: ${result.xendit.error}`)
    }

    console.log(`📋 Overall Diagnosis: ${result.diagnosis.overall}`)
    
    if (result.diagnosis.recommendations.length > 0) {
      console.log(`💡 Recommendations:`)
      result.diagnosis.recommendations.forEach(rec => {
        console.log(`   • ${rec}`)
      })
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`)
  }
}

async function runTests() {
  console.log('🚀 E-wallet Integration Test Suite')
  console.log('=' .repeat(80))
  
  // Test local environment first
  await testXenditStatus(baseURLs.local, 'local')
  await testEWalletCheck(baseURLs.local, 'local')
  
  // Then test production
  await testXenditStatus(baseURLs.production, 'production')
  await testEWalletCheck(baseURLs.production, 'production')
  
  console.log('\n🎯 Test Summary:')
  console.log('✅ Check if Xendit configuration is healthy')
  console.log('✅ Test e-wallet name validation with various providers')
  console.log('✅ Compare local vs production behavior')
  console.log('\nNext steps if tests fail:')
  console.log('1. Check environment variables (XENDIT_SECRET_KEY)')
  console.log('2. Verify Xendit API credentials')
  console.log('3. Check network connectivity')
  console.log('4. Review server logs for detailed errors')
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test suite failed:', error)
})