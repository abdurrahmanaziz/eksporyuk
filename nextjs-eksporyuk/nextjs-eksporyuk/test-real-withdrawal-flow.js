/**
 * Test Real Withdrawal Flow
 * Test actual e-wallet check endpoint dengan payload yang benar
 */

async function testRealWithdrawalFlow() {
  console.log('🧪 Testing Real E-wallet Withdrawal Flow')
  console.log('=' .repeat(60))

  const testCases = [
    {
      name: 'DANA Real Test',
      payload: {
        provider: 'DANA',
        phoneNumber: '081234567890'
      }
    },
    {
      name: 'OVO Real Test', 
      payload: {
        provider: 'OVO',
        phoneNumber: '081234567890'
      }
    },
    {
      name: 'Phone with +62',
      payload: {
        provider: 'DANA',
        phoneNumber: '+6281234567890'
      }
    },
    {
      name: 'Phone with 0',
      payload: {
        provider: 'DANA',
        phoneNumber: '081234567890'
      }
    },
    {
      name: 'Invalid phone',
      payload: {
        provider: 'DANA',
        phoneNumber: '123'
      }
    }
  ]

  for (const testCase of testCases) {
    console.log(`\n📱 Testing: ${testCase.name}`)
    console.log(`   Provider: ${testCase.payload.provider}`)
    console.log(`   Phone: ${testCase.payload.phoneNumber}`)

    try {
      // Test production endpoint
      const response = await fetch('https://eksporyuk.com/api/ewallet/check-name-xendit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: Real production would need Cookie/Authorization header
        },
        body: JSON.stringify(testCase.payload)
      })

      console.log(`   Status: ${response.status} ${response.statusText}`)

      try {
        const result = await response.json()
        
        if (response.ok) {
          console.log(`   ✅ Success: ${result.success}`)
          if (result.success && result.accountName) {
            console.log(`   💰 Account: ${result.accountName}`)
            console.log(`   🔧 Source: ${result.source}`)
            console.log(`   📝 Message: ${result.message || 'N/A'}`)
          }
        } else {
          console.log(`   ❌ Error: ${result.error}`)
          console.log(`   📝 Message: ${result.message || 'N/A'}`)
          
          // Check if it's auth error (expected)
          if (response.status === 401) {
            console.log(`   ℹ️  Note: 401 Unauthorized is expected without login session`)
          }
        }
        
        // Log full response for debugging
        console.log(`   🔍 Full Response:`, JSON.stringify(result, null, 2))
        
      } catch (parseError) {
        console.log(`   💥 JSON Parse Error: ${parseError.message}`)
        const textResponse = await response.text()
        console.log(`   📄 Raw Response: ${textResponse.substring(0, 200)}...`)
      }
      
    } catch (networkError) {
      console.log(`   🚫 Network Error: ${networkError.message}`)
    }
    
    console.log('   ' + '-'.repeat(50))
  }

  console.log('\n🎯 Analysis Summary:')
  console.log('✅ Check if endpoints return proper error messages')
  console.log('✅ Verify phone number normalization works')
  console.log('✅ Test different phone formats (+62, 0, raw digits)')
  console.log('✅ Confirm authentication is working (401 expected)')
  console.log('✅ Look for any server errors or config issues')
  
  console.log('\n💡 Next Steps:')
  console.log('1. If all return 401 Unauthorized → Auth working correctly')
  console.log('2. If server errors (500) → Configuration issue')
  console.log('3. If wrong JSON format → Response parsing issue')
  console.log('4. Check actual UI behavior with logged-in user')
}

// Run the test
testRealWithdrawalFlow().catch(error => {
  console.error('💥 Test suite failed:', error)
})