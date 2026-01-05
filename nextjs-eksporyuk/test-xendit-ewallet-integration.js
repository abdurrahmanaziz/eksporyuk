// Test Xendit E-wallet Integration Verification
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testXenditEWalletIntegration() {
  console.log('🧪 Testing Xendit E-wallet Integration...\n')

  // Test 1: Check account name for DANA
  console.log('📱 Test 1: Account Name Verification (DANA)')
  try {
    const response = await fetch(`${BASE_URL}/api/ewallet/check-name-xendit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'DANA',
        phoneNumber: '08118748177'
      })
    })
    const data = await response.json()
    console.log('Response:', response.status, data)
  } catch (error) {
    console.error('Error:', error.message)
  }

  console.log('\n💳 Test 2: Account Name Verification (OVO)')
  try {
    const response = await fetch(`${BASE_URL}/api/ewallet/check-name-xendit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'OVO',
        phoneNumber: '08118748177'
      })
    })
    const data = await response.json()
    console.log('Response:', response.status, data)
  } catch (error) {
    console.error('Error:', error.message)
  }

  console.log('\n🔍 Test 3: Phone Number Normalization')
  const testNumbers = [
    '08118748177',  // Already correct
    '8118748177',   // Missing leading 0
    '+628118748177', // International format
    '628118748177'  // Without +
  ]
  
  testNumbers.forEach(number => {
    const normalized = normalizePhoneNumber(number)
    console.log(`${number} → ${normalized}`)
  })

  console.log('\n✅ Integration test complete!')
}

function normalizePhoneNumber(phoneNumber) {
  // Remove all non-numeric characters
  let cleaned = phoneNumber.replace(/\D/g, '')
  
  // Handle Indonesian phone numbers
  if (cleaned.startsWith('62')) {
    // Convert 62xxx to 0xxx (Indonesian format)
    cleaned = '0' + cleaned.substring(2)
  } else if (!cleaned.startsWith('0')) {
    // Add leading 0 if missing
    cleaned = '0' + cleaned
  }
  
  return cleaned
}

// Run test if this file is executed directly
if (require.main === module) {
  testXenditEWalletIntegration().catch(console.error)
}

module.exports = { testXenditEWalletIntegration, normalizePhoneNumber }