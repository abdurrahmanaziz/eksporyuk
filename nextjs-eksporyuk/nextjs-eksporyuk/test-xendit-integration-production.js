/**
 * Test Xendit Integration & Environment Variables
 * Check if Xendit is properly configured in production
 */

const API_BASE = 'https://eksporyuk.com'

async function testXenditIntegration() {
  console.log('🧪 Testing Xendit Integration...\n')

  // Test 1: Check environment/config endpoint
  console.log('📍 1. Testing environment configuration...')
  try {
    const envResponse = await fetch(`${API_BASE}/api/debug/env`)
    console.log('Environment check status:', envResponse.status)
    
    if (envResponse.status === 200) {
      const envData = await envResponse.json()
      console.log('Environment data available:', !!envData)
    }
  } catch (error) {
    console.error('Environment check failed:', error.message)
  }

  // Test 2: Test DANA account check (actual error from user)
  console.log('\n📍 2. Testing DANA account validation...')
  try {
    const danaResponse = await fetch(`${API_BASE}/api/ewallet/check-name-xendit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Mock session - in real test this would need proper auth
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        provider: 'DANA',
        phoneNumber: '08118748177' // From user screenshot
      })
    })

    console.log('DANA check status:', danaResponse.status)
    const danaData = await danaResponse.json()
    console.log('DANA response:', danaData)

  } catch (error) {
    console.error('DANA check failed:', error.message)
  }

  // Test 3: Test bank transfer endpoint availability
  console.log('\n📍 3. Testing bank transfer endpoint...')
  try {
    const bankResponse = await fetch(`${API_BASE}/api/affiliate/payouts/xendit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 50000,
        bankName: 'BCA',
        accountName: 'Test',
        accountNumber: '1234567890'
      })
    })

    console.log('Bank transfer endpoint status:', bankResponse.status)
    const bankData = await bankResponse.json()
    console.log('Bank transfer response:', bankData)

  } catch (error) {
    console.error('Bank transfer test failed:', error.message)
  }

  // Test 4: Check Xendit service configuration
  console.log('\n📍 4. Testing Xendit service status...')
  try {
    // This would be a dedicated endpoint to check Xendit status
    const statusResponse = await fetch(`${API_BASE}/api/test/xendit-status`)
    console.log('Xendit status endpoint:', statusResponse.status)
    
    if (statusResponse.status === 200) {
      const statusData = await statusResponse.json()
      console.log('Xendit configuration:', statusData)
    }
  } catch (error) {
    console.log('No dedicated Xendit status endpoint available')
  }

  console.log('\n📊 ANALYSIS SUMMARY:')
  console.log('• Check server logs for detailed error messages')
  console.log('• Verify XENDIT_SECRET_KEY is set in production environment') 
  console.log('• Ensure Xendit API endpoints are accessible from production server')
  console.log('• Check if affiliate balance system is properly connected to Xendit')
}

async function main() {
  console.log('🔍 XENDIT INTEGRATION DIAGNOSTIC\n')
  console.log('=' .repeat(50))
  
  await testXenditIntegration()
  
  console.log('\n' + '='.repeat(50))
  console.log('✅ Diagnostic complete!')
  console.log('\nNext steps:')
  console.log('1. Check production server logs')
  console.log('2. Verify Xendit credentials')
  console.log('3. Test affiliate balance integration')
}

main().catch(console.error)